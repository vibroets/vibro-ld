// Biometric Authentication Service
// Uses native Capacitor biometric plugin when running in the mobile app,
// and falls back to WebAuthn on the web.

import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

const BIOMETRIC_CONFIG = {
  rpName: 'L&D Software',
  rpId: window.location.hostname, // In production, use your actual domain
  timeout: 60000,
};

const NATIVE_BIOMETRIC_SERVER = 'ldsoftware';

const isNativePlatform = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

const isWebAuthnSupported = () => {
  return !!(window.navigator && window.navigator.credentials && window.navigator.credentials.create && window.navigator.credentials.get);
};

/**
 * Check if biometric authentication is available on this device
 */
export const isBiometricSupported = () => {
  if (isNativePlatform()) {
    return true;
  }
  return isWebAuthnSupported();
};

/**
 * Check if biometric hardware is available and configured on native devices
 */
export const isNativeBiometricAvailable = async () => {
  if (!isNativePlatform()) {
    return { isAvailable: false, message: 'Not running in native app.' };
  }
  try {
    const result = await NativeBiometric.isAvailable();
    return {
      isAvailable: result.isAvailable,
      biometryType: result.biometryType,
      message: result.isAvailable ? 'Biometric is available.' : 'No biometric hardware or credentials configured.'
    };
  } catch (error) {
    return {
      isAvailable: false,
      message: error?.message || 'Failed to check biometric availability.'
    };
  }
};

const getNativeServerKey = (userId) => `${NATIVE_BIOMETRIC_SERVER}-${userId}`;

const getNativeBiometricUsers = () => {
  try {
    return JSON.parse(localStorage.getItem('nativeBiometricUsers') || '[]');
  } catch {
    return [];
  }
};

const setNativeBiometricUsers = (users) => {
  localStorage.setItem('nativeBiometricUsers', JSON.stringify(users));
};

/**
 * Register biometric credential for a user
 * Call this after successful password login to enable biometric login
 */
export const registerBiometric = async (userId, userName) => {
  try {
    // Native Capacitor app path
    if (isNativePlatform()) {
      const available = await NativeBiometric.isAvailable();
      if (!available.isAvailable) {
        return {
          success: false,
          message: 'Biometric authentication is not available on this device.'
        };
      }

      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.id === userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found.'
        };
      }

      await NativeBiometric.setCredentials({
        username: user.id,
        password: user.password || '12345',
        server: getNativeServerKey(userId),
      });

      const nativeBiometricUsers = getNativeBiometricUsers();
      if (!nativeBiometricUsers.includes(userId)) {
        nativeBiometricUsers.push(userId);
        setNativeBiometricUsers(nativeBiometricUsers);
      }

      return {
        success: true,
        message: 'Fingerprint login enabled successfully.'
      };
    }

    // Web / WebAuthn path
    if (!isWebAuthnSupported()) {
      return {
        success: false,
        message: 'Biometric authentication is not supported on this device.'
      };
    }

    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const createCredentialOptions = {
      challenge: challenge,
      rp: {
        name: BIOMETRIC_CONFIG.rpName,
        id: BIOMETRIC_CONFIG.rpId,
      },
      user: {
        id: new TextEncoder().encode(userId),
        name: userName,
        displayName: userName,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        userVerification: 'required',
      },
      attestation: 'none',
      timeout: BIOMETRIC_CONFIG.timeout,
    };

    const credential = await navigator.credentials.create({
      publicKey: createCredentialOptions,
    });

    if (!credential) {
      return {
        success: false,
        message: 'Biometric registration failed.'
      };
    }

    const biometricData = {
      credentialId: Array.from(new Uint8Array(credential.rawId)),
      userId: userId,
      userName: userName,
      registeredAt: new Date().toISOString(),
    };

    const biometricCredentials = JSON.parse(localStorage.getItem('biometricCredentials') || '{}');
    biometricCredentials[userId] = biometricData;
    localStorage.setItem('biometricCredentials', JSON.stringify(biometricCredentials));

    return {
      success: true,
      message: 'Biometric registration successful. You can now use fingerprint or face recognition to login.'
    };
  } catch (error) {
    if (isNativePlatform()) {
      return {
        success: false,
        message: error?.message || 'Biometric registration failed. Please try again.'
      };
    }
    if (error.name === 'NotAllowedError') {
      return {
        success: false,
        message: 'Biometric registration was cancelled or not allowed.'
      };
    } else if (error.name === 'NotSupportedError') {
      return {
        success: false,
        message: 'Biometric authentication is not supported on this device.'
      };
    } else if (error.name === 'SecurityError') {
      return {
        success: false,
        message: 'Security error. Please ensure you are using HTTPS or localhost.'
      };
    }
    return {
      success: false,
      message: 'Biometric registration failed. Please try again.'
    };
  }
};

/**
 * Authenticate using biometric credentials
 */
export const authenticateBiometric = async (userId) => {
  try {
    // Native Capacitor app path
    if (isNativePlatform()) {
      const available = await NativeBiometric.isAvailable();
      if (!available.isAvailable) {
        return {
          success: false,
          message: 'Biometric authentication is not available on this device.'
        };
      }

      await NativeBiometric.verifyIdentity({
        reason: 'Authenticate to access L&D Software',
        title: 'Biometric Login',
        subtitle: 'Verify your identity',
        description: 'Use your fingerprint or face recognition',
      });

      const credentials = await NativeBiometric.getCredentials({
        server: getNativeServerKey(userId),
      });

      if (!credentials) {
        return {
          success: false,
          message: 'No biometric credentials found for this account. Please login with password first.'
        };
      }

      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.id === credentials.username);
      if (!user) {
        return {
          success: false,
          message: 'User account not found.'
        };
      }

      const userPassword = user.password || '12345';
      if (credentials.password !== userPassword) {
        return {
          success: false,
          message: 'Stored credentials do not match. Please login with password.'
        };
      }

      return {
        success: true,
        message: 'Biometric authentication successful.',
        userId: user.id,
      };
    }

    // Web / WebAuthn path
    if (!isWebAuthnSupported()) {
      return {
        success: false,
        message: 'Biometric authentication is not supported on this device.'
      };
    }

    const biometricCredentials = JSON.parse(localStorage.getItem('biometricCredentials') || '{}');
    const biometricData = biometricCredentials[userId];

    if (!biometricData) {
      return {
        success: false,
        message: 'No biometric credential found. Please login with password first to register biometric.'
      };
    }

    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const getCredentialOptions = {
      challenge: challenge,
      rpId: BIOMETRIC_CONFIG.rpId,
      userVerification: 'required',
      timeout: BIOMETRIC_CONFIG.timeout,
      allowCredentials: [
        {
          id: new Uint8Array(biometricData.credentialId),
          type: 'public-key',
        },
      ],
    };

    const assertion = await navigator.credentials.get({
      publicKey: getCredentialOptions,
    });

    if (!assertion) {
      return {
        success: false,
        message: 'Biometric authentication failed.'
      };
    }

    return {
      success: true,
      message: 'Biometric authentication successful.',
      userId: userId,
    };
  } catch (error) {
    if (isNativePlatform()) {
      return {
        success: false,
        message: error?.message || 'Biometric authentication failed. Please try again.'
      };
    }
    if (error.name === 'NotAllowedError') {
      return {
        success: false,
        message: 'Biometric authentication was cancelled or not allowed.'
      };
    } else if (error.name === 'NotSupportedError') {
      return {
        success: false,
        message: 'Biometric authentication is not supported on this device.'
      };
    } else if (error.name === 'SecurityError') {
      return {
        success: false,
        message: 'Security error. Please ensure you are using HTTPS or localhost.'
      };
    }
    return {
      success: false,
      message: 'Biometric authentication failed. Please try again.'
    };
  }
};

/**
 * Check if user has registered biometric credentials
 */
export const hasBiometricCredential = (userId) => {
  if (isNativePlatform()) {
    const nativeBiometricUsers = getNativeBiometricUsers();
    return nativeBiometricUsers.includes(userId);
  }
  const biometricCredentials = JSON.parse(localStorage.getItem('biometricCredentials') || '{}');
  return !!biometricCredentials[userId];
};

/**
 * Remove biometric credential for a user
 */
export const removeBiometricCredential = async (userId) => {
  if (isNativePlatform()) {
    try {
      await NativeBiometric.deleteCredentials({
        server: getNativeServerKey(userId),
      });
    } catch {
      // Ignore cleanup errors
    }
    const nativeBiometricUsers = getNativeBiometricUsers();
    const updated = nativeBiometricUsers.filter(id => id !== userId);
    setNativeBiometricUsers(updated);
  }

  const biometricCredentials = JSON.parse(localStorage.getItem('biometricCredentials') || '{}');
  delete biometricCredentials[userId];
  localStorage.setItem('biometricCredentials', JSON.stringify(biometricCredentials));

  return {
    success: true,
    message: 'Biometric credential removed successfully.'
  };
};

const biometricAuth = {
  isBiometricSupported,
  isNativeBiometricAvailable,
  registerBiometric,
  authenticateBiometric,
  hasBiometricCredential,
  removeBiometricCredential
};

export default biometricAuth;
