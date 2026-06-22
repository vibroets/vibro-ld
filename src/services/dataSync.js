import { db, isFirebaseConfigured } from '../firebaseConfig';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc
} from 'firebase/firestore';

// Keys that should be synced between web and mobile
const SYNCED_KEYS = [
  'users',
  'quizzes',
  'videos',
  'trainingItems',
  'quizResults',
  'certificates',
  'trainingCompletions'
];

// Keys that users generate on mobile (need merge-based push, not wipe+rewrite)
const USER_GENERATED_KEYS = [
  'quizResults',
  'certificates',
  'trainingCompletions'
];

// Max file size for base64 sync through Firestore (~750KB to stay under 1MB doc limit)
const MAX_ASSET_SIZE = 750000;

// --- IndexedDB helpers for training asset sync ---

function readAllTrainingAssetsFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('VideoTrainingDB', 5);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('trainingAssets')) {
        resolve([]);
        return;
      }
      const transaction = db.transaction(['trainingAssets'], 'readonly');
      const store = transaction.objectStore('trainingAssets');
      const getAll = store.getAll();
      getAll.onsuccess = () => resolve(getAll.result || []);
      getAll.onerror = () => reject(getAll.error);
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('videos')) {
        db.createObjectStore('videos', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('trainingAssets')) {
        db.createObjectStore('trainingAssets', { keyPath: 'id' });
      }
    };
  });
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64) {
  const [meta, data] = base64.split(',');
  const mimeMatch = meta.match(/data:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

function storeTrainingAssetInIndexedDB(assetId, blob, fileType, fileName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('VideoTrainingDB', 5);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('trainingAssets')) {
        reject(new Error('trainingAssets store not found'));
        return;
      }
      const transaction = db.transaction(['trainingAssets'], 'readwrite');
      const store = transaction.objectStore('trainingAssets');
      const assetData = {
        id: assetId,
        file: blob,
        fileType,
        fileName,
        createdAt: new Date().toISOString()
      };
      const putReq = store.put(assetData);
      putReq.onsuccess = () => resolve(assetId);
      putReq.onerror = () => reject(putReq.error);
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('videos')) {
        db.createObjectStore('videos', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('trainingAssets')) {
        db.createObjectStore('trainingAssets', { keyPath: 'id' });
      }
    };
  });
}

/**
 * Push training assets (files stored in IndexedDB) to Firestore as base64
 */
export async function pushTrainingAssetsToCloud() {
  if (!isFirebaseConfigured) return false;

  try {
    const assets = await readAllTrainingAssetsFromIndexedDB();
    if (assets.length === 0) {
      return true;
    }

    // Clear existing assets collection
    const colRef = collection(db, 'trainingAssets');
    const existing = await getDocs(colRef);
    const deletePromises = existing.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);

    for (const asset of assets) {
      const fileSize = asset.file.size || 0;
      if (fileSize > MAX_ASSET_SIZE) {
        continue;
      }

      const base64 = await blobToBase64(asset.file);
      await setDoc(doc(colRef, asset.id), {
        id: asset.id,
        fileBase64: base64,
        fileType: asset.fileType || asset.file.type,
        fileName: asset.fileName || asset.id,
        createdAt: asset.createdAt || new Date().toISOString(),
        _syncedAt: new Date().toISOString()
      });
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Pull training assets from Firestore and store in IndexedDB
 */
export async function pullTrainingAssetsFromCloud() {
  if (!isFirebaseConfigured) return false;

  try {
    const colRef = collection(db, 'trainingAssets');
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      return true;
    }

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (!data.fileBase64) return;

      try {
        const blob = base64ToBlob(data.fileBase64);
        storeTrainingAssetInIndexedDB(data.id, blob, data.fileType, data.fileName);
      } catch (err) {
      }
    });

    // Wait a bit for async IndexedDB writes to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Push all local data to Firestore (used by admin web app)
 * First pulls user-generated data from cloud (mobile submissions) and merges,
 * then pushes the merged result so mobile submissions are not lost.
 */
export async function pushLocalDataToCloud() {
  if (!isFirebaseConfigured) {
    return false;
  }

  try {
    // Merge-push all data (only writes changed/new docs, no wipe)
    // The periodic pull in setupAutoSync already keeps user-generated data merged
    for (const key of SYNCED_KEYS) {
      if (USER_GENERATED_KEYS.includes(key)) {
        await mergePushUserKeyToCloud(key, null);
      } else {
        await mergePushAdminKeyToCloud(key);
      }
    }
    
    
    // Also push training assets from IndexedDB
    await pushTrainingAssetsToCloud();
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Merge-push admin-only key to Firestore.
 * Only writes docs that are new or changed — does NOT wipe the collection.
 */
async function mergePushAdminKeyToCloud(key) {
  if (!isFirebaseConfigured || !SYNCED_KEYS.includes(key)) return false;

  try {
    const localData = JSON.parse(localStorage.getItem(key) || '[]');
    const colRef = collection(db, key);
    const snapshot = await getDocs(colRef);

    // Build a map of existing server docs
    const serverDocs = {};
    const serverIds = new Set();
    snapshot.forEach(d => {
      const data = d.data();
      delete data._syncedAt;
      serverDocs[d.id] = data;
      serverIds.add(d.id);
    });

    // Find docs to write (new or changed)
    const localIds = new Set();
    const toWrite = [];
    for (const item of localData) {
      const docId = item.id || `item-${Math.random().toString(36).substr(2, 9)}`;
      localIds.add(docId);
      const serverItem = serverDocs[docId];
      if (!serverItem || JSON.stringify(serverItem) !== JSON.stringify(item)) {
        toWrite.push({ ...item, id: docId });
      }
    }

    // Find docs to delete (exist on server but not in local)
    const toDelete = [];
    for (const id of serverIds) {
      if (!localIds.has(id)) {
        toDelete.push(id);
      }
    }

    // Write changed/new docs
    for (const item of toWrite) {
      const docRef = doc(colRef, item.id);
      await setDoc(docRef, { ...item, _syncedAt: new Date().toISOString() }, { merge: true });
    }

    // Delete docs that no longer exist locally
    for (const id of toDelete) {
      await deleteDoc(doc(colRef, id));
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Pull all data from Firestore to localStorage (used by mobile app)
 */
export async function pullCloudDataToLocal() {
  if (!isFirebaseConfigured) {
    return false;
  }

  try {
    for (const key of SYNCED_KEYS) {
      const colRef = collection(db, key);
      const snapshot = await getDocs(colRef);
      const data = [];
      snapshot.forEach(doc => {
        const item = doc.data();
        delete item._syncedAt;
        data.push(item);
      });
      localStorage.setItem(key, JSON.stringify(data));
    }
    
    
    // Also pull training assets and restore to IndexedDB
    await pullTrainingAssetsFromCloud();
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Push a single key to Firestore (for incremental updates)
 * Uses merge-push for all keys — only writes changed/new docs, never wipes.
 */
export async function pushKeyToCloud(key) {
  if (!isFirebaseConfigured || !SYNCED_KEYS.includes(key)) return false;
  
  if (USER_GENERATED_KEYS.includes(key)) {
    return mergePushUserKeyToCloud(key, null);
  }
  return mergePushAdminKeyToCloud(key);
}

/**
 * Merge-push user-generated data to Firestore.
 * Only adds/updates the user's own documents - does NOT wipe the collection.
 * Merges with existing server data to avoid losing other users' data.
 */
export async function mergePushUserKeyToCloud(key, userId) {
  if (!isFirebaseConfigured || !USER_GENERATED_KEYS.includes(key)) return false;

  try {
    const localData = JSON.parse(localStorage.getItem(key) || '[]');
    if (localData.length === 0) return true;

    const colRef = collection(db, key);
    const snapshot = await getDocs(colRef);

    // Build a map of existing server docs
    const serverDocs = {};
    snapshot.forEach(d => {
      const data = d.data();
      delete data._syncedAt;
      serverDocs[d.id] = data;
    });

    // Merge: update local items into server map (local takes priority for user's own data)
    let changed = false;
    const toWrite = [];
    for (const item of localData) {
      // Skip items without an ID - they can't be synced to Firestore
      if (!item.id) {
        continue;
      }
      const docId = item.id;
      const serverItem = serverDocs[docId];
      if (!serverItem || JSON.stringify(serverItem) !== JSON.stringify(item)) {
        toWrite.push(item);
        serverDocs[docId] = item;
        changed = true;
      }
    }

    if (!changed) {
      return true;
    }

    // Write only changed docs (merge, not wipe)
    for (const item of toWrite) {
      const docRef = doc(colRef, item.id);
      await setDoc(docRef, { ...item, _syncedAt: new Date().toISOString() }, { merge: true });
    }

    return true;
  } catch (error) {
    return false;
  }
}

let adminPullInterval = null;
let onAdminDataUpdate = null;
let isPullingFromCloud = false;
let autoSyncSetupDone = false;

/**
 * Pull a single key from Firestore and MERGE with local data.
 * For user-generated keys, preserves local items that aren't on server yet.
 * For admin-only keys, replaces local entirely when in admin mode; in user mode
 * merges so local data is not accidentally wiped if the cloud copy is empty.
 */
export async function pullAndMergeKeyFromCloud(key, userId) {
  if (!isFirebaseConfigured || !SYNCED_KEYS.includes(key)) return false;

  const isUserMode = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('appMode') === 'user';
  const wasPulling = isPullingFromCloud;
  isPullingFromCloud = true;
  try {
    const colRef = collection(db, key);
    const snapshot = await getDocs(colRef);
    const serverData = [];
    snapshot.forEach(d => {
      const item = d.data();
      delete item._syncedAt;
      serverData.push(item);
    });

    const localData = JSON.parse(localStorage.getItem(key) || '[]');

    if (USER_GENERATED_KEYS.includes(key)) {
      // Merge: keep local items that don't exist on server, update with server data
      const serverIds = new Set(serverData.map(d => d.id));
      
      // Keep local items not yet on server (offline submissions)
      const localOnly = localData.filter(d => !serverIds.has(d.id));
      
      // Server data + local-only items
      const merged = [...serverData, ...localOnly];
      localStorage.setItem(key, JSON.stringify(merged));
    } else if (isUserMode) {
      // In user mode, merge admin-only keys to avoid wiping local data when cloud is empty
      const serverIds = new Set(serverData.map(d => d.id));
      const localOnly = localData.filter(d => !serverIds.has(d.id));
      const merged = [...serverData, ...localOnly];
      localStorage.setItem(key, JSON.stringify(merged));
    } else {
      // Admin-only keys in admin mode: replace entirely
      localStorage.setItem(key, JSON.stringify(serverData));
    }

    return true;
  } catch (error) {
    return false;
  } finally {
    isPullingFromCloud = wasPulling;
  }
}

/**
 * Set up auto-sync: listen to localStorage changes and push to cloud
 * Also periodically pulls user-generated data from cloud (mobile submissions)
 */

export function setAdminDataUpdateCallback(callback) {
  onAdminDataUpdate = callback;
}

export function setupAutoSync() {
  if (!isFirebaseConfigured) return;
  if (autoSyncSetupDone) return; // Prevent double-setup (React StrictMode)
  autoSyncSetupDone = true;
  
  window.addEventListener('storage', (e) => {
    if (SYNCED_KEYS.includes(e.key) && !isPullingFromCloud) {
      pushKeyToCloud(e.key);
    }
  });
  
  // Also intercept setItem calls since 'storage' event doesn't fire in same tab
  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function(key, value) {
    const oldValue = localStorage.getItem(key);
    originalSetItem(key, value);
    // Skip auto-sync if: (1) write came from a cloud pull, or (2) value didn't actually change
    if (SYNCED_KEYS.includes(key) && !isPullingFromCloud && oldValue !== value) {
      pushKeyToCloud(key);
    }
  };

  // One-time initial pull of user-generated data on launch
  // This picks up any mobile submissions that arrived while admin was away
  (async () => {
    if (isPullingFromCloud) return;
    isPullingFromCloud = true;
    let changed = false;
    for (const key of USER_GENERATED_KEYS) {
      const before = localStorage.getItem(key) || '[]';
      await pullAndMergeKeyFromCloud(key, null);
      const after = localStorage.getItem(key) || '[]';
      if (before !== after) changed = true;
    }
    isPullingFromCloud = false;
    if (changed && onAdminDataUpdate) {
      onAdminDataUpdate();
    }
  })();

  // Periodically pull user-generated data from cloud (every 2 minutes)
  // This picks up mobile submissions without manual sync
  if (adminPullInterval) clearInterval(adminPullInterval);
  adminPullInterval = setInterval(async () => {
    if (isPullingFromCloud) return; // Skip if previous pull still running
    isPullingFromCloud = true;
    let changed = false;
    for (const key of USER_GENERATED_KEYS) {
      const before = localStorage.getItem(key) || '[]';
      await pullAndMergeKeyFromCloud(key, null);
      const after = localStorage.getItem(key) || '[]';
      if (before !== after) {
        changed = true;
      }
    }
    isPullingFromCloud = false;
    if (changed && onAdminDataUpdate) {
      onAdminDataUpdate();
    }
  }, 2 * 60 * 1000);
}

export function teardownAdminAutoSync() {
  if (adminPullInterval) {
    clearInterval(adminPullInterval);
    adminPullInterval = null;
  }
  autoSyncSetupDone = false;
}

// --- User-mode offline sync system ---

let userSyncInterval = null;
let isSyncing = false;
let onSyncStatusChange = null;

/**
 * Set callback for sync status updates (online/offline/syncing)
 */
export function setSyncStatusCallback(callback) {
  onSyncStatusChange = callback;
}

function notifySyncStatus(status) {
  if (onSyncStatusChange) onSyncStatusChange(status);
}

/**
 * Push all user-generated data to cloud (merge mode)
 */
async function pushUserDataToCloud(userId) {
  for (const key of USER_GENERATED_KEYS) {
    await mergePushUserKeyToCloud(key, userId);
  }
}

/**
 * Pull all data from cloud with merge for user-generated keys
 */
async function pullAllDataWithMerge(userId) {
  for (const key of SYNCED_KEYS) {
    await pullAndMergeKeyFromCloud(key, userId);
  }
  // Also pull training assets
  await pullTrainingAssetsFromCloud();
}

/**
 * Do a full sync cycle: push user data, then pull latest
 */
async function doUserSync(userId) {
  if (isSyncing) return;
  if (!navigator.onLine) {
    notifySyncStatus('offline');
    return;
  }

  isSyncing = true;
  notifySyncStatus('syncing');

  try {
    
    // Push user-generated data first (quiz results, certificates, completions)
    await pushUserDataToCloud(userId);

    // Then pull latest data (merge mode preserves offline submissions)
    await pullAllDataWithMerge(userId);

    notifySyncStatus('synced');
    localStorage.setItem('lastUserSyncAt', new Date().toISOString());
  } catch (error) {
    notifySyncStatus('error');
  } finally {
    isSyncing = false;
  }
}

/**
 * Set up user-mode auto-sync:
 * - Sync on app launch
 * - Sync periodically (every 2 minutes)
 * - Sync when coming back online
 * - Intercept localStorage.setItem for user-generated keys to queue sync
 * - Works fully offline, pushes when online
 */
export function setupUserAutoSync(userId) {
  if (!isFirebaseConfigured || !userId) return;

  // Initial sync on launch
  doUserSync(userId);

  // Periodic sync every 2 minutes
  if (userSyncInterval) clearInterval(userSyncInterval);
  userSyncInterval = setInterval(() => {
    doUserSync(userId);
  }, 2 * 60 * 1000);

  // Sync when coming back online
  window.addEventListener('online', () => {
    notifySyncStatus('online');
    doUserSync(userId);
  });

  // Notify offline status
  window.addEventListener('offline', () => {
    notifySyncStatus('offline');
  });

  // Intercept localStorage.setItem for user-generated keys
  // Queue a debounced sync when user data changes
  let syncTimer = null;
  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function(key, value) {
    originalSetItem(key, value);
    if (USER_GENERATED_KEYS.includes(key)) {
      // Debounce: wait 3 seconds after last change before syncing
      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = setTimeout(() => {
        doUserSync(userId);
      }, 3000);
    }
  };

  // Also listen to storage events from other tabs
  window.addEventListener('storage', (e) => {
    if (USER_GENERATED_KEYS.includes(e.key)) {
      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = setTimeout(() => {
        doUserSync(userId);
      }, 3000);
    }
  });
}

/**
 * Manually trigger a user sync (used by refresh button)
 */
export async function triggerUserSync(userId) {
  await doUserSync(userId);
}

/**
 * Clean up user sync (on logout)
 */
export function teardownUserAutoSync() {
  if (userSyncInterval) {
    clearInterval(userSyncInterval);
    userSyncInterval = null;
  }
}

export { SYNCED_KEYS, isFirebaseConfigured };
