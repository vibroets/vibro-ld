import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Play, FileText, Download, Printer, Share2, X, CheckCircle } from 'lucide-react';
import Sidebar from './Sidebar';
import PdfViewer from './PdfViewer';

const TrainingViewer = () => {
  const { trainingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [trainingItem, setTrainingItem] = useState(null);

  const goBack = () => {
    const storedFrom = sessionStorage.getItem('lastUserBackRoute');
    if (location.state?.from) {
      navigate(location.state.from);
    } else if (storedFrom) {
      navigate(storedFrom);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/user-dashboard/quizzes');
    }
  };
  const [loading, setLoading] = useState(true);
  const [assetUrl, setAssetUrl] = useState('');
  const [assetError, setAssetError] = useState('');
  const [sharePopupOpen, setSharePopupOpen] = useState(false);
  const [selectedShareUsers, setSelectedShareUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [shareResult, setShareResult] = useState('');
  const [videoProgress, setVideoProgress] = useState(0);
  const [allowStart, setAllowStart] = useState(false);
  const [documentViewed, setDocumentViewed] = useState(false);
  const [documentConfirmed, setDocumentConfirmed] = useState(false);
  const [documentPopupOpen, setDocumentPopupOpen] = useState(false);
  const [reachedBottom, setReachedBottom] = useState(false);
  const [pdfPageInfo, setPdfPageInfo] = useState({ currentPage: 0, numPages: 0 });
  const videoRef = useRef(null);
  const documentScrollRef = useRef(null);

  const normalizeTrainingItem = (item) => ({
    ...item,
    selectedUsers: Array.isArray(item.selectedUsers) ? item.selectedUsers : [],
    sharedWith: Array.isArray(item.sharedWith) ? item.sharedWith : [],
    allowDownload: item.allowDownload ?? false,
    allowPrint: item.allowPrint ?? false,
    allowShare: item.allowShare ?? false,
    followUpType: item.followUpType || 'quiz',
    followUpId: item.followUpId || '',
    questionsPerUser: item.questionsPerUser || 15,
    timeLimit: item.timeLimit || 30,
    passPercentage: item.passPercentage || 60,
    assetType: item.assetType || 'document',
    sourceType: item.sourceType || 'url',
    type: 'training'
  });

  const getAssetFromIndexedDB = (assetId) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('VideoTrainingDB', 5);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('trainingAssets')) {
          reject(new Error('Training asset store not found'));
          return;
        }
        const transaction = db.transaction(['trainingAssets'], 'readonly');
        const store = transaction.objectStore('trainingAssets');
        const getRequest = store.get(assetId);
        getRequest.onsuccess = () => {
          const assetData = getRequest.result;
          if (assetData && assetData.file) {
            const blobUrl = URL.createObjectURL(assetData.file);
            // Return both URL and file metadata
            resolve({
              url: blobUrl,
              fileType: assetData.fileType || assetData.file.type,
              fileName: assetData.fileName || assetData.file.name
            });
          } else {
            reject(new Error('Asset not found in IndexedDB'));
          }
        };
        getRequest.onerror = () => reject(getRequest.error);
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
  };

  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    setAllUsers(storedUsers);

    const storedItems = JSON.parse(localStorage.getItem('trainingItems') || '[]');
    const item = storedItems.find((entry) => entry.id === trainingId);
    if (!item) {
      alert('Training item not found. Please contact your administrator.');
      navigate('/user-dashboard');
      return;
    }

    const normalizedItem = normalizeTrainingItem(item);
    setTrainingItem(normalizedItem);
    if (normalizedItem.sourceType === 'file' && normalizedItem.fileUrl?.startsWith('indexeddb://')) {
      const assetId = item.fileUrl.replace('indexeddb://', '');
      getAssetFromIndexedDB(assetId)
        .then((assetData) => {
          setAssetUrl(assetData.url);
          // Update trainingItem with file metadata for proper display
          setTrainingItem(prev => ({
            ...prev,
            file: {
              type: assetData.fileType,
              name: assetData.fileName
            }
          }));
          setLoading(false);
        })
        .catch((error) => {
          setAssetError('Unable to load training asset. The file may still be syncing. Try tapping the Refresh button on the dashboard, then reopen this training. If the problem persists, contact your administrator.');
          setLoading(false);
        });
    } else if (item.sourceType === 'url') {
      setAssetUrl(item.fileUrl || item.videoUrl || '');
      setLoading(false);
    } else {
      setAssetError('Invalid asset configuration.');
      setLoading(false);
    }
  }, [trainingId, navigate]);

  useEffect(() => {
    if (trainingItem) {
      setSelectedShareUsers(trainingItem.sharedWith || []);
    }
  }, [trainingItem]);

  const openSharePopup = () => {
    if (!trainingItem?.allowShare) {
      alert('Sharing is disabled by the administrator.');
      return;
    }
    setShareResult('');
    setSelectedShareUsers(trainingItem.sharedWith || []);
    setSharePopupOpen(true);
  };

  const closeSharePopup = () => {
    setSharePopupOpen(false);
  };

  const toggleShareUser = (userId) => {
    setSelectedShareUsers((prevSelected) =>
      prevSelected.includes(userId)
        ? prevSelected.filter((id) => id !== userId)
        : [...prevSelected, userId]
    );
  };

  const handleShareDocument = () => {
    if (!trainingItem) return;
    if (selectedShareUsers.length === 0) {
      setShareResult('Please select at least one user to share with.');
      return;
    }

    const storedItems = JSON.parse(localStorage.getItem('trainingItems') || '[]');
    const updatedItems = storedItems.map((item) =>
      item.id === trainingItem.id ? { ...item, sharedWith: selectedShareUsers } : item
    );
    localStorage.setItem('trainingItems', JSON.stringify(updatedItems));
    setTrainingItem({ ...trainingItem, sharedWith: selectedShareUsers });
    const recipientNames = allUsers
      .filter((u) => selectedShareUsers.includes(u.id))
      .map((u) => u.name || u.email || u.id)
      .join(', ');
    const message = recipientNames
      ? `Document shared to: ${recipientNames}`
      : `Document shared with ${selectedShareUsers.length} user(s).`;
    setShareResult(message);
    setSharePopupOpen(false);
    setTimeout(() => {
      setShareResult('');
    }, 5000);
  };

  const handleStartTraining = () => {
    if (!trainingItem) return;
    if (trainingItem.assetType === 'video' && !allowStart) return;
    if (trainingItem.assetType !== 'video' && (!documentViewed || !documentConfirmed)) return;

    if (trainingItem.followUpType === 'quiz') {
      navigate(`/quiz/${trainingItem.followUpId}`);
    } else if (trainingItem.followUpType === 'video') {
      navigate(`/quiz/${trainingItem.followUpId}`);
    }
  };

  const markDocumentViewed = () => {
    if (!documentViewed) {
      setDocumentViewed(true);
    }
  };

  const confirmDocumentCompletion = () => {
    setDocumentConfirmed(true);
    setDocumentPopupOpen(false);
  };

  const openDocumentPopup = () => {
    setDocumentPopupOpen(true);
    setReachedBottom(false);
    markDocumentViewed();
  };

  const closeDocumentPopup = () => {
    setDocumentPopupOpen(false);
  };

  const handleDocumentScroll = (e) => {
    const el = e.target;
    if (!el) return;
    const scrollTop = el.scrollTop;
    const scrollHeight = el.scrollHeight;
    const clientHeight = el.clientHeight;
    if (scrollTop + clientHeight >= scrollHeight - 30) {
      setReachedBottom(true);
    }
  };

  const handlePdfPageChange = ({ currentPage, numPages, isLastPage }) => {
    setPdfPageInfo({ currentPage, numPages });
    if (isLastPage) {
      setReachedBottom(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!trainingItem || trainingItem.assetType !== 'document') return;
      const key = event.key.toLowerCase();
      const isCtrlOrCommand = event.ctrlKey || event.metaKey;
      if (isCtrlOrCommand && (key === 'p' || key === 's')) {
        if ((key === 'p' && !trainingItem.allowPrint) || (key === 's' && !trainingItem.allowDownload)) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
      if (isCtrlOrCommand && event.shiftKey && (key === 's' || key === 'p')) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [trainingItem]);

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return;
    if (!videoRef.current.duration) return;
    const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setVideoProgress(progress);
    if (progress >= 95) {
      setAllowStart(true);
    }
  };

  const handleSeeking = (event) => {
    event.preventDefault();
    if (videoRef.current) {
      videoRef.current.currentTime = event.target.currentTime;
    }
  };

  const isExternalUrl = (url) => {
    if (!url) return false;
    if (url.startsWith('blob:') || url.startsWith('data:')) return false;
    try {
      const parsed = new URL(url, window.location.href);
      return parsed.origin !== window.location.origin;
    } catch {
      return false;
    }
  };

  const getIframeSandbox = () => {
    if (!assetUrl) return undefined;
    // For blob URLs and data URLs, allow scripts and same-origin for viewing
    if (assetUrl.startsWith('blob:') || assetUrl.startsWith('data:')) {
      return 'allow-same-origin allow-scripts';
    }
    return isExternalUrl(assetUrl) ? 'allow-same-origin allow-scripts' : 'allow-same-origin';
  };

  const getDocumentViewerUrl = (url) => {
    if (!url || !trainingItem || trainingItem.assetType !== 'document') return url;

    // For blob URLs and data URLs, use them directly with toolbar disabled
    if (url.startsWith('blob:') || url.startsWith('data:')) {
      // Append PDF toolbar disable parameter for browser's native viewer
      return `${url}#toolbar=0&navpanes=0&scrollbar=0`;
    }

    // For external PDFs, try to use Google Docs viewer with minimal UI
    // Note: Google Docs viewer has its own toolbar that cannot be fully hidden
    if (url.startsWith('http:') || url.startsWith('https:')) {
      // Try Microsoft's Office Online Viewer for better control, fallback to Google
      const isPDF = url.toLowerCase().endsWith('.pdf');
      if (isPDF) {
        // Use Google Docs with embedded mode (toolbar still visible but minimized)
        return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true&chrome=false`;
      }
      // For other documents, use Office Online Viewer
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    }

    return url;
  };

  const preventCopy = (event) => {
    event.preventDefault();
  };

  const handleDownloadClick = () => {
    if (!trainingItem) {
      return;
    }
    if (!trainingItem.allowDownload) {
      alert('Download is disabled by the administrator.');
      return;
    }
    if (!assetUrl) {
      alert('No asset available to download.');
      return;
    }

    try {
      // If blob or data URL, use anchor download
      if (assetUrl.startsWith('blob:') || assetUrl.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = assetUrl;
        const safeName = (trainingItem.title || 'training-asset').replace(/[^a-z0-9_.-]/gi, '_');
        a.download = safeName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }

      // For same-origin HTTP(S) URLs, try download attribute
      const parsed = new URL(assetUrl, window.location.href);
      if (parsed.origin === window.location.origin) {
        const a = document.createElement('a');
        a.href = assetUrl;
        a.download = (trainingItem.title || 'training-asset').replace(/[^a-z0-9_.-]/gi, '_');
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }

      // Cross-origin: open in new tab for user to download
      window.open(assetUrl, '_blank', 'noopener');
    } catch (err) {
      alert('Unable to initiate download. Please try opening the asset in a new tab.');
    }
  };

  const handlePrintClick = () => {
    if (!trainingItem) return;
    if (!trainingItem.allowPrint) {
      alert('Print is disabled by the administrator.');
      return;
    }
    if (!assetUrl) {
      alert('No asset available to print.');
      return;
    }

    try {
      const iframe = document.querySelector('iframe[title="Training document"]');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.focus();
        // Some browsers restrict printing cross-origin iframes.
        iframe.contentWindow.print();
        return;
      }
    } catch (err) {
      // ignore and fallback
    }

    // Fallback: open asset in new window and trigger print there
    const newWin = window.open(assetUrl, '_blank', 'noopener');
    if (newWin) {
      newWin.addEventListener('load', () => {
        try {
          newWin.focus();
          newWin.print();
        } catch (e) {
        }
      });
    } else {
      alert('Unable to open asset in a new window for printing.');
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!trainingItem || trainingItem.assetType !== 'document') return;
      const key = event.key.toLowerCase();
      const isCtrlOrCommand = event.ctrlKey || event.metaKey;
      if (!isCtrlOrCommand) return;
      if (key === 'p' && !trainingItem.allowPrint) {
        event.preventDefault();
        event.stopPropagation();
      }
      if (key === 's' && !trainingItem.allowDownload) {
        event.preventDefault();
        event.stopPropagation();
      }
      if (key === 'c' && !trainingItem.allowShare) {
        event.preventDefault();
        event.stopPropagation();
      }
      if (event.shiftKey && (key === 's' || key === 'p' || key === 'c')) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [trainingItem]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="md:flex">
        <div className="hidden md:block"><Sidebar currentUser={JSON.parse(localStorage.getItem('currentUser') || 'null')} /></div>
        <div className="flex-1 md:ml-64">
          <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-3 md:px-6 sm:px-8 lg:px-10">
              <div className="flex justify-between items-center h-14 md:h-20">
                <button
                  onClick={goBack}
                  className="inline-flex items-center px-3 md:px-4 py-2 text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 text-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-1 md:mr-2" />
                  Back
                </button>
                <div className="text-right">
                  <h1 className="text-base md:text-2xl font-bold text-slate-900">Training Content</h1>
                  <p className="text-xs md:text-sm text-slate-500 hidden md:block">Complete the asset before starting the linked quiz or video.</p>
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-3 md:px-6 sm:px-8 lg:px-10 py-4 md:py-8 pb-20 md:pb-8">
            <div className="bg-white rounded-lg md:rounded-3xl shadow-md md:shadow-xl border border-slate-200 p-3 md:p-6">
            {loading ? (
              <div className="py-20 text-center text-slate-500">Loading training asset...</div>
            ) : assetError ? (
              <div className="py-20 text-center text-red-600">{assetError}</div>
            ) : (
              <>
                <div className="mb-4 md:mb-6">
                  <h2 className="text-base md:text-xl font-semibold text-slate-900">{trainingItem?.title}</h2>
                  <p className="text-xs md:text-sm text-slate-600 mt-1 md:mt-2">{trainingItem?.description}</p>
                </div>

                <div className="space-y-4">
                  {trainingItem?.assetType === 'video' ? (
                    <div className="bg-slate-900 rounded-lg md:rounded-3xl overflow-hidden">
                      <video
                        ref={videoRef}
                        src={assetUrl}
                        className="w-full h-[240px] md:h-[480px] bg-black"
                        controls
                        controlsList="nodownload nofullscreen noremoteplayback"
                        onContextMenu={(e) => e.preventDefault()}
                        onTimeUpdate={handleVideoTimeUpdate}
                        onSeeking={handleSeeking}
                      />
                      <div className="p-3 md:p-4 bg-slate-950 text-slate-200 text-xs md:text-sm">
                        <p>Video seeking is disabled and download is blocked. Please watch at least 95% of the video to proceed.</p>
                        <p className="mt-1 md:mt-2">Progress: {Math.min(100, videoProgress.toFixed(0))}%</p>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="bg-slate-100 rounded-lg md:rounded-3xl border border-slate-200 overflow-hidden"
                      onContextMenu={(e) => e.preventDefault()}
                      onCopy={preventCopy}
                      onCut={preventCopy}
                      onPaste={preventCopy}
                    >
                      <div className="p-3 md:p-4 bg-slate-900 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span className="text-xs md:text-sm">Document Viewer</span>
                        </div>
                        <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                          <div className="flex items-center gap-1 text-xs">
                            <Download className={`w-4 h-4 ${trainingItem.allowDownload ? 'text-green-300' : 'text-slate-500'}`} />
                            <button
                              type="button"
                              onClick={handleDownloadClick}
                              disabled={!trainingItem.allowDownload}
                              className={`font-medium ${trainingItem.allowDownload ? 'text-green-200 hover:text-white' : 'text-slate-400 cursor-not-allowed'}`}
                            >
                              Download
                            </button>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <Printer className={`w-4 h-4 ${trainingItem.allowPrint ? 'text-green-300' : 'text-slate-500'}`} />
                            <button
                              type="button"
                              onClick={handlePrintClick}
                              disabled={!trainingItem.allowPrint}
                              className={`font-medium ${trainingItem.allowPrint ? 'text-green-200 hover:text-white' : 'text-slate-400 cursor-not-allowed'}`}
                            >
                              Print
                            </button>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <Share2 className={`w-4 h-4 ${trainingItem.allowShare ? 'text-green-300' : 'text-slate-500'}`} />
                            <button
                              type="button"
                              onClick={openSharePopup}
                              disabled={!trainingItem.allowShare}
                              className={`font-medium ${trainingItem.allowShare ? 'text-green-200 hover:text-white' : 'text-slate-400 cursor-not-allowed'}`}
                            >
                              Share
                            </button>
                          </div>
                        </div>
                      </div>
                      {shareResult && (
                        <div className="mt-2 px-4 py-2 rounded-md bg-green-50 text-green-800 text-sm max-w-2xl mx-4">
                          {shareResult}
                        </div>
                      )}

                      {/* Document preview card - click to open full-screen reader */}
                      <div className="p-4 md:p-8 bg-white">
                        <div
                          onClick={openDocumentPopup}
                          className="cursor-pointer border-2 border-dashed border-blue-300 rounded-xl p-6 md:p-10 text-center hover:bg-blue-50 transition duration-200"
                        >
                          <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                            <FileText className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
                          </div>
                          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1">
                            {trainingItem.file?.name || trainingItem.title || 'Training Document'}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4">
                            Tap to open and read the document
                          </p>
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                            <span>📖</span>
                            Open Document
                          </div>
                          {documentViewed && (
                            <div className="mt-3 text-xs text-green-600 font-medium flex items-center justify-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Document opened
                              {documentConfirmed && ' - Reading confirmed'}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Confirmation Section - appears after document is viewed */}
                      {documentViewed && !documentConfirmed && (
                        <div className="bg-amber-50 border-t-2 border-amber-200 p-4 md:p-6 text-center">
                          <div className="max-w-md mx-auto">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                              <span className="text-amber-600 text-lg md:text-xl">📖</span>
                            </div>
                            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                              Confirm Document Review
                            </h3>
                            <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
                              Please open the document, scroll to the end, and confirm that you have read all the content before proceeding to the quiz.
                            </p>
                            <button
                              onClick={openDocumentPopup}
                              className="w-full bg-amber-600 text-white py-3 px-4 md:px-6 rounded-lg font-semibold text-sm md:text-base hover:bg-amber-700 transition duration-200 flex items-center justify-center gap-2 mb-2"
                            >
                              <span>📖</span>
                              Open Document to Read
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="p-3 md:p-4 text-xs text-slate-500">
                        Right-click, text selection, and copy are disabled for this document.
                        {trainingItem.allowShare ? ' Sharing is allowed by policy.' : ' Sharing is restricted by policy.'}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 md:mt-8 rounded-lg md:rounded-3xl border border-slate-200 bg-slate-50 p-3 md:p-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
                    <div>
                      <h3 className="text-base md:text-lg font-semibold text-slate-900">Complete the asset to continue</h3>
                      <p className="text-xs md:text-sm text-slate-500">When you are ready, start the linked training quiz or video.</p>
                    </div>
                    <button
                      onClick={handleStartTraining}
                      disabled={trainingItem?.assetType === 'video' ? !allowStart : (!documentViewed || !documentConfirmed)}
                      className={`inline-flex items-center justify-center gap-2 px-4 md:px-5 py-3 rounded-lg md:rounded-2xl text-white font-semibold text-sm md:text-base transition ${trainingItem?.assetType === 'video' ? (allowStart ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed') : (documentViewed && documentConfirmed ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed')}`}
                    >
                      <Play className="w-4 h-4" />
                      Start Quiz
                    </button>
                  </div>
                  {trainingItem?.assetType === 'video' && !allowStart && (
                    <p className="mt-2 md:mt-3 text-xs md:text-sm text-orange-600">Please watch at least 95% of the video before starting.</p>
                  )}
                  {trainingItem?.assetType !== 'video' && !documentViewed && (
                    <p className="mt-2 md:mt-3 text-xs md:text-sm text-orange-600">Please open the document before starting the quiz.</p>
                  )}
                  {trainingItem?.assetType !== 'video' && documentViewed && !documentConfirmed && (
                    <p className="mt-2 md:mt-3 text-xs md:text-sm text-orange-600">
                      Please confirm that you have read the document to start the quiz.
                    </p>
                  )}
                </div>

                <div className="mt-4 md:mt-6 rounded-lg md:rounded-3xl border border-slate-200 bg-slate-50 p-3 md:p-5 text-xs md:text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Training asset rules</p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Document and video downloads are blocked where supported.</li>
                    <li>Right-click and copy are disabled in the viewer.</li>
                    <li>Screenshots and external recording are discouraged.</li>
                  </ul>
                </div>
                  {/* Full-screen Document Reader Popup */}
                  {documentPopupOpen && (
                    <div className="fixed inset-0 z-[70] bg-white flex flex-col safe-area-inset">
                      {/* Popup header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white flex-shrink-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">
                            {trainingItem.file?.name || trainingItem.title || 'Document'}
                          </span>
                        </div>
                        <button
                          onClick={closeDocumentPopup}
                          className="flex items-center gap-1 text-sm text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                          Close
                        </button>
                      </div>

                      {/* Document content - scrollable area */}
                      <div
                        ref={documentScrollRef}
                        onScroll={handleDocumentScroll}
                        className="flex-1 overflow-y-auto bg-gray-200"
                      >
                        {assetUrl?.startsWith('blob:') || assetUrl?.startsWith('data:') ? (
                          (() => {
                            const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
                            const isPdf = (trainingItem.file?.type || '').includes('pdf') || (trainingItem.file?.name || '').toLowerCase().endsWith('.pdf');
                            if (isMobile && isPdf) {
                              return (
                                <PdfViewer
                                  url={assetUrl}
                                  onLoad={markDocumentViewed}
                                  onPageChange={handlePdfPageChange}
                                  className="min-h-full"
                                />
                              );
                            }
                            return (
                              <iframe
                                title="Training document"
                                src={`${assetUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                                className="w-full h-full"
                                style={{ userSelect: 'none', minHeight: '100vh' }}
                                onLoad={markDocumentViewed}
                              />
                            );
                          })()
                        ) : (
                          <iframe
                            title="Training document"
                            src={getDocumentViewerUrl(assetUrl)}
                            className="w-full h-full"
                            sandbox={getIframeSandbox()}
                            style={{ userSelect: 'none', minHeight: '100vh' }}
                            onLoad={markDocumentViewed}
                          />
                        )}
                      </div>

                      {/* Bottom confirmation bar - appears when scrolled to end */}
                      <div className={`flex-shrink-0 transition-all duration-300 ${reachedBottom ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        {reachedBottom && !documentConfirmed && (
                          <div className="bg-amber-50 border-t-2 border-amber-300 p-4">
                            <div className="max-w-md mx-auto text-center">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-sm font-semibold text-gray-900">You've reached the end of the document</span>
                              </div>
                              <p className="text-xs text-gray-600 mb-3">
                                Please confirm that you have read and understood all the content before proceeding to the quiz.
                              </p>
                              <button
                                onClick={confirmDocumentCompletion}
                                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold text-sm hover:bg-green-700 transition duration-200 flex items-center justify-center gap-2"
                              >
                                <span>✓</span>
                                I Confirm - I have read all pages
                              </button>
                            </div>
                          </div>
                        )}
                        {reachedBottom && documentConfirmed && (
                          <div className="bg-green-50 border-t-2 border-green-300 p-3">
                            <div className="flex items-center justify-center gap-2 text-sm text-green-700 font-medium">
                              <CheckCircle className="w-5 h-5" />
                              Reading confirmed! You can now start the quiz.
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Progress hint when not yet at bottom */}
                      {!reachedBottom && (
                        <div className="flex-shrink-0 bg-blue-50 border-t border-blue-200 px-4 py-2 text-center text-xs text-blue-700">
                          {pdfPageInfo.numPages > 0
                            ? `📖 Page ${pdfPageInfo.currentPage} of ${pdfPageInfo.numPages} — Navigate to the last page to confirm reading.`
                            : '📜 Scroll down to read the full document. Confirmation will appear at the end.'}
                        </div>
                      )}
                    </div>
                  )}
                  {sharePopupOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
                      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                          <div>
                            <h2 className="text-lg font-semibold text-slate-900">Share Document</h2>
                            <p className="text-sm text-slate-500">Select one or more users to share this training asset.</p>
                          </div>
                          <button
                            type="button"
                            onClick={closeSharePopup}
                            className="text-slate-500 hover:text-slate-900"
                          >
                            Close
                          </button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
                          {allUsers.length === 0 ? (
                            <div className="text-sm text-slate-500">No users available to share with.</div>
                          ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                              {allUsers.map((user) => (
                                <label
                                  key={user.id}
                                  className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 hover:border-slate-400"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedShareUsers.includes(user.id)}
                                    onChange={() => toggleShareUser(user.id)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                  />
                                  <div>
                                    <div className="font-medium text-slate-900">{user.name || user.email || 'Unnamed user'}</div>
                                    <div className="text-xs text-slate-500">{user.email || user.id}</div>
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="text-sm text-slate-600">{shareResult}</div>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={closeSharePopup}
                              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleShareDocument}
                              className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                              Share Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </>
            )}
          </div>
        </main>
        </div>
      </div>
    </div>
  );
};

export default TrainingViewer;
