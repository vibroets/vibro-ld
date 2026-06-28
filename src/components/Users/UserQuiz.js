import React, { useState, useEffect, useRef, useCallback } from 'react'; // Force redeploy
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, AlertCircle, ArrowLeft, Clock } from 'lucide-react';
import Sidebar from '../Sidebar';
import DataManager from '../../services/dataManager';
import {
  prepareQuestionsForAttempt,
  checkAnswerCorrect,
  getNextQuestionIndex,
  calculateScore,
  formatAnswerText,
  saveUserDraftAnswers,
  loadUserDraftAnswers,
  clearUserDraftAnswers,
  QUESTION_TYPES
} from '../../services/quizHelpers';
import { translateBatch } from '../../services/translationService';

const UserQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef(null);

  const goBack = () => {
    // Always navigate to training calendar after quiz completion
    navigate('/user-training-calendar');
  };

  // Utility function to retrieve video from IndexedDB
  const getVideoFromIndexedDB = (videoId) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('VideoTrainingDB', 5);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        
        // Check if the object store exists
        if (!db.objectStoreNames.contains('videos')) {
          reject(new Error('Videos object store not found'));
          return;
        }
        
        const transaction = db.transaction(['videos'], 'readonly');
        const store = transaction.objectStore('videos');
        
        const getRequest = store.get(videoId);
        getRequest.onsuccess = () => {
          const videoData = getRequest.result;
          if (videoData && videoData.file) {
            // Create blob URL asynchronously to avoid blocking
            try {
              const blobUrl = URL.createObjectURL(videoData.file);
              resolve(blobUrl);
            } catch (error) {
              reject(new Error('Failed to create blob URL: ' + error.message));
            }
          } else {
            reject(new Error('Video not found in IndexedDB'));
          }
        };
        getRequest.onerror = () => reject(getRequest.error);
        
        // Add transaction error handling
        transaction.onerror = () => reject(transaction.error);
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
  
  const [quizData, setQuizData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(1800); // Default to 30 minutes
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [maxWatchedPosition, setMaxWatchedPosition] = useState(0);
  const [warningMessage, setWarningMessage] = useState('');
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [user, setUser] = useState(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewResultId, setReviewResultId] = useState(null);
  const [reviewResult, setReviewResult] = useState(null);
  const [trainingConfirmationRequired, setTrainingConfirmationRequired] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [currentTranslations, setCurrentTranslations] = useState({
    question: null,
    options: []
  });
  const hasLoadedQuizRef = useRef(false);

  // Reset the ref when quizId changes
  useEffect(() => {
    hasLoadedQuizRef.current = false;
  }, [quizId]);

  // Use imported helpers for question preparation, scoring, and branching.

  // Video component to handle different video sources
  const VideoPlayer = React.memo(({ videoUrl }) => {
    const [src, setSrc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isYouTube, setIsYouTube] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const lastVideoUrlRef = useRef(null);
    const lastBlobUrlRef = useRef(null);
    const isLoadingRef = useRef(false);

    useEffect(() => {
      // Prevent infinite loop by checking if videoUrl actually changed
      // For IndexedDB videos, compare the ID instead of the full URL (blob URL changes each time)
      let currentVideoId = videoUrl;
      if (videoUrl && videoUrl.startsWith('indexeddb://')) {
        currentVideoId = videoUrl; // Use the indexeddb:// ID for comparison
      }
      
      // Return early if same video and already loaded or loading
      if (currentVideoId === lastVideoUrlRef.current && (src || isLoadingRef.current)) {
        return;
      }
      
      // Return early if already loading this video
      if (isLoadingRef.current && currentVideoId === lastVideoUrlRef.current) {
        return;
      }
      
      lastVideoUrlRef.current = currentVideoId;
      
      let timeoutId;
      
      console.log('VideoPlayer useEffect called with videoUrl:', videoUrl);
      
      if (videoUrl && videoUrl.startsWith('indexeddb://')) {
        // Retrieve video from IndexedDB with timeout
        const videoId = videoUrl.replace('indexeddb://', '');
        console.log('Loading video from IndexedDB with ID:', videoId);
        
        isLoadingRef.current = true;
        
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            console.error('Video loading timeout after 5 seconds');
            isLoadingRef.current = false;
            reject(new Error('Video loading timeout - please try again'));
          }, 5000); // 5 second timeout
        });
        
        Promise.race([getVideoFromIndexedDB(videoId), timeoutPromise])
          .then(blobUrl => {
            console.log('Video loaded successfully from IndexedDB:', blobUrl);
            clearTimeout(timeoutId);
            isLoadingRef.current = false;
            // Only set src if the blob URL has changed
            if (blobUrl !== lastBlobUrlRef.current) {
              lastBlobUrlRef.current = blobUrl;
              setSrc(blobUrl);
            }
            setLoading(false);
          })
          .catch(error => {
            console.error('Failed to load video from IndexedDB:', error);
            clearTimeout(timeoutId);
            isLoadingRef.current = false;
            setError('Failed to load video from IndexedDB - please refresh the page or re-upload the video');
            setLoading(false);
          });
      } else if (videoUrl && (videoUrl.includes('youtube.com/watch') || videoUrl.includes('youtu.be/'))) {
        // Handle YouTube URLs - convert to embed format
        let videoId;
        if (videoUrl.includes('youtube.com/watch')) {
          videoId = videoUrl.split('v=')[1]?.split('&')[0];
        } else if (videoUrl.includes('youtu.be/')) {
          videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0];
        }
        console.log('Loading YouTube video with ID:', videoId);
        if (videoId) {
          const embedUrl = `https://www.youtube.com/embed/${videoId}?controls=1&modestbranding=1&rel=0`;
          setSrc(embedUrl);
          setIsYouTube(true);
          setLoading(false);
        } else {
          console.error('Invalid YouTube URL:', videoUrl);
          setError('Invalid YouTube URL');
          setLoading(false);
        }
      } else if (videoUrl) {
        // Use direct videoUrl
        console.log('Loading video from direct URL:', videoUrl);
        setSrc(videoUrl);
        setLoading(false);
      } else {
        console.error('No videoUrl provided');
        setError('No video URL provided');
        setLoading(false);
      }
      
      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoUrl]);

    if (loading) {
      return (
        <div className="w-full h-96 bg-gray-200 rounded flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-sm text-gray-600">Loading video...</div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="w-full h-96 bg-red-50 rounded flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
            <div className="text-sm text-red-600 mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-200"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    if (isYouTube) {
      return (
        <div className="w-full h-96 bg-black rounded relative">
          {!isPlaying ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10">
              <button
                onClick={() => setIsPlaying(true)}
                className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
              >
                <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
              <p className="text-white mt-4 text-sm">Click to play video</p>
              <p className="text-gray-400 mt-2 text-xs">Fast-forward is locked</p>
            </div>
          ) : (
            <iframe
              className="w-full h-full rounded"
              src={`${src}&autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
            Fast-forward locked
          </div>
        </div>
      );
    }

    return (
      <video
        ref={videoRef}
        className="w-full h-96 object-contain bg-black"
        onSeeking={handleVideoSeeking}
        onTimeUpdate={handleVideoTimeUpdate}
        onEnded={() => {
          setVideoCompleted(true);
          if (!trainingConfirmationRequired) {
            setQuizStarted(true);
          }
        }}
        onError={() => {
          setVideoCompleted(true);
          if (!trainingConfirmationRequired) {
            setQuizStarted(true);
          }
        }}
        controlsList="nodownload"
        controls
        src={src}
      >
        Your browser does not support the video tag.
      </video>
    );
  });

  useEffect(() => {
    // Prevent infinite loop by checking if we've already loaded this quiz
    if (hasLoadedQuizRef.current === quizId) {
      return;
    }
    
    try {
      const searchParams = new URLSearchParams(location.search);
      const mode = searchParams.get('mode');
      const resultId = searchParams.get('resultId');

      if (mode === 'review' && resultId) {
        setIsReviewMode(true);
        setReviewResultId(resultId);
      }

      // Check if user is logged in
      const userData = localStorage.getItem('currentUser');
      if (!userData) {
        // Redirect to user login if no user is logged in
        navigate('/user-login');
        return;
      }
      setUser(JSON.parse(userData));

      // Load quiz data from all sources with array guards
      const quizzesRaw = localStorage.getItem('quizzes');
      const videosRaw = localStorage.getItem('videos');
      const trainingItemsRaw = localStorage.getItem('trainingItems');
      
      const quizzes = Array.isArray(quizzesRaw) ? quizzesRaw : (quizzesRaw ? JSON.parse(quizzesRaw) : []);
      const videos = Array.isArray(videosRaw) ? videosRaw : (videosRaw ? JSON.parse(videosRaw) : []);
      const trainingItems = Array.isArray(trainingItemsRaw) ? trainingItemsRaw : (trainingItemsRaw ? JSON.parse(trainingItemsRaw) : []);
      
      
      // Find the quiz or video by ID (check all sources)
      const foundQuiz = quizzes.find(q => String(q.id) === String(quizId));
      const foundVideo = videos.find(v => String(v.id) === String(quizId));
      const foundTraining = trainingItems.find(t => String(t.id) === String(quizId));
    
    // Determine training type and effective item data
    let effectiveItem = foundQuiz || foundVideo || foundTraining;
    const trainingType = foundVideo ? 'Video training' : (foundTraining ? 'Training' : 'Quiz');
    
    
    // Check for one-time access restriction
    const quizResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
    const userResults = quizResults.filter(r => r.quizId === quizId && r.userId === userData?.id);
    const hasCompleted = userResults.some(r => r.status === 'passed' || (r.score >= (effectiveItem?.passPercentage || 70)));
    const hasFailed = userResults.some(r => r.status === 'failed' || (r.score < (effectiveItem?.passPercentage || 70)));
    const lastResult = userResults.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0];
    
    const itemData = foundQuiz || foundVideo || foundTraining;
    const isOneTime = itemData?.accessMode === 'one-time';
    
    if (isOneTime && hasCompleted) {
      alert('This is a one-time assessment. You have already completed it.');
      navigate('/user-dashboard/quizzes');
      return;
    }
    
    // Check for reassignment on failure
    const reassignEnabled = itemData?.reassignOnFail;
    const rescheduleDays = itemData?.rescheduleDays || 7;
    
    if (hasFailed && reassignEnabled && lastResult) {
      const failDate = new Date(lastResult.completedAt);
      const rescheduleDate = new Date(failDate);
      rescheduleDate.setDate(rescheduleDate.getDate() + parseInt(rescheduleDays));
      const now = new Date();
      
      // Check waiting period
      if (now < rescheduleDate) {
        const daysRemaining = Math.ceil((rescheduleDate - now) / (1000 * 60 * 60 * 24));
        alert(`You failed this assessment. Please wait ${daysRemaining} more day(s) before you can retake it.`);
        navigate('/user-dashboard/quizzes');
        return;
      }
      
      // Check if re-training is completed
      const trainingCompletions = JSON.parse(localStorage.getItem('trainingCompletions') || '[]');
      const lastTrainingCompletion = trainingCompletions.find(
        tc => tc.itemId === quizId && tc.userId === userData?.id
      );
      
      if (!lastTrainingCompletion || new Date(lastTrainingCompletion.completedAt) < failDate) {
        // Training is required - set state to show confirmation dialog after video
        setTrainingConfirmationRequired(true);
      }
    }
    
    if (foundQuiz || (foundTraining && foundTraining.questions && foundTraining.questions.length > 0)) {
      // Use foundQuiz or foundTraining (if it has questions, treat as quiz)
      const quizToUse = foundQuiz || foundTraining;
      // Attach type info to quizData
      quizToUse.trainingType = foundQuiz ? trainingType : 'Training';
      setQuizData(quizToUse);
      hasLoadedQuizRef.current = quizId;
      const timeLimitMinutes = quizToUse.timeLimit || 30;
      const timeLimitSeconds = timeLimitMinutes * 60;
      setTimeRemaining(timeLimitSeconds);
            // Check if questions exist
      if (!quizToUse.questions || quizToUse.questions.length === 0) {
        // Try to create fallback questions if quiz data is corrupted
        if (quizToUse.title && typeof quizToUse.title === 'string') {
          const fallbackQuestions = [
            {
              question: `Sample question for ${quizToUse.title}`,
              options: ['Option A', 'Option B', 'Option C', 'Option D'],
              correctAnswer: 0
            }
          ];
          const prepared = prepareQuestionsForAttempt(fallbackQuestions);
          setShuffledQuestions(prepared);
          setQuizStarted(true);
          setVideoCompleted(true);
          setShowVideo(false);
        } else {
          alert('Quiz not found or corrupted. Please contact your administrator.');
          navigate('/user-dashboard');
          return;
        }
      } else {
        // Check if this quiz has a video
        if (quizToUse.videoUrl || quizToUse.fileUrl) {
          setShowVideo(true);
          setQuizStarted(false);
          setVideoCompleted(false);
          
          // Auto-skip video after 5 seconds if it doesn't load
          const autoSkipTimeout = setTimeout(() => {
            setVideoCompleted(true);
            if (!trainingConfirmationRequired) {
              setQuizStarted(true);
            }
          }, 5000);
          
          // Clear timeout if component unmounts
          return () => clearTimeout(autoSkipTimeout);
        } else {
          setShowVideo(false);
          setQuizStarted(true);
          setVideoCompleted(true);
        }
        
        // Shuffle all questions first, then select the subset so every question type has a chance to appear.
        const questionsToUse = Math.min(quizToUse.questionsPerUser || quizToUse.questions.length, quizToUse.questions.length);
        const shuffledAll = prepareQuestionsForAttempt(quizToUse.questions);
        const selectedQuestions = shuffledAll.slice(0, questionsToUse);
        setShuffledQuestions(selectedQuestions);
        setAnswers(new Array(selectedQuestions.length).fill(null));
      }
    } else if (foundVideo) {
      // This is a video training
      // Construct videoUrl from video data based on videoSourceType
      let videoUrl = null;
      
      console.log('Video source type:', foundVideo.videoSourceType);
      console.log('Video reference type:', foundVideo.referenceType);
      console.log('Video has videoUrl:', !!foundVideo.videoUrl);
      console.log('Video has url:', !!foundVideo.url);
      console.log('Video has file:', !!foundVideo.file);
      console.log('Full video object:', JSON.stringify(foundVideo, null, 2));
      
      if (foundVideo.referenceType === 'url' && foundVideo.videoUrl) {
        // URL-based video (check referenceType first)
        videoUrl = foundVideo.videoUrl;
      } else if (foundVideo.videoSourceType === 'url' && foundVideo.videoUrl) {
        // URL-based video (check videoSourceType)
        videoUrl = foundVideo.videoUrl;
      } else if (foundVideo.videoSourceType === 'file' || foundVideo.file) {
        // File-based video from IndexedDB
        videoUrl = `indexeddb://${foundVideo.id}`;
      } else if (foundVideo.videoUrl) {
        // Fallback: use videoUrl if available
        videoUrl = foundVideo.videoUrl;
      } else if (foundVideo.url) {
        // Fallback: use url property if available (legacy)
        videoUrl = foundVideo.url;
      } else if (foundVideo.file) {
        // Fallback: use IndexedDB
        videoUrl = `indexeddb://${foundVideo.id}`;
      }
      
      console.log('Video data:', foundVideo);
      console.log('Constructed videoUrl:', videoUrl);
      
      if (!videoUrl) {
        console.error('No video URL could be constructed from video data');
        console.error('Video metadata:', {
          id: foundVideo.id,
          title: foundVideo.title,
          videoSourceType: foundVideo.videoSourceType,
          referenceType: foundVideo.referenceType,
          hasUrl: !!foundVideo.url,
          hasFile: !!foundVideo.file
        });
        alert(`The video "${foundVideo.title}" has no valid source.\n\nVideo Type: ${foundVideo.videoSourceType}\nReference Type: ${foundVideo.referenceType}\n\nPlease contact your administrator to re-upload the video with a valid file or URL.`);
        navigate('/user-training-calendar');
        return;
      }
      
      // Use the video object as-is since videoUrl is now correctly saved
      setQuizData(foundVideo);
      setShowVideo(true);
      setQuizStarted(false);
      setVideoCompleted(false);
      hasLoadedQuizRef.current = quizId;

      // Load saved progress from localStorage
      if (user && quizId) {
        const progressKey = `videoProgress_${user.id}_${quizId}`;
        const savedProgress = localStorage.getItem(progressKey);
        if (savedProgress) {
          try {
            const parsed = JSON.parse(savedProgress);
            setVideoProgress(parsed.progress || 0);
            setMaxWatchedPosition(parsed.maxWatchedPosition || 0);
            // Resume video from saved position after a short delay
            setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.currentTime = parsed.currentTime || 0;
              }
            }, 500);
          } catch (e) {
            console.error('Error loading video progress:', e);
          }
        }
      }
      
      // Auto-skip video after 5 seconds if it doesn't load
      const autoSkipTimeout = setTimeout(() => {
        setVideoCompleted(true);
        if (!trainingConfirmationRequired) {
          setQuizStarted(true);
        }
      }, 5000);
      
      // Shuffle all questions first, then select the subset so every question type has a chance to appear.
      if (foundVideo.questions && foundVideo.questions.length > 0) {
        const questionsToUse = Math.min(foundVideo.questionsPerUser || foundVideo.questions.length, foundVideo.questions.length);
        const shuffledAll = prepareQuestionsForAttempt(foundVideo.questions);
        const selectedQuestions = shuffledAll.slice(0, questionsToUse);
        setShuffledQuestions(selectedQuestions);
        setAnswers(new Array(selectedQuestions.length).fill(null));
      } else {
        // Create fallback questions if no questions exist
        const fallbackQuestions = [
          {
            question: `What was the main topic covered in the video "${foundVideo.title}"?`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 0
          },
          {
            question: `Did you understand the content from the video "${foundVideo.title}"?`,
            options: ['Yes, completely', 'Yes, mostly', 'Partially', 'No'],
            correctAnswer: 0
          }
        ];
        const preparedFallback = prepareQuestionsForAttempt(fallbackQuestions);
        setShuffledQuestions(preparedFallback);
        setAnswers(new Array(preparedFallback.length).fill(null));
      }
      
      // Clear timeout if component unmounts
      return () => clearTimeout(autoSkipTimeout);
    } else if (foundTraining) {
      // This is a training item - treat it like a video/quiz hybrid
      setQuizData(foundTraining);
      
      // Check if training has a video URL or document
      if (foundTraining.videoUrl || foundTraining.fileUrl || foundTraining.fileData) {
        setShowVideo(true);
        setQuizStarted(false);
        setVideoCompleted(false);
        
        // Auto-skip after 15 seconds if video doesn't load
        const autoSkipTimeout = setTimeout(() => {
          setVideoCompleted(true);
          if (!trainingConfirmationRequired) {
            setQuizStarted(true);
          }
        }, 15000);
        
        // Clear timeout if component unmounts
        return () => clearTimeout(autoSkipTimeout);
      } else {
        // No video - start quiz directly
        setShowVideo(false);
        setQuizStarted(true);
        setVideoCompleted(true);
      }
      
      // Shuffle all questions first, then select the subset so every question type has a chance to appear.
      if (foundTraining.questions && foundTraining.questions.length > 0) {
        const questionsToUse = Math.min(foundTraining.questionsPerUser || foundTraining.questions.length, foundTraining.questions.length);
        const shuffledAll = prepareQuestionsForAttempt(foundTraining.questions);
        const selectedQuestions = shuffledAll.slice(0, questionsToUse);
        setShuffledQuestions(selectedQuestions);
        setAnswers(new Array(selectedQuestions.length).fill(null));
      } else {
        // Create fallback questions for training
        const fallbackQuestions = [
          {
            question: `What was the main topic covered in the training "${foundTraining.title}"?`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 0
          },
          {
            question: `Did you understand the content from the training "${foundTraining.title}"?`,
            options: ['Yes, completely', 'Yes, mostly', 'Partially', 'No'],
            correctAnswer: 0
          }
        ];
        const preparedFallback = prepareQuestionsForAttempt(fallbackQuestions);
        setShuffledQuestions(preparedFallback);
        setAnswers(new Array(preparedFallback.length).fill(null));
      }
    } else {
      alert('Quiz, video, or training not found. Please contact your administrator.');
      navigate('/user-dashboard');
    }
    } catch (error) {
      console.error('Error loading quiz/video data:', error);
      alert('An error occurred while loading the training content. Please try again or contact your administrator.');
      navigate('/user-dashboard');
    }
  }, [quizId, navigate, trainingConfirmationRequired, user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!quizData || !reviewResultId || !user) return;

    const existingResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
    let result = existingResults.find(r => r.id === reviewResultId && r.userId === user.id);

    if (!result) {
      result = existingResults.find(r => r.quizId === quizId && `${r.quizId}--${r.completedAt}` === reviewResultId && r.userId === user.id);
      if (result) {
        result.id = reviewResultId;
        const resultIndex = existingResults.findIndex(r => r.quizId === quizId && `${r.quizId}--${r.completedAt}` === reviewResultId && r.userId === user.id);
        if (resultIndex !== -1) {
          existingResults[resultIndex] = result;
          localStorage.setItem('quizResults', JSON.stringify(existingResults));
          DataManager.saveQuizResult(result).catch(e => console.error('Supabase quiz result sync error:', e));
        }
      }
    }

    if (!result) {
      alert('Submitted response not found. Please try again.');
      navigate('/user-dashboard');
      return;
    }

    setReviewResult(result);
    setAnswers(result.answers || []);
    setShuffledQuestions(prepareQuestionsForAttempt(result.questions || []));
    setCurrentQuestionIndex(0);
    setQuizStarted(false);
    setQuizCompleted(false);
    setShowVideo(false);
  }, [quizData, reviewResultId, user, navigate, quizId]);

  useEffect(() => {
    let timer;
    if (quizStarted && !quizCompleted && timeRemaining > 0) {
      timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      // Call handleQuizSubmit directly without dependency
      setQuizCompleted(true);
      if (quizData && shuffledQuestions.length > 0) {
        // Get user data directly from localStorage to ensure department is captured
        const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        const score = calculateScore(shuffledQuestions, answers);
        const correctAnswers = Math.round((score / 100) * shuffledQuestions.length);
        
        // Determine training type robustly (check stored quizzes/videos)
        const storedQuizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
        const storedVideos = JSON.parse(localStorage.getItem('videos') || '[]');
        const inferredType = storedVideos.some(v => v.id === quizId) ? 'Video training' : (storedQuizzes.some(q => q.id === quizId) ? (quizData.trainingType || 'Quiz') : 'Quiz');

        const result = {
          quizId: quizId,
          quizTitle: quizData.title || 'Unknown Quiz',
          userId: userData?.id || user?.id || 'demo-user',
          userName: userData?.name || user?.name || 'Demo User',
          userDepartment: userData?.department || user?.department || 'N/A',
          trainingType: inferredType,
          score: score,
          correctAnswers: correctAnswers,
          totalQuestions: shuffledQuestions.length,
          timeTaken: (quizData.timeLimit * 60) - timeRemaining,
          completedAt: new Date().toISOString(),
          answers: answers,
          questions: shuffledQuestions,
          passPercentage: quizData.passPercentage || 60
        };

        const existingResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
        existingResults.push(result);
        localStorage.setItem('quizResults', JSON.stringify(existingResults));
        DataManager.saveQuizResult(result).catch(e => console.error('Supabase quiz result sync error:', e));
      }
    }
    return () => clearTimeout(timer);
  }, [quizStarted, quizCompleted, timeRemaining, quizData, shuffledQuestions, answers, quizId, user]);

  // Load saved draft answers when quiz starts
  useEffect(() => {
    if (quizStarted && user && quizId && shuffledQuestions.length > 0) {
      const saved = loadUserDraftAnswers(quizId, user.id, shuffledQuestions);
      if (saved && Array.isArray(saved) && saved.length === shuffledQuestions.length) {
        setAnswers(saved);
      }
    }
  }, [quizStarted, quizId, user, shuffledQuestions]);

  // Auto-save draft answers as the user answers
  useEffect(() => {
    if (quizStarted && user && quizId && answers.length > 0) {
      const hasAnswer = answers.some(a => a !== null && a !== undefined && a !== '');
      if (hasAnswer) {
        saveUserDraftAnswers(quizId, user.id, answers, shuffledQuestions);
      }
    }
  }, [answers, quizStarted, quizId, user, shuffledQuestions]);

  // Translate current question and options when language or question changes
  useEffect(() => {
    if (selectedLanguage === 'en' || !shuffledQuestions[currentQuestionIndex]) {
      setCurrentTranslations({ question: null, options: [] });
      return;
    }

    const question = shuffledQuestions[currentQuestionIndex];
    const options = question.displayOptions || question.options || [];

    const translateContent = async () => {
      const texts = [question.question, ...options];
      const translated = await translateBatch(texts, selectedLanguage);
      setCurrentTranslations({
        question: translated[0],
        options: translated.slice(1)
      });
    };

    translateContent();
  }, [selectedLanguage, currentQuestionIndex, shuffledQuestions]);

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      const progress = (currentTime / duration) * 100;
      setVideoProgress(progress);

      // Track maximum watched position to prevent fast-forward
      if (currentTime > maxWatchedPosition) {
        setMaxWatchedPosition(currentTime);
      }

      // Save progress to localStorage for resume capability
      if (user && quizId) {
        const progressKey = `videoProgress_${user.id}_${quizId}`;
        localStorage.setItem(progressKey, JSON.stringify({
          currentTime,
          duration,
          progress,
          maxWatchedPosition: Math.max(maxWatchedPosition, currentTime)
        }));
      }

      // Only allow quiz at 100% completion
      if (progress >= 100) {
        setVideoCompleted(true);
        if (!trainingConfirmationRequired) {
          setQuizStarted(true);
        }
      }
    }
  };

  const handleVideoSeeking = (e) => {
    e.preventDefault();
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      // If user tries to seek forward beyond what they've watched, revert it
      if (currentTime > maxWatchedPosition) {
        videoRef.current.currentTime = maxWatchedPosition;
        setWarningMessage('Fast-forwarding is disabled. Please watch the entire video.');
        setTimeout(() => setWarningMessage(''), 3000);
      }
    }
  };


  const handleAnswerChange = (questionIndex, value) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = value;
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    const currentAnswer = answers[currentQuestionIndex];
    
    // If skip questions are not allowed, check if current question is answered
    if (!quizData?.allowSkipQuestions && (currentAnswer === null || currentAnswer === undefined || currentAnswer === '')) {
      alert('Please answer this question before proceeding to the next one.');
      return;
    }
    
    const nextIndex = getNextQuestionIndex(shuffledQuestions, currentQuestionIndex, currentAnswer);
    if (nextIndex >= 0 && nextIndex < shuffledQuestions.length) {
      setCurrentQuestionIndex(nextIndex);
    } else {
      handleQuizSubmit();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleQuizSubmit = useCallback(() => {
    // Check if all questions are answered
    const unansweredQuestions = shuffledQuestions.map((q, i) => {
      const answer = answers[i];
      const isAnswered = answer !== null && answer !== undefined && answer !== '';
      return { questionIndex: i, isAnswered };
    }).filter(q => !q.isAnswered);

    if (unansweredQuestions.length > 0) {
      alert(`Please answer all questions before submitting. ${unansweredQuestions.length} question(s) remaining.`);
      return;
    }

    setQuizCompleted(true);
    
    // Check if quizData exists
    if (!quizData) {
      return;
    }
    
    // Get user data directly from localStorage to ensure department is captured
    const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // Calculate score
    const score = calculateScore(shuffledQuestions, answers);
    const correctAnswers = Math.round((score / 100) * shuffledQuestions.length);
    
    // Generate unique resultId with timestamp + random to avoid collisions
    const resultId = reviewResult?.id || reviewResultId || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    // Infer training type from storage to be robust
    const storedQuizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
    const storedVideos = JSON.parse(localStorage.getItem('videos') || '[]');
    const inferredType = storedVideos.some(v => v.id === quizId) ? 'Video training' : (storedQuizzes.some(q => q.id === quizId) ? (quizData.trainingType || 'Quiz') : 'Quiz');

    // Determine the source name - check if it's a follow-up quiz first
    const trainingItems = JSON.parse(localStorage.getItem('trainingItems') || '[]');
    
    // Check if this quizId matches a follow-up quiz (it's the follow-upId, not the parent ID)
    const parentTrainingItem = trainingItems.find(t => t.followUpType === 'quiz' && String(t.followUpId) === String(quizId));
    const parentVideo = storedVideos.find(v => v.followUpType === 'quiz' && String(v.followUpId) === String(quizId));
    
    // If it's a follow-up quiz, use the parent's title
    // If it's a direct item, use the item's own title
    const sourceTitle = parentTrainingItem?.title || parentVideo?.title || quizData.title || 'Unknown';
    
    const result = {
      id: resultId,
      quizId: quizId,
      quizTitle: sourceTitle, // Use the original source title (training library name)
      originalQuizTitle: quizData.title, // Keep quiz title as reference
      userId: userData?.id || user?.id || 'demo-user',
      userName: userData?.name || user?.name || 'Demo User',
      userDepartment: userData?.department || user?.department || 'N/A',
      trainingType: inferredType,
      score: score,
      correctAnswers: correctAnswers,
      totalQuestions: shuffledQuestions.length,
      timeTaken: (quizData.timeLimit * 60) - timeRemaining,
      completedAt: new Date().toISOString(),
      answers: answers,
      questions: shuffledQuestions,
      passPercentage: quizData.passPercentage || 60
    };

    const existingResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
    const resultIndex = existingResults.findIndex(r => r.id === resultId);
    if (resultIndex !== -1) {
      existingResults[resultIndex] = result;
    } else {
      existingResults.push(result);
    }
    localStorage.setItem('quizResults', JSON.stringify(existingResults));
    DataManager.saveQuizResult(result).catch(e => console.error('Supabase quiz result sync error:', e));

    // Check out from training - update attendance record
    const attendances = JSON.parse(localStorage.getItem('attendances') || '[]');
    const userAttendance = attendances.find(a => 
      a.userId === userData?.id && 
      a.status === 'checked-in' &&
      (a.trainingId === quizId || a.contentId === quizId)
    );
    if (userAttendance) {
      userAttendance.checkOutTime = new Date().toISOString();
      userAttendance.status = 'completed';
      localStorage.setItem('attendances', JSON.stringify(attendances));
      console.log('Checked out from training:', userAttendance);
    } else {
      // Fallback: check if there's any checked-in attendance for this user
      const anyCheckedIn = attendances.find(a => a.userId === userData?.id && a.status === 'checked-in');
      if (anyCheckedIn) {
        anyCheckedIn.checkOutTime = new Date().toISOString();
        anyCheckedIn.status = 'completed';
        localStorage.setItem('attendances', JSON.stringify(attendances));
        console.log('Checked out from training (fallback):', anyCheckedIn);
      }
    }

    // Immediately sync quiz results to cloud

    // Clear draft answers for this quiz
    if (user) {
      clearUserDraftAnswers(quizId, user.id);
    }

    // Certificate issuance is now handled by admin only
    // Users can no longer automatically receive certificates upon passing
  }, [quizData, quizId, user, shuffledQuestions, answers, timeRemaining, reviewResult, reviewResultId]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderQuestionInput = (question, index) => {
    const qType = question.type || QUESTION_TYPES.MULTIPLE_CHOICE;
    const currentAnswer = answers[index];

    if (qType === QUESTION_TYPES.MULTIPLE_CHOICE || qType === QUESTION_TYPES.TRUE_FALSE) {
      const options = question.displayOptions || question.options || [];
      return (
        <div className="space-y-2 md:space-y-3">
          {options.map((option, optionIndex) => {
            const translatedOption = currentTranslations.options[optionIndex] || option;
            return (
              <label
                key={optionIndex}
                className={`flex items-start p-3 md:p-4 border rounded-lg cursor-pointer transition-colors ${
                  currentAnswer === optionIndex
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${index}`}
                  checked={currentAnswer === optionIndex}
                  onChange={() => handleAnswerChange(index, optionIndex)}
                  className="mr-2 md:mr-3 mt-0.5 flex-shrink-0"
                />
                <div className="flex-1">
                  <span className="text-sm md:text-base text-gray-900 font-medium">{option || `Option ${optionIndex + 1}`}</span>
                  {selectedLanguage !== 'en' && translatedOption !== option && (
                    <span className="block text-sm md:text-base text-gray-600 mt-1">{translatedOption}</span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      );
    }

    if (qType === QUESTION_TYPES.FILL_IN_BLANK) {
      return (
        <div>
          <input
            type="text"
            value={currentAnswer || ''}
            onChange={(e) => handleAnswerChange(index, e.target.value)}
            placeholder="Type your answer"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      );
    }

    if (qType === QUESTION_TYPES.NPS_SCALE) {
      const min = Number(question.npsMin ?? 0);
      const max = Number(question.npsMax ?? 10);
      const minLabel = question.scaleMinLabel || 'Not at all likely';
      const maxLabel = question.scaleMaxLabel || 'Extremely likely';
      const values = [];
      for (let i = min; i <= max; i++) values.push(i);
      return (
        <div>
          <div className="flex flex-wrap gap-2 md:gap-3 justify-center mb-3">
            {values.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleAnswerChange(index, val)}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-lg border font-semibold text-sm md:text-base transition-colors ${
                  Number(currentAnswer) === val
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs md:text-sm text-gray-600 px-1">
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
          </div>
        </div>
      );
    }

    return null;
  };

  // Handle training completion confirmation
  const confirmTrainingCompletion = () => {
    const userData = JSON.parse(localStorage.getItem('currentUser'));
    const trainingCompletions = JSON.parse(localStorage.getItem('trainingCompletions') || '[]');
    
    // Add new completion record
    const completion = {
      id: `tc-${Date.now()}`,
      itemId: quizId,
      userId: userData?.id || user?.id,
      completedAt: new Date().toISOString(),
      itemType: quizData?.type || 'quiz'
    };
    
    trainingCompletions.push(completion);
    localStorage.setItem('trainingCompletions', JSON.stringify(trainingCompletions));
    
    // Clear training required state
    setTrainingConfirmationRequired(false);
    
    // Allow quiz to start
    setQuizStarted(true);
  };

  const startQuiz = () => {
    // Force start quiz if there's no video or video is completed
    if (!showVideo || videoCompleted) {
      setQuizStarted(true);
      return;
    }
    
    // Show warning if video needs to be watched
    setWarningMessage('Please watch the entire video before starting the quiz.');
    setTimeout(() => setWarningMessage(''), 3000);
  };

  if (!quizData) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading quiz...</p>
      </div>
    </div>;
  }

  if (isReviewMode && reviewResult && !quizStarted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="md:flex">
          <div className="hidden md:block"><Sidebar currentUser={user} /></div>
          <div className="flex-1 md:ml-64">
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
              <div className="max-w-4xl mx-auto px-3 md:px-6 lg:px-8">
                <div className="flex justify-between items-center h-14 md:h-16">
                  <div className="flex items-center">
                    <button
                      onClick={goBack}
                      className="mr-2 md:mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition duration-200"
                      title="Back"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-base md:text-xl font-semibold text-gray-900">Submitted Response</h1>
                  </div>
                </div>
              </div>
            </header>

            <main className="max-w-4xl mx-auto px-3 md:px-6 lg:px-8 py-4 md:py-8 pb-20 md:pb-8">
              <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 md:gap-4 mb-4 md:mb-8">
                  <div className="flex-1">
                    <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">{reviewResult.quizTitle}</h2>
                    <p className="text-xs md:text-sm text-gray-500">Submitted on {new Date(reviewResult.completedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center sm:flex-col sm:items-end gap-2">
                    <div className="text-xs md:text-sm text-gray-600">Score</div>
                    <div className="text-2xl md:text-3xl font-bold text-blue-600">{reviewResult.score}%</div>
                  </div>
                </div>

                <div className="space-y-3 md:space-y-6">
                  {reviewResult.questions.map((question, index) => {
                    const isCorrect = checkAnswerCorrect(question, answers[index]);
                    return (
                      <div key={index} className="bg-slate-50 rounded-lg md:rounded-2xl p-3 md:p-6 border border-slate-200">
                        <div className="mb-2 md:mb-4 flex items-center justify-between">
                          <span className="text-xs md:text-sm font-semibold text-slate-700">Question {index + 1}</span>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>
                        <div className="text-sm md:text-base text-slate-900 font-medium mb-3 md:mb-4">{question.question}</div>
                        <div className="bg-white rounded-lg p-3 md:p-4 border border-slate-200">
                          <div className="text-xs text-slate-500 mb-1">Your answer</div>
                          <div className="text-sm md:text-base text-slate-800 font-medium">{formatAnswerText(question, answers[index])}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    const score = calculateScore(shuffledQuestions, answers);
    const correctAnswers = Math.round((score / 100) * shuffledQuestions.length);
    const passThreshold = quizData?.passPercentage || 70;
    const hasPassed = score >= passThreshold;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <div className={`w-16 h-16 ${hasPassed ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-6`}>
            {hasPassed ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-600" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {hasPassed ? 'Congratulations!' : 'Quiz Completed'}
          </h2>
          
          <div className="space-y-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Your Score</p>
              <p className={`text-3xl font-bold ${hasPassed ? 'text-green-600' : 'text-red-600'}`}>{score}%</p>
              <p className="text-xs text-gray-500 mt-1">Pass: {passThreshold}%</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-600">Correct Answers</p>
                <p className="font-semibold text-green-600">{correctAnswers}/{shuffledQuestions.length}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-600">Time Taken</p>
                <p className="font-semibold">{formatTime((quizData?.timeLimit * 60) - timeRemaining)}</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={goBack}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="md:flex">
        <div className="hidden md:block"><Sidebar currentUser={user} /></div>
        
        <div className="flex-1 md:ml-64">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
            <div className="max-w-4xl mx-auto px-3 md:px-6 lg:px-8">
              <div className="flex justify-between items-center h-14 md:h-16">
                <div className="flex items-center min-w-0">
                  <button
                    onClick={goBack}
                    className="mr-2 md:mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition duration-200 flex-shrink-0"
                    title="Back"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h1 className="text-base md:text-xl font-semibold text-gray-900 truncate">{quizData?.title || 'Quiz'}</h1>
                </div>
                <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
                  {quizData && (
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="ta">தமிழ் (Tamil)</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                      <option value="te">తెలుగు (Telugu)</option>
                      <option value="kn">ಕನ್ನಡ (Kannada)</option>
                      <option value="ml">മലയാളം (Malayalam)</option>
                    </select>
                  )}
                  {quizStarted && (
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                      <span className={`font-mono text-sm md:text-base ${timeRemaining < 300 ? 'text-red-600 font-semibold' : ''}`}>
                        {formatTime(timeRemaining)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-4xl mx-auto px-3 md:px-6 lg:px-8 py-4 md:py-8 pb-20 md:pb-8">
          {warningMessage && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 md:px-4 py-2 md:py-3 rounded-lg mb-4 md:mb-6 flex items-center text-sm">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" />
              {warningMessage}
            </div>
          )}

          {/* Video Section */}
          {showVideo && !videoCompleted && (
            <div className="bg-white rounded-lg shadow-md md:shadow-lg p-3 md:p-6 mb-4 md:mb-6">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Training Video</h2>
              
              {/* Video Display */}
              <VideoPlayer videoUrl={quizData.videoUrl} />

              {/* Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Quiz Section */}
          {(() => {
            const shouldShowQuiz = !showVideo || videoCompleted;
            return shouldShowQuiz;
          })() && (
            <>
              {(() => {
                return !quizStarted;
              })() ? (
                trainingConfirmationRequired ? (
                  // Training Confirmation Screen
                  <div className="bg-white rounded-lg shadow-md md:shadow-lg p-4 md:p-8 text-center">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                      <AlertCircle className="w-7 h-7 md:w-8 md:h-8 text-amber-600" />
                    </div>
                    
                    <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">Training Completion Required</h2>
                    
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
                      <p className="text-amber-800 font-medium mb-2 text-sm md:text-base">You previously failed this assessment.</p>
                      <p className="text-amber-700 text-xs md:text-sm">
                        Please confirm that you have reviewed the training material and are ready to retake the quiz.
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <button
                        onClick={confirmTrainingCompletion}
                        type="button"
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-sm md:text-base hover:bg-green-700 transition duration-200"
                      >
                        I Confirm - Start Quiz Now
                      </button>
                      
                      <button
                        onClick={goBack}
                        type="button"
                        className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold text-sm md:text-base hover:bg-gray-300 transition duration-200"
                      >
                        Go Back to Review Material
                      </button>
                    </div>
                  </div>
                ) : (
                  // Normal Start Screen
                  <div className="bg-white rounded-lg shadow-md md:shadow-lg p-4 md:p-8 text-center">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                      <AlertCircle className="w-7 h-7 md:w-8 md:h-8 text-blue-600" />
                    </div>
                    
                    <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">Ready to Start?</h2>
                    <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base">
                      You will answer {shuffledQuestions.length} questions in {quizData.timeLimit || 30} minutes.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6 text-sm">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-600 text-xs md:text-sm">Total Questions</p>
                        <p className="font-semibold text-sm md:text-base">{shuffledQuestions.length}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-600 text-xs md:text-sm">Time Limit</p>
                        <p className="font-semibold text-sm md:text-base">{quizData.timeLimit || 30} minutes</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        startQuiz();
                      }}
                      type="button"
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-sm md:text-base hover:bg-blue-700 transition duration-200"
                    >
                      Start Quiz
                    </button>
                  </div>
                )
              ) : (
                <div className="bg-white rounded-lg shadow-md md:shadow-lg p-3 md:p-6">
                  {/* Check if questions are available */}
                  {shuffledQuestions.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-600 text-sm">No questions available for this quiz.</p>
                      <button
                        onClick={goBack}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                      >
                        Back
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Progress Bar */}
                      <div className="mb-4 md:mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs md:text-sm text-gray-600">
                            Q{currentQuestionIndex + 1} of {shuffledQuestions.length}
                          </span>
                          <span className="text-xs md:text-sm text-gray-600">
                            {Math.round(((currentQuestionIndex + 1) / shuffledQuestions.length) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentQuestionIndex + 1) / shuffledQuestions.length) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Question */}
                      <div className="mb-4 md:mb-6">
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 md:mb-3">
                          {shuffledQuestions[currentQuestionIndex].question || 'Question not available'}
                        </h3>
                        {selectedLanguage !== 'en' && currentTranslations.question && (
                          <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4 italic">
                            {currentTranslations.question}
                          </p>
                        )}
                      
                        {renderQuestionInput(shuffledQuestions[currentQuestionIndex], currentQuestionIndex)}
                      </div>

                      {/* Navigation */}
                      <div className="flex justify-between gap-2">
                        <button
                          onClick={handlePreviousQuestion}
                          disabled={currentQuestionIndex === 0}
                          className={`px-4 md:px-6 py-2 rounded-lg font-medium text-sm md:text-base transition duration-200 ${
                            currentQuestionIndex === 0
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Previous
                        </button>
                        
                        <button
                          onClick={handleNextQuestion}
                          className="px-4 md:px-6 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm md:text-base hover:bg-blue-700 transition duration-200"
                        >
                          {currentQuestionIndex === shuffledQuestions.length - 1 ? 'Submit Quiz' : 'Next'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </main>
        </div>
      </div>
    </div>
  );
};

export default UserQuiz;
