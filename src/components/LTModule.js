import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, Video, FileText, BookOpen, Save, Trash2, Edit2, Download, FileSpreadsheet, AlertCircle, CheckCircle, Share, Users } from 'lucide-react';
import Sidebar from './Sidebar';
import { createDefaultQuestion, QUESTION_TYPES, saveDraft, loadDraft, clearDraft } from '../services/quizHelpers';

const SUPPORTED_LANGUAGES = [
  { code: 'ta', label: 'Tamil' },
  { code: 'hi', label: 'Hindi' },
  { code: 'te', label: 'Telugu' },
  { code: 'kn', label: 'Kannada' },
  { code: 'ml', label: 'Malayalam' }
];

const LTModule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('quiz');
  const [users, setUsers] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [videos, setVideos] = useState([]);
  const [trainingItems, setTrainingItems] = useState([]);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [showQuizView, setShowQuizView] = useState(false);
  const [selectedQuizView, setSelectedQuizView] = useState(null);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [showVideoView, setShowVideoView] = useState(false);
  const [selectedVideoView, setSelectedVideoView] = useState(null);
  const [showTrainingForm, setShowTrainingForm] = useState(false);
  const [showTrainingView, setShowTrainingView] = useState(false);
  const [selectedTrainingView, setSelectedTrainingView] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);
  const [editingTraining, setEditingTraining] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);
  const [shareSelectedUsers, setShareSelectedUsers] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSearchTerm, setShareSearchTerm] = useState('');
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [userDetailsData, setUserDetailsData] = useState({ shared: [], attempted: [], title: '' });
  
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    referenceType: 'direct',
    trainingReferenceId: '',
    questions: [],
    questionsPerUser: 15,
    timeLimit: 30,
    passPercentage: 70,
    certificateEnabled: true,
    certificateValidityValue: 1,
    certificateValidityUnit: 'year',
    accessMode: 'permanent',
    reassignOnFail: false,
    rescheduleDays: 7,
    allowSkipQuestions: false,
    selectedUsers: []
  });

  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    referenceType: 'direct',
    trainingReferenceId: '',
    videoUrl: '',
    videoFile: null,
    videoSourceType: 'url', // 'url' or 'file'
    blobUrl: null, // Add blobUrl field to maintain reference
    questions: [],
    questionsPerUser: 15,
    timeLimit: 30,
    passPercentage: 70,
    certificateEnabled: true,
    certificateValidityValue: 1,
    certificateValidityUnit: 'year',
    accessMode: 'permanent',
    reassignOnFail: false,
    rescheduleDays: 7,
    allowSkipQuestions: false,
    selectedUsers: []
  });

  const [trainingForm, setTrainingForm] = useState({
    title: '',
    description: '',
    assetType: 'document',
    sourceType: 'url',
    fileUrl: '',
    file: null,
    allowDownload: false,
    allowPrint: false,
    allowShare: false,
    followUpType: 'quiz',
    followUpId: '',
    questionsPerUser: 15,
    timeLimit: 30,
    passPercentage: 70,
    certificateEnabled: true,
    certificateValidityValue: 1,
    certificateValidityUnit: 'year',
    accessMode: 'permanent',
    reassignOnFail: false,
    rescheduleDays: 7,
    allowSkipQuestions: false,
    selectedUsers: []
  });


  const [currentQuestion, setCurrentQuestion] = useState(createDefaultQuestion(QUESTION_TYPES.MULTIPLE_CHOICE));

  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [uploadErrors, setUploadErrors] = useState([]);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [uploadedVideos, setUploadedVideos] = useState({});
  const [showQuizBulkUpload, setShowQuizBulkUpload] = useState(false);
  const [showVideoBulkUpload, setShowVideoBulkUpload] = useState(false);

  const loadData = useCallback(() => {
    setUsers(JSON.parse(localStorage.getItem('users') || '[]'));
    setQuizzes(JSON.parse(localStorage.getItem('quizzes') || '[]'));
    setVideos(JSON.parse(localStorage.getItem('videos') || '[]'));
    setTrainingItems(
      JSON.parse(localStorage.getItem('trainingItems') || '[]')
        .map(normalizeTrainingItem)
    );
  }, []);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated) {
      navigate('/login');
    }
    loadData();
  }, [navigate, loadData]);

  // Resume a draft when navigated from the Drafts module
  useEffect(() => {
    const { draftType, draftId } = location.state || {};
    if (!draftType || !draftId) return;

    const draft = loadDraft(draftType, draftId);
    if (!draft?.payload) return;

    const isEdit = draftId !== 'new';
    if (draftType === 'quiz') {
      const existing = quizzes.find(q => q.id === draftId);
      setQuizForm({
        ...draft.payload,
        questions: (draft.payload.questions || []).map(normalizeQuestion)
      });
      setEditingQuiz(isEdit && existing ? existing : null);
      setActiveTab('quiz');
      setShowQuizForm(true);
    } else if (draftType === 'video') {
      const existing = videos.find(v => v.id === draftId);
      setVideoForm({
        ...draft.payload,
        questions: (draft.payload.questions || []).map(normalizeQuestion)
      });
      setEditingVideo(isEdit && existing ? existing : null);
      setActiveTab('video');
      setShowVideoForm(true);
    } else if (draftType === 'training') {
      const existing = trainingItems.find(t => t.id === draftId);
      setTrainingForm(draft.payload);
      setEditingTraining(isEdit && existing ? existing : null);
      setActiveTab('training');
      setShowTrainingForm(true);
    }

    // Clear the navigation state so a refresh doesn't reopen the draft
    navigate(location.pathname, { replace: true, state: {} });
  }, [quizzes, videos, trainingItems, location.state, location.pathname, navigate]);

  // Load admin drafts when opening forms
  useEffect(() => {
    if (showQuizForm && !editingQuiz) {
      const draft = loadDraft('quiz', 'new');
      if (draft?.payload) {
        setQuizForm({
          ...draft.payload,
          questions: (draft.payload.questions || []).map(normalizeQuestion)
        });
      }
    }
  }, [showQuizForm, editingQuiz]);

  useEffect(() => {
    if (showVideoForm && !editingVideo) {
      const draft = loadDraft('video', 'new');
      if (draft?.payload) {
        setVideoForm({
          ...draft.payload,
          questions: (draft.payload.questions || []).map(normalizeQuestion)
        });
      }
    }
  }, [showVideoForm, editingVideo]);

  useEffect(() => {
    if (showTrainingForm && !editingTraining) {
      const draft = loadDraft('training', 'new');
      if (draft?.payload) setTrainingForm(draft.payload);
    }
  }, [showTrainingForm, editingTraining]);

  const handleSaveDraft = () => {
    const draftId = activeTab === 'quiz' ? (editingQuiz?.id || 'new') : activeTab === 'video' ? (editingVideo?.id || 'new') : (editingTraining?.id || 'new');
    const payload = activeTab === 'quiz' ? quizForm : activeTab === 'video' ? videoForm : trainingForm;
    saveDraft(activeTab, draftId, payload);
    alert('Draft saved successfully.');
  };

  const normalizeTrainingItem = (item) => ({
    ...item,
    type: item.type || 'training',
    selectedUsers: Array.isArray(item.selectedUsers) ? item.selectedUsers : [],
    allowDownload: item.allowDownload ?? false,
    allowPrint: item.allowPrint ?? false,
    allowShare: item.allowShare ?? false,
    followUpType: item.followUpType || 'quiz',
    followUpId: item.followUpId || '',
    questionsPerUser: item.questionsPerUser || 15,
    timeLimit: item.timeLimit || 30,
    passPercentage: item.passPercentage || 70,
    certificateEnabled: item.certificateEnabled ?? true,
    certificateValidityValue: item.certificateValidityValue || 1,
    certificateValidityUnit: item.certificateValidityUnit || 'year',
    accessMode: item.accessMode || 'permanent'
  });

  const getDefaultQuestion = () => createDefaultQuestion(QUESTION_TYPES.MULTIPLE_CHOICE);

  const normalizeQuestion = (q) => ({
    ...q,
    questionTranslations: q.questionTranslations || {},
    optionTranslations: Array.isArray(q.optionTranslations) ? q.optionTranslations : []
  });

  const isQuestionValid = (q) => {
    if (!q.question?.trim()) return false;
    switch (q.type || QUESTION_TYPES.MULTIPLE_CHOICE) {
      case QUESTION_TYPES.MULTIPLE_CHOICE:
        return q.options?.every(opt => opt?.trim()) && q.options.length >= 2;
      case QUESTION_TYPES.TRUE_FALSE:
        return true;
      case QUESTION_TYPES.FILL_IN_BLANK:
        return q.correctText?.trim();
      case QUESTION_TYPES.NPS_SCALE:
        return true;
      default:
        return false;
    }
  };

  const addQuestion = () => {
    if (!isQuestionValid(currentQuestion)) {
      alert('Please fill in the question and required fields for the selected question type.');
      return;
    }

    const questionToAdd = {
      ...currentQuestion,
      id: currentQuestion.id || `q-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    };
    const newQuestions = [...(activeTab === 'quiz' ? quizForm.questions : videoForm.questions), questionToAdd];
    
    if (activeTab === 'quiz') {
      setQuizForm({ ...quizForm, questions: newQuestions });
    } else {
      setVideoForm({ ...videoForm, questions: newQuestions });
    }
    
    setCurrentQuestion(getDefaultQuestion());
  };

  const removeQuestion = (index) => {
    if (activeTab === 'quiz') {
      const newQuestions = quizForm.questions.filter((_, i) => i !== index);
      setQuizForm({ ...quizForm, questions: newQuestions });
    } else {
      const newQuestions = videoForm.questions.filter((_, i) => i !== index);
      setVideoForm({ ...videoForm, questions: newQuestions });
    }
  };

  const handleQuizSubmit = (e) => {
    e.preventDefault();
    
    const quizData = {
      id: editingQuiz ? editingQuiz.id : Date.now().toString(),
      ...quizForm,
      type: 'quiz',
      createdAt: editingQuiz ? editingQuiz.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    let updatedQuizzes;
    if (editingQuiz) {
      updatedQuizzes = quizzes.map(q => q.id === editingQuiz.id ? quizData : q);
    } else {
      updatedQuizzes = [...quizzes, quizData];
    }

    localStorage.setItem('quizzes', JSON.stringify(updatedQuizzes));
    setQuizzes(updatedQuizzes);
    clearDraft('quiz', editingQuiz ? editingQuiz.id : 'new');
    resetQuizForm();
  };

  const handleVideoSubmit = (e) => {
    e.preventDefault();
    
    // If file is selected but not uploaded yet, simulate upload first
    if (videoForm.videoSourceType === 'file' && videoForm.videoFile && videoUploadProgress === 0) {
      simulateVideoUpload();
      return;
    }
    
    // Handle file upload with IndexedDB storage
    if (videoForm.videoSourceType === 'file' && videoForm.videoFile) {
      const videoId = editingVideo ? editingVideo.id : Date.now().toString();
      
      // Store video file in IndexedDB
      const storeVideoInIndexedDB = (videoFile, videoId) => {
        return new Promise((resolve, reject) => {
          const request = indexedDB.open('VideoTrainingDB', 5);
          
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['videos'], 'readwrite');
            const store = transaction.objectStore('videos');
            
            const videoData = {
              id: videoId,
              file: videoFile,
              createdAt: new Date().toISOString()
            };
            
            const addRequest = store.put(videoData);
            addRequest.onsuccess = () => resolve(videoId);
            addRequest.onerror = () => reject(addRequest.error);
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
      
      storeVideoInIndexedDB(videoForm.videoFile, videoId)
        .then(() => {
          const videoData = {
            id: videoId,
            title: videoForm.title,
            description: videoForm.description,
            videoUrl: `indexeddb://${videoId}`, // Reference to IndexedDB
            videoSourceType: 'file',
            questions: videoForm.questions,
            questionsPerUser: videoForm.questionsPerUser,
            timeLimit: videoForm.timeLimit,
            passPercentage: videoForm.passPercentage,
            certificateEnabled: videoForm.certificateEnabled,
            certificateValidityValue: videoForm.certificateValidityValue,
            certificateValidityUnit: videoForm.certificateValidityUnit,
            accessMode: videoForm.accessMode,
            reassignOnFail: videoForm.reassignOnFail,
            rescheduleDays: videoForm.rescheduleDays,
            selectedUsers: videoForm.selectedUsers,
            type: 'video',
            createdAt: editingVideo ? editingVideo.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true
          };
          
          let updatedVideos;
          if (editingVideo) {
            updatedVideos = videos.map(v => v.id === editingVideo.id ? videoData : v);
          } else {
            updatedVideos = [...videos, videoData];
          }

          localStorage.setItem('videos', JSON.stringify(updatedVideos));
          setVideos(updatedVideos);
          
          // Show success message and close form
          const action = editingVideo ? 'updated' : 'created';
          alert(`Video training ${action} successfully!`);
          clearDraft('video', editingVideo ? editingVideo.id : 'new');
          resetVideoForm();
        })
        .catch(error => {
          alert('Error storing video. Please try again.');
        });
    } else {
      // Handle URL submission (existing logic)
      const videoData = {
        id: editingVideo ? editingVideo.id : Date.now().toString(),
        ...videoForm,
        type: 'video',
        createdAt: editingVideo ? editingVideo.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      };
      
      // Remove file object from storage as it's not serializable
      const { videoFile, ...serializableData } = videoData;
      
      let updatedVideos;
      if (editingVideo) {
        updatedVideos = videos.map(v => v.id === editingVideo.id ? serializableData : v);
      } else {
        updatedVideos = [...videos, serializableData];
      }

      localStorage.setItem('videos', JSON.stringify(updatedVideos));
      setVideos(updatedVideos);
      
      // Show success message and close form
      const action = editingVideo ? 'updated' : 'created';
      alert(`Video training ${action} successfully!`);
      clearDraft('video', editingVideo ? editingVideo.id : 'new');
      resetVideoForm();
    }
  };

  const resetQuizForm = () => {
    setQuizForm({
      title: '',
      description: '',
      referenceType: 'direct',
      trainingReferenceId: '',
      questions: [],
      questionsPerUser: 15,
      timeLimit: 30,
      passPercentage: 70,
      certificateEnabled: true,
      certificateValidityValue: 1,
      certificateValidityUnit: 'year',
      accessMode: 'permanent',
      reassignOnFail: false,
      rescheduleDays: 7,
      selectedUsers: []
    });
    setShowQuizForm(false);
    setEditingQuiz(null);
  };

  const resetVideoForm = () => {
    setVideoForm({
      title: '',
      description: '',
      videoUrl: '',
      videoFile: null,
      blobUrl: null, // Clear blobUrl when resetting
      videoSourceType: 'url',
      questions: [],
      questionsPerUser: 15,
      timeLimit: 30,
      passPercentage: 70,
      certificateEnabled: true,
      certificateValidityValue: 1,
      certificateValidityUnit: 'year',
      accessMode: 'permanent',
      reassignOnFail: false,
      rescheduleDays: 7,
      selectedUsers: []
    });
    setShowVideoForm(false);
    setEditingVideo(null);
    setVideoUploadProgress(0);
  };

  const resetTrainingForm = () => {
    setTrainingForm({
      title: '',
      description: '',
      assetType: 'document',
      sourceType: 'url',
      fileUrl: '',
      file: null,
      allowDownload: false,
      allowPrint: false,
      allowShare: false,
      followUpType: 'quiz',
      followUpId: '',
      questionsPerUser: 15,
      timeLimit: 30,
      passPercentage: 70,
      certificateEnabled: true,
      certificateValidityValue: 1,
      certificateValidityUnit: 'year',
      accessMode: 'permanent',
      reassignOnFail: false,
      rescheduleDays: 7,
      selectedUsers: []
    });
    setShowTrainingForm(false);
    setEditingTraining(null);
  }; 

  // Bulk Upload Functions
  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const questions = [];
    const errors = [];

    // Skip header if exists
    const header = lines[0] || '';
    const startIndex = header.toLowerCase().includes('question') ? 1 : 0;
    const hasTypeColumn = header.toLowerCase().startsWith('type');

    for (let i = startIndex; i < lines.length; i++) {
      // Parse CSV line respecting quoted values
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));

      const makeQuestion = (type, qText, options, correctAnswer, correctText, caseSensitive, npsMin, npsMax) => {
        const base = { id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, type, question: qText };
        switch (type) {
          case QUESTION_TYPES.MULTIPLE_CHOICE:
          case QUESTION_TYPES.TRUE_FALSE:
            return { ...base, options: options || [], correctAnswer: parseInt(correctAnswer) || 0 };
          case QUESTION_TYPES.FILL_IN_BLANK:
            return { ...base, correctText: correctText || '', caseSensitive: caseSensitive === 'true' || caseSensitive === true };
          case QUESTION_TYPES.NPS_SCALE:
            return { ...base, npsMin: parseInt(npsMin) || 0, npsMax: parseInt(npsMax) || 10, correctAnswer: correctAnswer ? parseInt(correctAnswer) : null };
          default:
            return { ...base, options: options || [], correctAnswer: parseInt(correctAnswer) || 0 };
        }
      };

      let type, qText, options, correctAnswer, correctText, caseSensitive, npsMin, npsMax;

      if (hasTypeColumn) {
        // Format: type,question,options,correctAnswer,correctText,caseSensitive,npsMin,npsMax
        if (values.length < 8) {
          errors.push(`Line ${i + 1}: Invalid format - expected 8 columns for typed CSV`);
          continue;
        }
        type = values[0] || QUESTION_TYPES.MULTIPLE_CHOICE;
        qText = values[1];
        options = values[2] ? values[2].split('|').map(o => o.trim()) : [];
        correctAnswer = values[3];
        correctText = values[4];
        caseSensitive = values[5];
        npsMin = values[6];
        npsMax = values[7];
      } else {
        // Legacy format: Question,Option1,Option2,Option3,Option4,Correct Answer
        if (values.length < 6) {
          errors.push(`Line ${i + 1}: Invalid format - expected 6 columns`);
          continue;
        }
        type = QUESTION_TYPES.MULTIPLE_CHOICE;
        qText = values[0];
        options = [values[1], values[2], values[3], values[4]];
        correctAnswer = parseInt(values[5]) - 1; // Convert to 0-based index
      }

      const question = makeQuestion(type, qText, options, correctAnswer, correctText, caseSensitive, npsMin, npsMax);

      // Validate
      if (!question.question) {
        errors.push(`Line ${i + 1}: Question text is empty`);
      } else if (isQuestionValid(question)) {
        questions.push(question);
      } else {
        errors.push(`Line ${i + 1}: Invalid fields for question type ${question.type}`);
      }
    }

    return { questions, errors };
  };

  const parseJSON = (text) => {
    try {
      const data = JSON.parse(text);
      const questions = [];
      const errors = [];

      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          const type = item.type || QUESTION_TYPES.MULTIPLE_CHOICE;
          const base = {
            id: item.id || `q-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            question: item.question,
            type
          };

          let question;
          switch (type) {
            case QUESTION_TYPES.MULTIPLE_CHOICE:
            case QUESTION_TYPES.TRUE_FALSE:
              question = {
                ...base,
                options: item.options || [],
                correctAnswer: parseInt(item.correctAnswer) || 0,
                randomizeOptions: item.randomizeOptions || false
              };
              break;
            case QUESTION_TYPES.FILL_IN_BLANK:
              question = {
                ...base,
                correctText: item.correctText || '',
                caseSensitive: item.caseSensitive || false
              };
              break;
            case QUESTION_TYPES.NPS_SCALE:
              question = {
                ...base,
                npsMin: item.npsMin ?? 0,
                npsMax: item.npsMax ?? 10,
                scaleMinLabel: item.scaleMinLabel || 'Not at all likely',
                scaleMaxLabel: item.scaleMaxLabel || 'Extremely likely',
                correctAnswer: item.correctAnswer !== undefined && item.correctAnswer !== null ? parseInt(item.correctAnswer) : null
              };
              break;
            default:
              errors.push(`Item ${index + 1}: Unknown question type ${type}`);
              return;
          }

          if (question && isQuestionValid(question)) {
            questions.push(question);
          } else {
            errors.push(`Item ${index + 1}: Invalid fields for question type ${type}`);
          }
        });
      } else {
        errors.push('JSON must be an array of questions');
      }

      return { questions, errors };
    } catch (error) {
      return { questions: [], errors: ['Invalid JSON format'] };
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadedFile(file);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target.result;
      let result;
      
      if (file.name.endsWith('.csv')) {
        result = parseCSV(content);
      } else if (file.name.endsWith('.json')) {
        result = parseJSON(content);
      } else {
        setUploadErrors(['Please upload a CSV or JSON file']);
        return;
      }
      
      setPreviewData(result.questions);
      setUploadErrors(result.errors);
    };
    
    reader.readAsText(file);
  };

  const confirmBulkUpload = () => {
    if (previewData.length === 0) {
      setUploadErrors(['No valid questions to upload']);
      return;
    }
    
    const normalizedQuestions = previewData.map(normalizeQuestion);
    if (activeTab === 'quiz' || showQuizBulkUpload) {
      setQuizForm({
        ...quizForm,
        questions: [...quizForm.questions, ...normalizedQuestions]
      });
      setShowQuizBulkUpload(false);
    } else {
      setVideoForm({
        ...videoForm,
        questions: [...videoForm.questions, ...normalizedQuestions]
      });
      setShowVideoBulkUpload(false);
    }
    
    // Reset bulk upload state
    setUploadedFile(null);
    setPreviewData([]);
    setUploadErrors([]);
  };

  const downloadSampleCSV = () => {
    const csvContent = `type,question,options,correctAnswer,correctText,caseSensitive,npsMin,npsMax
mcq,"What is 2+2?","3|4|5|6",1,,,
mcq,"What is the capital of France?","London|Paris|Berlin|Madrid",1,,,
truefalse,"The sky is blue.","True|False",0,,,
fillblank,"What is H2O?",,,Water,false,,
nps,"How likely are you to recommend us?",,,,,0,10`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_questions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadSampleJSON = () => {
    const jsonContent = JSON.stringify([
      {
        type: "mcq",
        question: "What is 2+2?",
        options: ["3", "4", "5", "6"],
        correctAnswer: 1,
        randomizeOptions: false
      },
      {
        type: "truefalse",
        question: "The sky is blue.",
        options: ["True", "False"],
        correctAnswer: 0
      },
      {
        type: "fillblank",
        question: "What is H2O?",
        correctText: "Water",
        caseSensitive: false
      },
      {
        type: "nps",
        question: "How likely are you to recommend us?",
        npsMin: 0,
        npsMax: 10,
        correctAnswer: null,
        scaleMinLabel: "Not at all likely",
        scaleMaxLabel: "Extremely likely"
      }
    ], null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_questions.json';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Video File Upload Functions
  const handleVideoFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid video file (MP4, WebM, OGG, MOV, or AVI)');
      return;
    }
    
    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      alert('Video file size must be less than 100MB');
      return;
    }
    
    setVideoForm({
      ...videoForm,
      videoFile: file,
      videoSourceType: 'file',
      videoUrl: '' // Clear URL when file is selected
    });
  };

  const handleVideoUrlChange = (e) => {
    setVideoForm({
      ...videoForm,
      videoUrl: e.target.value,
      videoSourceType: 'url',
      videoFile: null // Clear file when URL is entered
    });
  };

  const simulateVideoUpload = () => {
    // Simulate file upload progress
    setVideoUploadProgress(0);
    const interval = setInterval(() => {
      setVideoUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
    
    // Simulate upload completion and store file reference
    setTimeout(() => {
      if (videoForm.videoFile) {
        const videoId = Date.now().toString();
        const videoData = {
          id: videoId,
          file: videoForm.videoFile,
          name: videoForm.videoFile.name,
          size: videoForm.videoFile.size,
          type: videoForm.videoFile.type,
          uploadedAt: new Date().toISOString()
        };
        
        const newUploadedVideos = { ...uploadedVideos, [videoId]: videoData };
        setUploadedVideos(newUploadedVideos);
        localStorage.setItem('uploadedVideos', JSON.stringify(newUploadedVideos));
      }
      setVideoUploadProgress(100);
    }, 2000);
  };

  const handleTrainingFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/x-msvideo'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid document or video file.');
      return;
    }

    if (file.size > 200 * 1024 * 1024) {
      alert('File size must be less than 200MB.');
      return;
    }

    setTrainingForm({
      ...trainingForm,
      file,
      sourceType: 'file',
      fileUrl: ''
    });
  };

  const storeTrainingAssetToIndexedDB = (file, assetId) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('VideoTrainingDB', 5);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['trainingAssets'], 'readwrite');
        const store = transaction.objectStore('trainingAssets');

        const assetData = {
          id: assetId,
          file,
          fileType: file.type,
          fileName: file.name,
          createdAt: new Date().toISOString()
        };

        const putRequest = store.put(assetData);
        putRequest.onsuccess = () => resolve(assetId);
        putRequest.onerror = () => reject(putRequest.error);
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

  const handleTrainingSubmit = (e) => {
    e.preventDefault();
    const trainingId = editingTraining ? editingTraining.id : Date.now().toString();

    const saveTrainingItem = (fileUrl) => {
      const trainingData = {
        id: trainingId,
        title: trainingForm.title,
        description: trainingForm.description,
        assetType: trainingForm.assetType,
        sourceType: trainingForm.sourceType,
        fileUrl,
        allowDownload: trainingForm.allowDownload,
        allowPrint: trainingForm.allowPrint,
        allowShare: trainingForm.allowShare,
        followUpType: trainingForm.followUpType,
        followUpId: trainingForm.followUpId,
        questionsPerUser: trainingForm.questionsPerUser,
        timeLimit: trainingForm.timeLimit,
        passPercentage: trainingForm.passPercentage,
        certificateEnabled: trainingForm.certificateEnabled,
        certificateValidityValue: trainingForm.certificateValidityValue,
        certificateValidityUnit: trainingForm.certificateValidityUnit,
        accessMode: trainingForm.accessMode,
        reassignOnFail: trainingForm.reassignOnFail,
        rescheduleDays: trainingForm.rescheduleDays,
        selectedUsers: Array.isArray(trainingForm.selectedUsers) ? trainingForm.selectedUsers : [],
        type: 'training',
        createdAt: editingTraining ? editingTraining.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      };

      const normalizedTrainingData = normalizeTrainingItem(trainingData);
      let updatedTrainingItems;
      if (editingTraining) {
        updatedTrainingItems = trainingItems.map(item => item.id === trainingId ? normalizedTrainingData : item);
      } else {
        updatedTrainingItems = [...trainingItems, normalizedTrainingData];
      }

      localStorage.setItem('trainingItems', JSON.stringify(updatedTrainingItems));
      setTrainingItems(updatedTrainingItems);
      clearDraft('training', editingTraining ? editingTraining.id : 'new');
      resetTrainingForm();
      alert(`Training asset ${editingTraining ? 'updated' : 'created'} successfully!`);
    };

    if (trainingForm.sourceType === 'file') {
      if (trainingForm.file) {
        storeTrainingAssetToIndexedDB(trainingForm.file, trainingId)
          .then(() => saveTrainingItem(`indexeddb://${trainingId}`))
          .catch((error) => {
            alert('Unable to save asset. Please try again.');
          });
      } else if (editingTraining && editingTraining.fileUrl) {
        saveTrainingItem(editingTraining.fileUrl);
      } else {
        alert('Please select a file before saving.');
      }
    } else {
      if (!trainingForm.fileUrl) {
        alert('Please enter a file URL.');
        return;
      }
      saveTrainingItem(trainingForm.fileUrl);
    }
  };


  // Utility function to retrieve video from IndexedDB
  const getVideoFromIndexedDB = (videoId) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('VideoTrainingDB', 5);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['videos'], 'readonly');
        const store = transaction.objectStore('videos');
        
        const getRequest = store.get(videoId);
        getRequest.onsuccess = () => {
          const videoData = getRequest.result;
          if (videoData && videoData.file) {
            const blobUrl = URL.createObjectURL(videoData.file);
            resolve(blobUrl);
          } else {
            reject(new Error('Video not found in IndexedDB'));
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

  const deleteQuiz = (quizId) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      const updatedQuizzes = quizzes.filter(q => q.id !== quizId);
      localStorage.setItem('quizzes', JSON.stringify(updatedQuizzes));
      setQuizzes(updatedQuizzes);
    }
  };

  const deleteVideo = (videoId) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      const updatedVideos = videos.filter(v => v.id !== videoId);
      localStorage.setItem('videos', JSON.stringify(updatedVideos));
      setVideos(updatedVideos);
    }
  };

  const deleteTraining = (trainingId) => {
    if (window.confirm('Are you sure you want to delete this training item?')) {
      const updatedTrainingItems = trainingItems.filter(item => item.id !== trainingId);
      localStorage.setItem('trainingItems', JSON.stringify(updatedTrainingItems));
      setTrainingItems(updatedTrainingItems);
    }
  };

  const handleShareQuiz = (quiz) => {
    setShareTarget({ type: 'quiz', item: quiz });
    setShareSelectedUsers(quiz.selectedUsers || []);
    setShareSearchTerm('');
    setShowShareModal(true);
  };



  const handleShareVideo = (video) => {
    setShareTarget({ type: 'video', item: video });
    setShareSelectedUsers(video.selectedUsers || []);
    setShareSearchTerm('');
    setShowShareModal(true);
  };

  const handleViewVideoSheet = (video) => {
    setSelectedVideoView(video);
    setShowVideoView(true);
    setShowVideoForm(false);
  };

  const handleViewTraining = (item) => {
    setSelectedTrainingView(item);
    setShowTrainingView(true);
    setShowTrainingForm(false);
  };

  const handleShareTraining = (item) => {
    setShareTarget({ type: 'training', item });
    setShareSelectedUsers(item.selectedUsers || []);
    setShareSearchTerm('');
    setShowShareModal(true);
  };

  const handleShowUserDetails = (item, contentType) => {
    const quizResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
    const sharedUsers = (item.selectedUsers || []).map(userId => {
      const user = users.find(u => u.id === userId);
      return user || { id: userId, name: 'Unknown', email: '', department: '' };
    });

    let attemptedUsers = [];
    if (contentType === 'quiz') {
      const results = quizResults.filter(r => r.quizId === item.id);
      attemptedUsers = results.map(r => {
        const user = users.find(u => u.id === r.userId);
        const passThreshold = r.passPercentage || 70;
        return {
          id: r.userId,
          name: user?.name || 'Unknown',
          email: user?.email || '',
          department: user?.department || '',
          score: r.score || 0,
          correctAnswers: r.correctAnswers,
          totalQuestions: r.totalQuestions,
          passPercentage: passThreshold,
          passed: (r.score || 0) >= passThreshold,
          completedAt: r.completedAt || r.timestamp,
          timeTaken: r.timeTaken || 0
        };
      });
    } else if (contentType === 'video') {
      const results = quizResults.filter(r => r.quizId === item.id);
      attemptedUsers = results.map(r => {
        const user = users.find(u => u.id === r.userId);
        const passThreshold = r.passPercentage || 70;
        return {
          id: r.userId,
          name: user?.name || 'Unknown',
          email: user?.email || '',
          department: user?.department || '',
          score: r.score || 0,
          correctAnswers: r.correctAnswers,
          totalQuestions: r.totalQuestions,
          passPercentage: passThreshold,
          passed: (r.score || 0) >= passThreshold,
          completedAt: r.completedAt || r.timestamp,
          timeTaken: r.timeTaken || 0
        };
      });
    } else if (contentType === 'training') {
      const results = quizResults.filter(r => r.quizId === item.id || r.quizId === item.followUpId);
      attemptedUsers = results.map(r => {
        const user = users.find(u => u.id === r.userId);
        const passThreshold = r.passPercentage || 70;
        return {
          id: r.userId,
          name: user?.name || 'Unknown',
          email: user?.email || '',
          department: user?.department || '',
          score: r.score || 0,
          correctAnswers: r.correctAnswers,
          totalQuestions: r.totalQuestions,
          passPercentage: passThreshold,
          passed: (r.score || 0) >= passThreshold,
          completedAt: r.completedAt || r.timestamp,
          timeTaken: r.timeTaken || 0
        };
      });
    }

    setUserDetailsData({
      shared: sharedUsers,
      attempted: attemptedUsers,
      title: item.title
    });
    setShowUserDetailsModal(true);
  };

  const editTraining = (item) => {
    setEditingTraining(item);
    setTrainingForm({
      title: item.title,
      description: item.description,
      assetType: item.assetType,
      sourceType: item.sourceType,
      fileUrl: item.fileUrl || '',
      file: null,
      allowDownload: item.allowDownload || false,
      allowPrint: item.allowPrint || false,
      allowShare: item.allowShare || false,
      followUpType: item.followUpType || 'quiz',
      followUpId: item.followUpId || '',
      questionsPerUser: item.questionsPerUser || 15,
      timeLimit: item.timeLimit || 30,
      passPercentage: item.passPercentage || 70,
      certificateEnabled: item.certificateEnabled ?? true,
      certificateValidityValue: item.certificateValidityValue || 1,
      certificateValidityUnit: item.certificateValidityUnit || 'year',
      accessMode: item.accessMode || 'permanent',
      reassignOnFail: item.reassignOnFail ?? false,
      rescheduleDays: item.rescheduleDays || 7,
      selectedUsers: item.selectedUsers || []
    });
    setShowTrainingForm(true);
    setShowTrainingView(false);
    setSelectedTrainingView(null);
  };

  const updateShareSelection = (userId, checked) => {
    if (checked) {
      setShareSelectedUsers(prev => [...new Set([...prev, userId])]);
    } else {
      setShareSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const selectAllVisibleShareUsers = () => {
    const visibleIds = filteredShareUsers.map(user => user.id);
    setShareSelectedUsers(prev => [...new Set([...prev, ...visibleIds])]);
  };

  const clearShareSelection = () => {
    setShareSelectedUsers([]);
  };

  const confirmShareAssignment = () => {
    if (!shareTarget) return;
    if (shareSelectedUsers.length === 0) {
      alert('Please select at least one user to share with.');
      return;
    }

    if (shareTarget.type === 'quiz') {
      const updatedQuizzes = quizzes.map(q =>
        q.id === shareTarget.item.id ? { ...q, selectedUsers: shareSelectedUsers } : q
      );
      localStorage.setItem('quizzes', JSON.stringify(updatedQuizzes));
      setQuizzes(updatedQuizzes);
    }

    if (shareTarget.type === 'video') {
      const updatedVideos = videos.map(v =>
        v.id === shareTarget.item.id ? { ...v, selectedUsers: shareSelectedUsers } : v
      );
      localStorage.setItem('videos', JSON.stringify(updatedVideos));
      setVideos(updatedVideos);
    }

    if (shareTarget.type === 'training') {
      const updatedTrainingItems = trainingItems.map(item =>
        item.id === shareTarget.item.id ? { ...item, selectedUsers: shareSelectedUsers } : item
      );
      localStorage.setItem('trainingItems', JSON.stringify(updatedTrainingItems));
      setTrainingItems(updatedTrainingItems);
    }

    setShowShareModal(false);
    setShareTarget(null);
    setShareSelectedUsers([]);
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    setShareTarget(null);
    setShareSelectedUsers([]);
    setShareSearchTerm('');
  };

  const filteredShareUsers = users.filter((user) => {
    const query = shareSearchTerm.trim().toLowerCase();
    if (!query) return true;
    return (
      user.name?.toLowerCase().includes(query) ||
      String(user.email || '').toLowerCase().includes(query)
    );
  });

  const handleViewQuizSheet = (quiz) => {
    try {
      setSelectedQuizView(quiz);
      setShowQuizView(true);
      setShowQuizForm(false);
    } catch (error) {
      alert('Error opening quiz sheet. Please try again.');
    }
  };

  const editQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setQuizForm({
      title: quiz.title,
      description: quiz.description,
      questions: (quiz.questions || []).map(normalizeQuestion),
      questionsPerUser: quiz.questionsPerUser,
      timeLimit: quiz.timeLimit,
      passPercentage: quiz.passPercentage || 70,
      certificateEnabled: quiz.certificateEnabled ?? true,
      certificateValidityValue: quiz.certificateValidityValue || 1,
      certificateValidityUnit: quiz.certificateValidityUnit || 'year',
      accessMode: quiz.accessMode || 'permanent',
      reassignOnFail: quiz.reassignOnFail ?? false,
      rescheduleDays: quiz.rescheduleDays || 7,
      selectedUsers: quiz.selectedUsers || []
    });
    setShowQuizForm(true);
  };

  const editVideo = (video) => {
    setEditingVideo(video);
    
    // Handle IndexedDB videos
    if (video.videoUrl && video.videoUrl.startsWith('indexeddb://')) {
      const videoId = video.videoUrl.replace('indexeddb://', '');
      getVideoFromIndexedDB(videoId)
        .then(blobUrl => {
          setVideoForm({
            title: video.title,
            description: video.description,
            videoUrl: video.videoUrl,
            blobUrl: blobUrl,
            videoSourceType: 'file',
            videoFile: null,
            questions: (video.questions || []).map(normalizeQuestion),
            questionsPerUser: video.questionsPerUser,
            timeLimit: video.timeLimit,
            passPercentage: video.passPercentage || 70,
            certificateEnabled: video.certificateEnabled ?? true,
            certificateValidityValue: video.certificateValidityValue || 1,
            certificateValidityUnit: video.certificateValidityUnit || 'year',
            accessMode: video.accessMode || 'permanent',
            reassignOnFail: video.reassignOnFail ?? false,
            rescheduleDays: video.rescheduleDays || 7,
            selectedUsers: video.selectedUsers || []
          });
          setShowVideoForm(true);
        })
        .catch(error => {
          // Fallback to form without video preview
          setVideoForm({
            title: video.title,
            description: video.description,
            videoUrl: video.videoUrl,
            blobUrl: null,
            videoSourceType: 'file',
            videoFile: null,
            questions: (video.questions || []).map(normalizeQuestion),
            questionsPerUser: video.questionsPerUser,
            timeLimit: video.timeLimit,
            passPercentage: video.passPercentage || 70,
            certificateEnabled: video.certificateEnabled ?? true,
            certificateValidityValue: video.certificateValidityValue || 1,
            certificateValidityUnit: video.certificateValidityUnit || 'year',
            accessMode: video.accessMode || 'permanent',
            reassignOnFail: video.reassignOnFail ?? false,
            rescheduleDays: video.rescheduleDays || 7,
            selectedUsers: video.selectedUsers || []
          });
          setShowVideoForm(true);
        });
    } else {
      // Handle URL videos
      setVideoForm({
        title: video.title,
        description: video.description,
        videoUrl: video.videoUrl,
        blobUrl: video.blobUrl,
        videoSourceType: video.videoUrl && video.videoUrl.startsWith('blob:') ? 'file' : 'url',
        videoFile: null,
        questions: (video.questions || []).map(normalizeQuestion),
        questionsPerUser: video.questionsPerUser,
        timeLimit: video.timeLimit,
        passPercentage: video.passPercentage || 70,
        certificateEnabled: video.certificateEnabled ?? true,
        certificateValidityValue: video.certificateValidityValue || 1,
        certificateValidityUnit: video.certificateValidityUnit || 'year',
        accessMode: video.accessMode || 'permanent',
        reassignOnFail: video.reassignOnFail ?? false,
        rescheduleDays: video.rescheduleDays || 7,
        selectedUsers: video.selectedUsers || []
      });
      setShowVideoForm(true);
    }
  };

  // VideoPreview component to handle different video sources
  const VideoPreview = ({ videoUrl, blobUrl, videoSourceType }) => {
    const [videoSrc, setVideoSrc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      let timeoutId;
      
      if (videoSourceType === 'file' && videoUrl && videoUrl.startsWith('indexeddb://')) {
        // Retrieve video from IndexedDB with timeout
        const videoId = videoUrl.replace('indexeddb://', '');
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Video loading timeout'));
          }, 5000); // 5 second timeout for preview
        });
        
        Promise.race([getVideoFromIndexedDB(videoId), timeoutPromise])
          .then(blobUrl => {
            clearTimeout(timeoutId);
            setVideoSrc(blobUrl);
            setLoading(false);
          })
          .catch(error => {
            clearTimeout(timeoutId);
            setError('Failed to load video');
            setLoading(false);
          });
      } else {
        // Use blobUrl or direct videoUrl
        setVideoSrc(blobUrl || videoUrl);
        setLoading(false);
      }
      
      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }, [videoUrl, blobUrl, videoSourceType]);

    if (loading) {
      return (
        <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center">
          <div className="text-sm text-gray-500">Loading video...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="w-full h-32 bg-red-50 rounded flex items-center justify-center">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      );
    }

    return (
      <video
        className="w-full h-32 object-contain bg-black rounded"
        controls
        src={videoSrc}
      >
        Your browser does not support the video tag.
      </video>
    );
  };

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar currentUser={currentUser} />
      
      <div className="md:ml-64">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors duration-200">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Learning & Training</h1>
                  <p className="text-sm text-slate-500">Manage quizzes and video training content</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 mb-8">
          <div className="border-b border-slate-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('quiz')}
                className={`py-4 px-8 border-b-2 font-semibold text-sm transition-all duration-200 ${
                  activeTab === 'quiz'
                    ? 'border-purple-500 text-purple-600 bg-purple-50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Quiz Management
              </button>
              <button
                onClick={() => setActiveTab('video')}
                className={`py-4 px-8 border-b-2 font-semibold text-sm transition-all duration-200 ${
                  activeTab === 'video'
                    ? 'border-purple-500 text-purple-600 bg-purple-50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Video className="w-4 h-4 inline mr-2" />
                Video Training
              </button>
              <button
                onClick={() => setActiveTab('training')}
                className={`py-4 px-8 border-b-2 font-semibold text-sm transition-all duration-200 ${
                  activeTab === 'training'
                    ? 'border-purple-500 text-purple-600 bg-purple-50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-4 h-4 inline mr-2" />
                Training Documents & Videos
              </button>
            </nav>
          </div>
        </div>

        {/* Quiz Tab */}
        {activeTab === 'quiz' && (
          <>
            {showQuizView ? (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuizView(false);
                        setSelectedQuizView(null);
                      }}
                      className="inline-flex items-center px-4 py-2 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition duration-200"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </button>
                    <div className="mt-3 text-sm text-gray-500">
                      <span className="font-medium text-slate-600">Quiz Management</span>
                      <span className="mx-2">/</span>
                      <span>View</span>
                    </div>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedQuizView?.title}</h2>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-xl p-5">
                    <p className="text-sm text-slate-600"><strong>Description:</strong> {selectedQuizView?.description || 'No description'}</p>
                    <p className="text-sm text-slate-600"><strong>Questions:</strong> {selectedQuizView?.questions.length}</p>
                    <p className="text-sm text-slate-600"><strong>Time Limit:</strong> {selectedQuizView?.timeLimit} minutes</p>
                    <p className="text-sm text-slate-600"><strong>Per User:</strong> {selectedQuizView?.questionsPerUser} per user</p>
                  </div>
                  {selectedQuizView?.questions.map((q, index) => (
                    <div key={q.id || index} className="border border-gray-200 rounded-xl p-5 bg-slate-50">
                      <h3 className="font-semibold text-slate-900 mb-3">
                        Question {index + 1}
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {q.type === 'truefalse' ? 'True/False' : q.type === 'fillblank' ? 'Fill Blank' : q.type === 'nps' ? 'NPS Scale' : 'MCQ'}
                        </span>
                      </h3>
                      <p className="text-sm text-slate-700 mb-3">{q.question}</p>
                      {q.type === 'fillblank' ? (
                        <div className="rounded-lg p-3 bg-emerald-100 border border-emerald-200">
                          <span className="text-sm font-semibold text-slate-900">Correct Answer: </span>
                          <span className="text-sm text-slate-700">{q.correctText}</span>
                        </div>
                      ) : q.type === 'nps' ? (
                        <div className="rounded-lg p-3 bg-white border border-slate-200">
                          <span className="text-sm font-semibold text-slate-900">Scale: {q.npsMin || 0} - {q.npsMax || 10}</span>
                          {q.correctAnswer !== '' && q.correctAnswer !== undefined && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-200 text-emerald-800">Correct: {q.correctAnswer}</span>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {q.options.map((option, optIndex) => (
                            <div key={optIndex} className={`rounded-lg p-3 ${optIndex === q.correctAnswer ? 'bg-emerald-100 border border-emerald-200' : 'bg-white border border-slate-200'}`}>
                              <span className="text-sm font-semibold text-slate-900">Option {optIndex + 1}</span>
                              <span className="text-sm text-slate-700 ml-2">{option}</span>
                              {optIndex === q.correctAnswer && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-200 text-emerald-800">Correct</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : !showQuizForm ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Quiz Library ({quizzes.length})
                  </h2>
                  <button
                    onClick={() => setShowQuizForm(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Quiz
                  </button>
                </div>

                {quizzes.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No quizzes created yet</p>
                    <p className="text-sm text-gray-500 mt-2">Create your first quiz to get started</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    {/* Mobile: Card layout */}
                    <div className="md:hidden divide-y divide-gray-200">
                      {quizzes.map((quiz) => {
                        const quizResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
                        const attempted = new Set(quizResults.filter(r => r.quizId === quiz.id).map(r => r.userId)).size;
                        return (
                        <div
                          key={quiz.id}
                          className="p-4 active:bg-gray-50"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{quiz.title}</p>
                              {quiz.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{quiz.description}</p>}
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 flex-shrink-0 ml-2">
                              <BookOpen className="w-3 h-3" /> Quiz
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{quiz.questions.length} Qs</span>
                              <span>{quiz.questionsPerUser}/user</span>
                              <span>{quiz.timeLimit} min</span>
                              <span>Pass {quiz.passPercentage}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">{(quiz.selectedUsers || []).length} shared</span>
                              <span className="text-xs text-gray-500">{attempted} attempted</span>
                              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                                quiz.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {quiz.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-3">
                            <button
                              onClick={() => handleShareQuiz(quiz)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Share Quiz"
                            >
                              <Share className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleViewQuizSheet(quiz)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Quiz Sheet"
                            >
                              <FileSpreadsheet className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => editQuiz(quiz)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit Quiz"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteQuiz(quiz.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Quiz"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                      )}
                    </div>

                    {/* Desktop: Table layout */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Title</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Questions</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Time</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Pass %</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Shared</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Attempted</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {quizzes.map((quiz) => {
                            const quizResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
                            const attempted = new Set(quizResults.filter(r => r.quizId === quiz.id).map(r => r.userId)).size;
                            return (
                            <tr key={quiz.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="font-medium text-gray-900">{quiz.title}</div>
                                {quiz.description && <div className="text-xs text-gray-500 mt-1 line-clamp-1">{quiz.description}</div>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                                  <BookOpen className="w-3 h-3" /> Quiz
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                {quiz.questions.length} total / {quiz.questionsPerUser} per user
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600">{quiz.timeLimit} min</td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600">{quiz.passPercentage}%</td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                {(quiz.selectedUsers || []).length} shared
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                {attempted} attempted
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  quiz.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {quiz.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => handleShareQuiz(quiz)}
                                    className="text-purple-600 hover:text-purple-900"
                                    title="Share Quiz"
                                  >
                                    <Share className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleShowUserDetails(quiz, 'quiz')}
                                    className="text-green-600 hover:text-green-900"
                                    title="View Shared & Attempted Users"
                                  >
                                    <Users className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleViewQuizSheet(quiz)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="View Quiz Sheet"
                                  >
                                    <FileSpreadsheet className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => editQuiz(quiz)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Edit Quiz"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteQuiz(quiz.id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Delete Quiz"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Quiz Form */
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}
                  </h2>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="flex items-center px-3 py-1.5 text-sm bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition duration-200"
                  >
                    <Save className="w-4 h-4 mr-1.5" />
                    Save as Draft
                  </button>
                </div>

                <form onSubmit={handleQuizSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quiz Title
                      </label>
                      <input
                        type="text"
                        value={quizForm.title}
                        onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={quizForm.description}
                        onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Questions Per User
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={quizForm.questionsPerUser}
                        onChange={(e) => setQuizForm({ ...quizForm, questionsPerUser: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time Limit (minutes)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="180"
                        value={quizForm.timeLimit}
                        onChange={(e) => setQuizForm({ ...quizForm, timeLimit: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pass Percentage (%)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={quizForm.passPercentage}
                        onChange={(e) => setQuizForm({ ...quizForm, passPercentage: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="allowSkipQuestions"
                        checked={quizForm.allowSkipQuestions}
                        onChange={(e) => setQuizForm({ ...quizForm, allowSkipQuestions: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="allowSkipQuestions" className="ml-2 block text-sm text-gray-700">
                        Allow Skip Questions
                      </label>
                    </div>
                  </div>

                  {/* Certificate Configuration */}
                  <div className="border-t pt-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Certificate Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Issue Certificate
                        </label>
                        <select
                          value={quizForm.certificateEnabled ? 'yes' : 'no'}
                          onChange={(e) => setQuizForm({ ...quizForm, certificateEnabled: e.target.value === 'yes' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Validity Period
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={quizForm.certificateValidityValue}
                          onChange={(e) => setQuizForm({ ...quizForm, certificateValidityValue: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={!quizForm.certificateEnabled}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Validity Unit
                        </label>
                        <select
                          value={quizForm.certificateValidityUnit}
                          onChange={(e) => setQuizForm({ ...quizForm, certificateValidityUnit: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={!quizForm.certificateEnabled}
                        >
                          <option value="days">Days</option>
                          <option value="months">Months</option>
                          <option value="years">Years</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Access Mode Configuration */}
                  <div className="border-t pt-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Access Mode</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          User Access Type
                        </label>
                        <select
                          value={quizForm.accessMode}
                          onChange={(e) => setQuizForm({ ...quizForm, accessMode: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="permanent">Permanent - Always Available</option>
                          <option value="one-time">One-Time - Single Attempt Only</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          {quizForm.accessMode === 'one-time' 
                            ? 'Users can only take this quiz once.' 
                            : 'Users can access this quiz multiple times.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Reassignment Configuration */}
                  <div className="border-t pt-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Reassignment on Failure</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Re-assign on Fail
                        </label>
                        <select
                          value={quizForm.reassignOnFail ? 'yes' : 'no'}
                          onChange={(e) => setQuizForm({ ...quizForm, reassignOnFail: e.target.value === 'yes' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="no">No - Keep quiz available</option>
                          <option value="yes">Yes - Reassign training after fail</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          {quizForm.reassignOnFail 
                            ? 'User must re-complete training before retest.' 
                            : 'User can retake quiz immediately.'}
                        </p>
                      </div>

                      {quizForm.reassignOnFail && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reschedule After (Days)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="365"
                            value={quizForm.rescheduleDays}
                            onChange={(e) => setQuizForm({ ...quizForm, rescheduleDays: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Days to wait before user can retake quiz.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Question Builder */}
                  <div className="border-t pt-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Add Questions</h3>
                    
                    <div className="space-y-4 mb-6">
                      {/* Question Type Selector */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Question Type
                        </label>
                        <select
                          value={currentQuestion.type}
                          onChange={(e) => {
                            const type = e.target.value;
                            setCurrentQuestion(createDefaultQuestion(type));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="mcq">Multiple Choice</option>
                          <option value="truefalse">True / False</option>
                          <option value="fillblank">Fill in the Blank</option>
                          <option value="nps">NPS / Linear Scale</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Question
                        </label>
                        <textarea
                          value={currentQuestion.question}
                          onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="2"
                          placeholder="Enter your question here..."
                        />
                      </div>

                      {/* Question Translations */}
                      <div className="border rounded-lg p-3 md:p-4 bg-gray-50">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Question Translations (optional)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {SUPPORTED_LANGUAGES.map(({ code, label }) => (
                            <div key={code}>
                              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                              <input
                                type="text"
                                value={currentQuestion.questionTranslations?.[code] || ''}
                                onChange={(e) => {
                                  const newTranslations = { ...(currentQuestion.questionTranslations || {}) };
                                  newTranslations[code] = e.target.value;
                                  setCurrentQuestion({ ...currentQuestion, questionTranslations: newTranslations });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder={`Question in ${label}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Multiple Choice Options */}
                      {(currentQuestion.type === 'mcq' || currentQuestion.type === 'truefalse') && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentQuestion.options.map((option, index) => (
                              <div key={index}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Option {index + 1}
                                </label>
                                <input
                                  type="text"
                                  value={option}
                                  disabled={currentQuestion.type === 'truefalse'}
                                  onChange={(e) => {
                                    const newOptions = [...currentQuestion.options];
                                    newOptions[index] = e.target.value;
                                    setCurrentQuestion({ ...currentQuestion, options: newOptions });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                  placeholder={`Option ${index + 1}`}
                                />
                              </div>
                            ))}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Correct Answer
                            </label>
                            <select
                              value={currentQuestion.correctAnswer}
                              onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {currentQuestion.options.map((option, index) => (
                                <option key={index} value={index}>
                                  {option || `Option ${index + 1}`}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Option Translations */}
                          <div className="border rounded-lg p-3 md:p-4 bg-gray-50 mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Option Translations (optional)</h4>
                            {currentQuestion.options.map((option, index) => (
                              <div key={index} className="mb-3 last:mb-0">
                                <p className="text-xs text-gray-600 mb-1">Option {index + 1}: {option || `Option ${index + 1}`}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {SUPPORTED_LANGUAGES.map(({ code, label }) => (
                                    <input
                                      key={code}
                                      type="text"
                                      value={currentQuestion.optionTranslations?.[index]?.[code] || ''}
                                      onChange={(e) => {
                                        const newOptionTranslations = [...(currentQuestion.optionTranslations || [])];
                                        if (!newOptionTranslations[index]) newOptionTranslations[index] = {};
                                        newOptionTranslations[index] = { ...newOptionTranslations[index], [code]: e.target.value };
                                        setCurrentQuestion({ ...currentQuestion, optionTranslations: newOptionTranslations });
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                      placeholder={`Option ${index + 1} in ${label}`}
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {/* Fill in the Blank */}
                      {currentQuestion.type === 'fillblank' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Correct Answer
                          </label>
                          <input
                            type="text"
                            value={currentQuestion.correctText}
                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctText: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter the correct answer"
                          />
                          <div className="mt-2 flex items-center">
                            <input
                              type="checkbox"
                              id="caseSensitive"
                              checked={currentQuestion.caseSensitive}
                              onChange={(e) => setCurrentQuestion({ ...currentQuestion, caseSensitive: e.target.checked })}
                              className="mr-2"
                            />
                            <label htmlFor="caseSensitive" className="text-sm text-gray-700">
                              Case-sensitive matching
                            </label>
                          </div>
                        </div>
                      )}

                      {/* NPS / Linear Scale */}
                      {currentQuestion.type === 'nps' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Min Value
                            </label>
                            <input
                              type="number"
                              value={currentQuestion.npsMin}
                              onChange={(e) => setCurrentQuestion({ ...currentQuestion, npsMin: parseInt(e.target.value) || 0 })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min="0"
                              max="10"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Max Value
                            </label>
                            <input
                              type="number"
                              value={currentQuestion.npsMax}
                              onChange={(e) => setCurrentQuestion({ ...currentQuestion, npsMax: parseInt(e.target.value) || 10 })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min="1"
                              max="10"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Correct Answer (optional)
                            </label>
                            <input
                              type="number"
                              value={currentQuestion.correctAnswer || ''}
                              onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value ? parseInt(e.target.value) : '' })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Leave blank for no correct answer"
                              min={currentQuestion.npsMin}
                              max={currentQuestion.npsMax}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Leave blank if this is a survey-style question with no right answer.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Randomize Options */}
                      {(currentQuestion.type === 'mcq' || currentQuestion.type === 'truefalse') && (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="randomizeOptions"
                            checked={currentQuestion.randomizeOptions}
                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, randomizeOptions: e.target.checked })}
                            className="mr-2"
                          />
                          <label htmlFor="randomizeOptions" className="text-sm text-gray-700">
                            Randomize answer options for each user
                          </label>
                        </div>
                      )}

                      {/* Branching Logic */}
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">Branching Logic (Skip Logic)</h4>
                        </div>
                        {currentQuestion.branchRules.length === 0 && (
                          <p className="text-xs text-gray-500 mb-2">
                            Skip to a later question based on the answer.
                          </p>
                        )}
                        {currentQuestion.branchRules.map((rule, index) => (
                          <div key={index} className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-700">If answer</span>
                            <select
                              value={rule.condition}
                              onChange={(e) => {
                                const newRules = [...currentQuestion.branchRules];
                                newRules[index].condition = e.target.value;
                                setCurrentQuestion({ ...currentQuestion, branchRules: newRules });
                              }}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="equals">equals</option>
                              <option value="notEquals">not equals</option>
                              <option value="greaterThan">greater than</option>
                              <option value="lessThan">less than</option>
                            </select>
                            <input
                              type="text"
                              value={rule.value}
                              onChange={(e) => {
                                const newRules = [...currentQuestion.branchRules];
                                newRules[index].value = e.target.value;
                                setCurrentQuestion({ ...currentQuestion, branchRules: newRules });
                              }}
                              className="px-2 py-1 border border-gray-300 rounded text-sm w-24"
                              placeholder="value"
                            />
                            <span className="text-sm text-gray-700">skip to</span>
                            <select
                              value={rule.targetQuestionId}
                              onChange={(e) => {
                                const newRules = [...currentQuestion.branchRules];
                                newRules[index].targetQuestionId = e.target.value;
                                setCurrentQuestion({ ...currentQuestion, branchRules: newRules });
                              }}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="">Next question</option>
                              {(activeTab === 'quiz' ? quizForm.questions : videoForm.questions).map((q) => (
                                <option key={q.id} value={q.id}>
                                  {q.question.substring(0, 40)}...
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                const newRules = currentQuestion.branchRules.filter((_, i) => i !== index);
                                setCurrentQuestion({ ...currentQuestion, branchRules: newRules });
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentQuestion({
                              ...currentQuestion,
                              branchRules: [
                                ...currentQuestion.branchRules,
                                { condition: 'equals', value: '', targetQuestionId: '' }
                              ]
                            });
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800 mt-2"
                        >
                          + Add Branch Rule
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={addQuestion}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
                      >
                        Add Question
                      </button>
                    </div>

                    {/* Questions List */}
                    {quizForm.questions.length > 0 && (
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">
                          Questions Added ({quizForm.questions.length})
                        </h4>
                        <div className="space-y-2">
                          {quizForm.questions.map((q, index) => (
                            <div key={q.id || index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  Q{index + 1}: {q.question}
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {q.type === 'truefalse' ? 'True/False' : q.type === 'fillblank' ? 'Fill Blank' : q.type === 'nps' ? 'NPS Scale' : 'MCQ'}
                                  </span>
                                </p>
                                <p className="text-xs text-gray-600">
                                  {q.type === 'fillblank'
                                    ? `Correct: "${q.correctText}"`
                                    : q.type === 'nps'
                                    ? `Scale ${q.npsMin || 0}-${q.npsMax || 10}${q.correctAnswer !== '' && q.correctAnswer !== undefined ? ` (Correct: ${q.correctAnswer})` : ''}`
                                    : `Correct: ${q.options?.[q.correctAnswer] || `Option ${q.correctAnswer + 1}`}`}
                                </p>
                                {q.randomizeOptions && <p className="text-xs text-blue-600">Randomize enabled</p>}
                                {q.branchRules?.length > 0 && <p className="text-xs text-purple-600">{q.branchRules.length} branch rule(s)</p>}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeQuestion(index)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bulk Import Section */}
                    <div className="border-t pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-md font-semibold text-gray-900">Bulk Import Questions</h3>
                        <button
                          type="button"
                          onClick={() => setShowQuizBulkUpload(!showQuizBulkUpload)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {showQuizBulkUpload ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      
                      {showQuizBulkUpload && (
                        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                          {/* Instructions */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <h4 className="font-semibold text-blue-900 mb-2 text-sm">Instructions</h4>
                            <div className="space-y-1 text-xs text-blue-800">
                              <p>• Upload questions in CSV or JSON format.</p>
                              <p>• Supported types: mcq, truefalse, fillblank, nps.</p>
                              <p>• CSV (typed): type, question, options (pipe-separated), correctAnswer, correctText, caseSensitive, npsMin, npsMax</p>
                              <p>• Legacy CSV still works: Question, Option1, Option2, Option3, Option4, Correct Answer (1-4)</p>
                              <p>• JSON: array of objects with type, question, and type-specific fields (options, correctAnswer, correctText, npsMin, npsMax, etc.)</p>
                            </div>
                          </div>

                          {/* Template Downloads */}
                          <div className="flex space-x-3">
                            <button
                              type="button"
                              onClick={downloadSampleCSV}
                              className="flex items-center px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition duration-200 text-sm"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              CSV Template
                            </button>
                            <button
                              type="button"
                              onClick={downloadSampleJSON}
                              className="flex items-center px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition duration-200 text-sm"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              JSON Template
                            </button>
                          </div>

                          {/* File Upload */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Upload File (CSV or JSON)
                            </label>
                            <input
                              type="file"
                              accept=".csv,.json"
                              onChange={handleFileUpload}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            {uploadedFile && (
                              <p className="mt-2 text-sm text-gray-600">
                                Selected: {uploadedFile.name}
                              </p>
                            )}
                          </div>

                          {/* Errors */}
                          {uploadErrors.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <h4 className="font-semibold text-red-900 mb-2 text-sm flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Validation Errors
                              </h4>
                              <ul className="space-y-1 text-xs text-red-800">
                                {uploadErrors.map((error, index) => (
                                  <li key={index}>• {error}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Preview */}
                          {previewData.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                                Preview ({previewData.length} questions)
                              </h4>
                              <div className="border rounded-lg overflow-hidden">
                                <div className="bg-gray-100 px-3 py-2 border-b">
                                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-700">
                                    <div className="col-span-2">Type</div>
                                    <div className="col-span-5">Question</div>
                                    <div className="col-span-3">Options / Scale / Answer</div>
                                    <div className="col-span-2">Correct</div>
                                  </div>
                                </div>
                                <div className="max-h-40 overflow-y-auto">
                                  {previewData.slice(0, 5).map((question, index) => {
                                    const qType = question.type || 'mcq';
                                    const isOptionType = qType === 'mcq' || qType === 'truefalse';
                                    const optionSummary = isOptionType
                                      ? (question.options || []).join(' | ')
                                      : qType === 'fillblank'
                                      ? `Fill: ${question.correctText || '-'}${question.caseSensitive ? ' (case-sensitive)' : ''}`
                                      : qType === 'nps'
                                      ? `Scale ${question.npsMin ?? 0}-${question.npsMax ?? 10}`
                                      : '-';
                                    const correctText = isOptionType
                                      ? `Opt ${(question.correctAnswer ?? 0) + 1}`
                                      : qType === 'fillblank'
                                      ? (question.correctText || 'Any')
                                      : qType === 'nps' && question.correctAnswer !== null && question.correctAnswer !== undefined
                                      ? question.correctAnswer
                                      : 'Any';
                                    return (
                                      <div key={index} className="px-3 py-2 border-b hover:bg-gray-100">
                                        <div className="grid grid-cols-12 gap-2 text-xs">
                                          <div className="col-span-2 truncate capitalize">{qType}</div>
                                          <div className="col-span-5 truncate" title={question.question}>
                                            {question.question}
                                          </div>
                                          <div className="col-span-3 truncate" title={optionSummary}>
                                            {optionSummary}
                                          </div>
                                          <div className="col-span-2 text-center truncate">
                                            {correctText}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {previewData.length > 5 && (
                                    <div className="px-3 py-2 text-center text-xs text-gray-600">
                                      ... and {previewData.length - 5} more questions
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowQuizBulkUpload(false);
                                setUploadedFile(null);
                                setPreviewData([]);
                                setUploadErrors([]);
                              }}
                              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200 text-sm"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={confirmBulkUpload}
                              disabled={previewData.length === 0 || uploadErrors.length > 0}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                            >
                              Add {previewData.length} Questions
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User Selection */}
                  <div className="border-t pt-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Assign to Users</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {users.map((user) => (
                        <label key={user.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={quizForm.selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setQuizForm({
                                  ...quizForm,
                                  selectedUsers: [...quizForm.selectedUsers, user.id]
                                });
                              } else {
                                setQuizForm({
                                  ...quizForm,
                                  selectedUsers: quizForm.selectedUsers.filter(id => id !== user.id)
                                });
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{user.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={resetQuizForm}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                    >
                      <Save className="w-4 h-4 inline mr-2" />
                      {editingQuiz ? 'Update Quiz' : 'Save Quiz'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}

        {/* Video Tab */}
        {activeTab === 'video' && (
          <>
            {showVideoView ? (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowVideoView(false);
                        setSelectedVideoView(null);
                      }}
                      className="inline-flex items-center px-4 py-2 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition duration-200"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </button>
                    <div className="mt-3 text-sm text-gray-500">
                      <span className="font-medium text-slate-600">Video Training</span>
                      <span className="mx-2">/</span>
                      <span>View</span>
                    </div>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedVideoView?.title}</h2>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-xl p-5">
                    <p className="text-sm text-slate-600"><strong>Description:</strong> {selectedVideoView?.description || 'No description'}</p>
                    <p className="text-sm text-slate-600"><strong>Questions:</strong> {selectedVideoView?.questions.length}</p>
                    <p className="text-sm text-slate-600"><strong>Time Limit:</strong> {selectedVideoView?.timeLimit} minutes</p>
                    <p className="text-sm text-slate-600"><strong>Pass Percentage:</strong> {selectedVideoView?.passPercentage}%</p>
                    <p className="text-sm text-slate-600"><strong>Assigned Users:</strong> {(selectedVideoView?.selectedUsers || []).length}</p>
                  </div>

                  {selectedVideoView?.questions.map((q, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-5 bg-slate-50">
                      <h3 className="font-semibold text-slate-900 mb-3">Question {index + 1}</h3>
                      <p className="text-sm text-slate-700 mb-3">{q.question}</p>
                      <div className="space-y-2">
                        {q.options.map((option, optIndex) => (
                          <div key={optIndex} className={`rounded-lg p-3 ${optIndex === q.correctAnswer ? 'bg-emerald-100 border border-emerald-200' : 'bg-white border border-slate-200'}`}>
                            <span className="text-sm font-semibold text-slate-900">Option {optIndex + 1} </span>
                            <span className="text-sm text-slate-700">{option}</span>
                            {optIndex === q.correctAnswer && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-200 text-emerald-800">Correct</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : !showVideoForm ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Video Library ({videos.length})
                  </h2>
                  <button
                    onClick={() => setShowVideoForm(true)}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Video
                  </button>
                </div>

                {videos.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No videos added yet</p>
                    <p className="text-sm text-gray-500 mt-2">Add your first training video to get started</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    {/* Mobile: Card layout */}
                    <div className="md:hidden divide-y divide-gray-200">
                      {videos.map((video) => {
                        const quizResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
                        const attempted = new Set(quizResults.filter(r => r.quizId === video.id).map(r => r.userId)).size;
                        return (
                        <div
                          key={video.id}
                          className="p-4 active:bg-gray-50"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{video.title}</p>
                              {video.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{video.description}</p>}
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700 flex-shrink-0 ml-2">
                              <Video className="w-3 h-3" /> Video
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{video.questions.length} Qs</span>
                              <span>{video.questionsPerUser}/user</span>
                              <span>{video.timeLimit} min</span>
                              <span>Pass {video.passPercentage}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">{(video.selectedUsers || []).length} shared</span>
                              <span className="text-xs text-gray-500">{attempted} attempted</span>
                              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                                video.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {video.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-3">
                            <button
                              onClick={() => handleViewVideoSheet(video)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Video Form"
                            >
                              <FileSpreadsheet className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleShareVideo(video)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Share Video"
                            >
                              <Share className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => editVideo(video)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit Video"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteVideo(video.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Video"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                      )}
                    </div>

                    {/* Desktop: Table layout */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Title</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Questions</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Time</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Pass %</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Shared</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Attempted</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {videos.map((video) => {
                            const quizResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
                            const attempted = new Set(quizResults.filter(r => r.quizId === video.id).map(r => r.userId)).size;
                            return (
                            <tr key={video.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="font-medium text-gray-900">{video.title}</div>
                                {video.description && <div className="text-xs text-gray-500 mt-1 line-clamp-1">{video.description}</div>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                                  <Video className="w-3 h-3" /> Video
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                {video.questions.length} total / {video.questionsPerUser} per user
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600">{video.timeLimit} min</td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600">{video.passPercentage}%</td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                {(video.selectedUsers || []).length} shared
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                {attempted} attempted
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  video.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {video.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => handleViewVideoSheet(video)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="View Video Form"
                                  >
                                    <FileSpreadsheet className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleShareVideo(video)}
                                    className="text-purple-600 hover:text-purple-900"
                                    title="Share Video"
                                  >
                                    <Share className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleShowUserDetails(video, 'video')}
                                    className="text-green-600 hover:text-green-900"
                                    title="View Shared & Attempted Users"
                                  >
                                    <Users className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => editVideo(video)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Edit Video"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteVideo(video.id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Delete Video"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Video Form */
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {editingVideo ? 'Edit Video' : 'Add New Video'}
                  </h2>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="flex items-center px-3 py-1.5 text-sm bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition duration-200"
                  >
                    <Save className="w-4 h-4 mr-1.5" />
                    Save as Draft
                  </button>
                </div>

                <form onSubmit={handleVideoSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Video Title
                      </label>
                      <input
                        type="text"
                        value={videoForm.title}
                        onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={videoForm.description}
                        onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Video Source
                      </label>
                      <div className="space-y-3">
                        {/* Radio buttons for source selection */}
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="videoSource"
                              value="url"
                              checked={videoForm.videoSourceType === 'url'}
                              onChange={() => setVideoForm({ ...videoForm, videoSourceType: 'url', videoFile: null })}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">URL</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="videoSource"
                              value="file"
                              checked={videoForm.videoSourceType === 'file'}
                              onChange={() => setVideoForm({ ...videoForm, videoSourceType: 'file', videoUrl: '' })}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">Upload File</span>
                          </label>
                        </div>

                        {/* URL Input */}
                        {videoForm.videoSourceType === 'url' && (
                          <div>
                            <input
                              type="url"
                              value={videoForm.videoUrl}
                              onChange={handleVideoUrlChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="https://example.com/video.mp4"
                              required
                            />
                          </div>
                        )}

                        {/* File Upload */}
                        {videoForm.videoSourceType === 'file' && (
                          <div>
                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo"
                              onChange={handleVideoFileUpload}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                            {videoForm.videoFile && (
                              <div className="mt-2 space-y-2">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                  <div className="flex items-center space-x-2">
                                    <Video className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm text-gray-700 truncate">
                                      {videoForm.videoFile.name}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {(videoForm.videoFile.size / (1024 * 1024)).toFixed(2)} MB
                                  </span>
                                </div>

                                {/* Upload Progress */}
                                {videoUploadProgress > 0 && videoUploadProgress < 100 && (
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-gray-600">
                                      <span>Uploading...</span>
                                      <span>{videoUploadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${videoUploadProgress}%` }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {videoUploadProgress === 100 && (
                                  <div className="flex items-center space-x-2 text-green-600 text-sm">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Video uploaded successfully</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Show existing video preview when editing */}
                            {editingVideo && !videoForm.videoFile && (videoForm.blobUrl || videoForm.videoUrl) && (
                              <div className="mt-2">
                                <div className="p-3 bg-blue-50 rounded">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Video className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-900">Current Video</span>
                                  </div>
                                  <VideoPreview 
                                    videoUrl={videoForm.videoUrl}
                                    blobUrl={videoForm.blobUrl}
                                    videoSourceType={videoForm.videoSourceType}
                                  />
                                  <p className="text-xs text-blue-700 mt-1">
                                    {videoForm.videoSourceType === 'file' ? 'Stored file' : 'URL source'}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Questions Per User
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={videoForm.questionsPerUser}
                        onChange={(e) => setVideoForm({ ...videoForm, questionsPerUser: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time Limit (minutes)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="180"
                        value={videoForm.timeLimit}
                        onChange={(e) => setVideoForm({ ...videoForm, timeLimit: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pass Percentage (%)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={videoForm.passPercentage}
                        onChange={(e) => setVideoForm({ ...videoForm, passPercentage: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="allowSkipQuestionsVideo"
                        checked={videoForm.allowSkipQuestions}
                        onChange={(e) => setVideoForm({ ...videoForm, allowSkipQuestions: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="allowSkipQuestionsVideo" className="ml-2 block text-sm text-gray-700">
                        Allow Skip Questions
                      </label>
                    </div>
                  </div>

                  {/* Certificate Configuration */}
                  <div className="border-t pt-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Certificate Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Issue Certificate
                        </label>
                        <select
                          value={videoForm.certificateEnabled ? 'yes' : 'no'}
                          onChange={(e) => setVideoForm({ ...videoForm, certificateEnabled: e.target.value === 'yes' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Validity Period
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={videoForm.certificateValidityValue}
                          onChange={(e) => setVideoForm({ ...videoForm, certificateValidityValue: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={!videoForm.certificateEnabled}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Validity Unit
                        </label>
                        <select
                          value={videoForm.certificateValidityUnit}
                          onChange={(e) => setVideoForm({ ...videoForm, certificateValidityUnit: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={!videoForm.certificateEnabled}
                        >
                          <option value="days">Days</option>
                          <option value="months">Months</option>
                          <option value="years">Years</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Access Mode Configuration */}
                  <div className="border-t pt-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Access Mode</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          User Access Type
                        </label>
                        <select
                          value={videoForm.accessMode}
                          onChange={(e) => setVideoForm({ ...videoForm, accessMode: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="permanent">Permanent - Always Available</option>
                          <option value="one-time">One-Time - Single Attempt Only</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          {videoForm.accessMode === 'one-time' 
                            ? 'Users can only watch and quiz once.' 
                            : 'Users can access this video multiple times.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Reassignment Configuration */}
                  <div className="border-t pt-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Reassignment on Failure</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Re-assign on Fail
                        </label>
                        <select
                          value={videoForm.reassignOnFail ? 'yes' : 'no'}
                          onChange={(e) => setVideoForm({ ...videoForm, reassignOnFail: e.target.value === 'yes' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="no">No - Keep video available</option>
                          <option value="yes">Yes - Reassign after fail</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          {videoForm.reassignOnFail 
                            ? 'User must re-watch video before retest.' 
                            : 'User can retake quiz immediately.'}
                        </p>
                      </div>

                      {videoForm.reassignOnFail && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reschedule After (Days)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="365"
                            value={videoForm.rescheduleDays}
                            onChange={(e) => setVideoForm({ ...videoForm, rescheduleDays: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Days to wait before user can retake quiz.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Question Builder for Video */}
                  <div className="border-t pt-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Add Post-Video Questions</h3>
                    
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Question
                        </label>
                        <textarea
                          value={currentQuestion.question}
                          onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="2"
                          placeholder="Enter your question here..."
                        />
                      </div>

                      {/* Question Translations */}
                      <div className="border rounded-lg p-3 md:p-4 bg-gray-50">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Question Translations (optional)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {SUPPORTED_LANGUAGES.map(({ code, label }) => (
                            <div key={code}>
                              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                              <input
                                type="text"
                                value={currentQuestion.questionTranslations?.[code] || ''}
                                onChange={(e) => {
                                  const newTranslations = { ...(currentQuestion.questionTranslations || {}) };
                                  newTranslations[code] = e.target.value;
                                  setCurrentQuestion({ ...currentQuestion, questionTranslations: newTranslations });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder={`Question in ${label}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQuestion.options.map((option, index) => (
                          <div key={index}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Option {index + 1}
                            </label>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...currentQuestion.options];
                                newOptions[index] = e.target.value;
                                setCurrentQuestion({ ...currentQuestion, options: newOptions });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={`Option ${index + 1}`}
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Correct Answer
                        </label>
                        <select
                          value={currentQuestion.correctAnswer}
                          onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={0}>Option 1</option>
                          <option value={1}>Option 2</option>
                          <option value={2}>Option 3</option>
                          <option value={3}>Option 4</option>
                        </select>
                      </div>

                      {/* Option Translations */}
                      <div className="border rounded-lg p-3 md:p-4 bg-gray-50">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Option Translations (optional)</h4>
                        {currentQuestion.options.map((option, index) => (
                          <div key={index} className="mb-3 last:mb-0">
                            <p className="text-xs text-gray-600 mb-1">Option {index + 1}: {option || `Option ${index + 1}`}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {SUPPORTED_LANGUAGES.map(({ code, label }) => (
                                <input
                                  key={code}
                                  type="text"
                                  value={currentQuestion.optionTranslations?.[index]?.[code] || ''}
                                  onChange={(e) => {
                                    const newOptionTranslations = [...(currentQuestion.optionTranslations || [])];
                                    if (!newOptionTranslations[index]) newOptionTranslations[index] = {};
                                    newOptionTranslations[index] = { ...newOptionTranslations[index], [code]: e.target.value };
                                    setCurrentQuestion({ ...currentQuestion, optionTranslations: newOptionTranslations });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                  placeholder={`Option ${index + 1} in ${label}`}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={addQuestion}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
                      >
                        Add Question
                      </button>
                    </div>

                    {/* Questions List */}
                    {videoForm.questions.length > 0 && (
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">
                          Questions Added ({videoForm.questions.length})
                        </h4>
                        <div className="space-y-2">
                          {videoForm.questions.map((q, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">Q{index + 1}: {q.question}</p>
                                <p className="text-xs text-gray-600">Correct: Option {q.correctAnswer + 1}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeQuestion(index)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bulk Import Section */}
                    <div className="border-t pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-md font-semibold text-gray-900">Bulk Import Questions</h3>
                        <button
                          type="button"
                          onClick={() => setShowVideoBulkUpload(!showVideoBulkUpload)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {showVideoBulkUpload ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      
                      {showVideoBulkUpload && (
                        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                          {/* Instructions */}
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <h4 className="font-semibold text-purple-900 mb-2 text-sm">Instructions</h4>
                            <div className="space-y-1 text-xs text-purple-800">
                              <p>• Upload questions in CSV or JSON format.</p>
                              <p>• Supported types: mcq, truefalse, fillblank, nps.</p>
                              <p>• CSV (typed): type, question, options (pipe-separated), correctAnswer, correctText, caseSensitive, npsMin, npsMax</p>
                              <p>• Legacy CSV still works: Question, Option1, Option2, Option3, Option4, Correct Answer (1-4)</p>
                              <p>• JSON: array of objects with type, question, and type-specific fields (options, correctAnswer, correctText, npsMin, npsMax, etc.)</p>
                            </div>
                          </div>

                          {/* Template Downloads */}
                          <div className="flex space-x-3">
                            <button
                              type="button"
                              onClick={downloadSampleCSV}
                              className="flex items-center px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition duration-200 text-sm"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              CSV Template
                            </button>
                            <button
                              type="button"
                              onClick={downloadSampleJSON}
                              className="flex items-center px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition duration-200 text-sm"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              JSON Template
                            </button>
                          </div>

                          {/* File Upload */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Upload File (CSV or JSON)
                            </label>
                            <input
                              type="file"
                              accept=".csv,.json"
                              onChange={handleFileUpload}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            {uploadedFile && (
                              <p className="mt-2 text-sm text-gray-600">
                                Selected: {uploadedFile.name}
                              </p>
                            )}
                          </div>

                          {/* Errors */}
                          {uploadErrors.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <h4 className="font-semibold text-red-900 mb-2 text-sm flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Validation Errors
                              </h4>
                              <ul className="space-y-1 text-xs text-red-800">
                                {uploadErrors.map((error, index) => (
                                  <li key={index}>• {error}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Preview */}
                          {previewData.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                                Preview ({previewData.length} questions)
                              </h4>
                              <div className="border rounded-lg overflow-hidden">
                                <div className="bg-gray-100 px-3 py-2 border-b">
                                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-700">
                                    <div className="col-span-2">Type</div>
                                    <div className="col-span-5">Question</div>
                                    <div className="col-span-3">Options / Scale / Answer</div>
                                    <div className="col-span-2">Correct</div>
                                  </div>
                                </div>
                                <div className="max-h-40 overflow-y-auto">
                                  {previewData.slice(0, 5).map((question, index) => {
                                    const qType = question.type || 'mcq';
                                    const isOptionType = qType === 'mcq' || qType === 'truefalse';
                                    const optionSummary = isOptionType
                                      ? (question.options || []).join(' | ')
                                      : qType === 'fillblank'
                                      ? `Fill: ${question.correctText || '-'}${question.caseSensitive ? ' (case-sensitive)' : ''}`
                                      : qType === 'nps'
                                      ? `Scale ${question.npsMin ?? 0}-${question.npsMax ?? 10}`
                                      : '-';
                                    const correctText = isOptionType
                                      ? `Opt ${(question.correctAnswer ?? 0) + 1}`
                                      : qType === 'fillblank'
                                      ? (question.correctText || 'Any')
                                      : qType === 'nps' && question.correctAnswer !== null && question.correctAnswer !== undefined
                                      ? question.correctAnswer
                                      : 'Any';
                                    return (
                                      <div key={index} className="px-3 py-2 border-b hover:bg-gray-100">
                                        <div className="grid grid-cols-12 gap-2 text-xs">
                                          <div className="col-span-2 truncate capitalize">{qType}</div>
                                          <div className="col-span-5 truncate" title={question.question}>
                                            {question.question}
                                          </div>
                                          <div className="col-span-3 truncate" title={optionSummary}>
                                            {optionSummary}
                                          </div>
                                          <div className="col-span-2 text-center truncate">
                                            {correctText}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {previewData.length > 5 && (
                                    <div className="px-3 py-2 text-center text-xs text-gray-600">
                                      ... and {previewData.length - 5} more questions
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowVideoBulkUpload(false);
                                setUploadedFile(null);
                                setPreviewData([]);
                                setUploadErrors([]);
                              }}
                              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200 text-sm"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={confirmBulkUpload}
                              disabled={previewData.length === 0 || uploadErrors.length > 0}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                            >
                              Add {previewData.length} Questions
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User Selection */}
                  <div className="border-t pt-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Assign to Users</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {users.map((user) => (
                        <label key={user.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={videoForm.selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setVideoForm({
                                  ...videoForm,
                                  selectedUsers: [...videoForm.selectedUsers, user.id]
                                });
                              } else {
                                setVideoForm({
                                  ...videoForm,
                                  selectedUsers: videoForm.selectedUsers.filter(id => id !== user.id)
                                });
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{user.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={resetVideoForm}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
                    >
                      <Save className="w-4 h-4 inline mr-2" />
                      {editingVideo ? 'Update Video' : 'Save Video'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}

        {activeTab === 'training' && (
          <>
            {showTrainingView ? (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTrainingView(false);
                        setSelectedTrainingView(null);
                      }}
                      className="inline-flex items-center px-4 py-2 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition duration-200"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </button>
                    <div className="mt-3 text-sm text-gray-500">
                      <span className="font-medium text-slate-600">Training Documents & Videos</span>
                      <span className="mx-2">/</span>
                      <span>View</span>
                    </div>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedTrainingView?.title}</h2>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-xl p-5">
                    <p className="text-sm text-slate-600"><strong>Description:</strong> {selectedTrainingView?.description || 'No description'}</p>
                    <p className="text-sm text-slate-600"><strong>Asset Type:</strong> {selectedTrainingView?.assetType === 'video' ? 'Video' : 'Document'}</p>
                    <p className="text-sm text-slate-600"><strong>Source:</strong> {selectedTrainingView?.sourceType === 'file' ? 'Uploaded File' : 'URL'}</p>
                    <p className="text-sm text-slate-600"><strong>Follow-up:</strong> {selectedTrainingView?.followUpType === 'video' ? 'Video Training' : 'Quiz'}</p>
                    <p className="text-sm text-slate-600"><strong>Assigned Users:</strong> {(selectedTrainingView?.selectedUsers || []).length}</p>
                  </div>
                </div>
              </div>
            ) : !showTrainingForm ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Training Library ({trainingItems.length})
                  </h2>
                  <button
                    onClick={() => setShowTrainingForm(true)}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Training
                  </button>
                </div>

                {trainingItems.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No training assets created yet</p>
                    <p className="text-sm text-gray-500 mt-2">Create training documents or videos and assign them to users.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    {/* Mobile: Card layout */}
                    <div className="md:hidden divide-y divide-gray-200">
                      {trainingItems.map((item) => {
                        const quizResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
                        const resultIds = new Set([item.id, item.followUpId].filter(Boolean).map(String));
                        const attempted = new Set(quizResults.filter(r => resultIds.has(String(r.quizId))).map(r => r.userId)).size;
                        return (
                        <div
                          key={item.id}
                          className="p-4 active:bg-gray-50"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{item.title}</p>
                              {item.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>}
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ml-2 ${
                              item.assetType === 'video' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {item.assetType === 'video' ? <Video className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                              {item.assetType === 'video' ? 'Video' : 'Document'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>Follow-up: {item.followUpType === 'video' ? 'Video' : 'Quiz'}</span>
                              <span>{(item.selectedUsers || []).length} shared</span>
                              <span>{attempted} attempted</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                                item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {item.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-3">
                            <button
                              onClick={() => handleViewTraining(item)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Training"
                            >
                              <FileSpreadsheet className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleShareTraining(item)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Share Training"
                            >
                              <Share className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => editTraining(item)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit Training"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteTraining(item.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Training"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                      )}
                    </div>

                    {/* Desktop: Table layout */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Title</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Follow-up</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Shared</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Attempted</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {trainingItems.map((item) => {
                            const quizResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
                            const resultIds = new Set([item.id, item.followUpId].filter(Boolean).map(String));
                            const attempted = new Set(quizResults.filter(r => resultIds.has(String(r.quizId))).map(r => r.userId)).size;
                            return (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="font-medium text-gray-900">{item.title}</div>
                                {item.description && <div className="text-xs text-gray-500 mt-1 line-clamp-1">{item.description}</div>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                                  item.assetType === 'video' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'
                                }`}>
                                  {item.assetType === 'video' ? <Video className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                  {item.assetType === 'video' ? 'Video' : 'Document'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                {item.followUpType === 'video' ? 'Video Training' : 'Quiz'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                {(item.selectedUsers || []).length} users
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                {attempted} attempted
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => handleViewTraining(item)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="View Training"
                                  >
                                    <FileSpreadsheet className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleShareTraining(item)}
                                    className="text-purple-600 hover:text-purple-900"
                                    title="Share Training"
                                  >
                                    <Share className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleShowUserDetails(item, 'training')}
                                    className="text-green-600 hover:text-green-900"
                                    title="View Shared & Attempted Users"
                                  >
                                    <Users className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => editTraining(item)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Edit Training"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteTraining(item.id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Delete Training"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {editingTraining ? 'Edit Training Asset' : 'Create Training Asset'}
                  </h2>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="flex items-center px-3 py-1.5 text-sm bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition duration-200"
                  >
                    <Save className="w-4 h-4 mr-1.5" />
                    Save as Draft
                  </button>
                </div>

                <form onSubmit={handleTrainingSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={trainingForm.title}
                        onChange={(e) => setTrainingForm({ ...trainingForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={trainingForm.description}
                        onChange={(e) => setTrainingForm({ ...trainingForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Asset Type
                      </label>
                      <select
                        value={trainingForm.assetType}
                        onChange={(e) => setTrainingForm({ ...trainingForm, assetType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="document">Document</option>
                        <option value="video">Video</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Source Type
                      </label>
                      <div className="flex items-center gap-6">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="trainingSource"
                            value="url"
                            checked={trainingForm.sourceType === 'url'}
                            onChange={() => setTrainingForm({ ...trainingForm, sourceType: 'url', file: null })}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">URL</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="trainingSource"
                            value="file"
                            checked={trainingForm.sourceType === 'file'}
                            onChange={() => setTrainingForm({ ...trainingForm, sourceType: 'file', fileUrl: '' })}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Upload File</span>
                        </label>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      {trainingForm.sourceType === 'url' ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            File URL
                          </label>
                          <input
                            type="url"
                            value={trainingForm.fileUrl}
                            onChange={(e) => setTrainingForm({ ...trainingForm, fileUrl: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://example.com/document.pdf"
                            required
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload File
                          </label>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo"
                            onChange={handleTrainingFileUpload}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {trainingForm.file && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                              Selected: {trainingForm.file.name} ({(trainingForm.file.size / (1024 * 1024)).toFixed(2)} MB)
                            </div>
                          )}
                          {editingTraining && !trainingForm.file && trainingForm.sourceType === 'file' && trainingForm.fileUrl && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                              Current file reference is preserved for this training item.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Follow-up Assessment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Follow-up Type
                        </label>
                        <select
                          value={trainingForm.followUpType}
                          onChange={(e) => setTrainingForm({ ...trainingForm, followUpType: e.target.value, followUpId: '' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="quiz">Quiz</option>
                          <option value="video">Video Training</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Follow-up Item
                        </label>
                        <select
                          value={trainingForm.followUpId}
                          onChange={(e) => setTrainingForm({ ...trainingForm, followUpId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select follow-up</option>
                          {trainingForm.followUpType === 'quiz' ? (
                            quizzes.map((quiz) => (
                              <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
                            ))
                          ) : (
                            videos.map((video) => (
                              <option key={video.id} value={video.id}>{video.title}</option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Follow-up Quiz Settings</h3>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="allowSkipQuestionsTraining"
                        checked={trainingForm.allowSkipQuestions}
                        onChange={(e) => setTrainingForm({ ...trainingForm, allowSkipQuestions: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="allowSkipQuestionsTraining" className="ml-2 block text-sm text-gray-700">
                        Allow Skip Questions in Follow-up Quiz
                      </label>
                    </div>
                  </div>

                  {/* Certificate Configuration */}
                  <div className="border-t pt-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Certificate Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Issue Certificate
                        </label>
                        <select
                          value={trainingForm.certificateEnabled ? 'yes' : 'no'}
                          onChange={(e) => setTrainingForm({ ...trainingForm, certificateEnabled: e.target.value === 'yes' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Validity Period
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={trainingForm.certificateValidityValue}
                          onChange={(e) => setTrainingForm({ ...trainingForm, certificateValidityValue: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={!trainingForm.certificateEnabled}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Validity Unit
                        </label>
                        <select
                          value={trainingForm.certificateValidityUnit}
                          onChange={(e) => setTrainingForm({ ...trainingForm, certificateValidityUnit: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={!trainingForm.certificateEnabled}
                        >
                          <option value="days">Days</option>
                          <option value="months">Months</option>
                          <option value="years">Years</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Access Mode Configuration */}
                  <div className="border-t pt-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Access Mode</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          User Access Type
                        </label>
                        <select
                          value={trainingForm.accessMode}
                          onChange={(e) => setTrainingForm({ ...trainingForm, accessMode: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="permanent">Permanent - Always Available</option>
                          <option value="one-time">One-Time - Single Attempt Only</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          {trainingForm.accessMode === 'one-time' 
                            ? 'Users can only complete this training once.' 
                            : 'Users can access this training multiple times.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Reassignment Configuration */}
                  <div className="border-t pt-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Reassignment on Failure</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Re-assign on Fail
                        </label>
                        <select
                          value={trainingForm.reassignOnFail ? 'yes' : 'no'}
                          onChange={(e) => setTrainingForm({ ...trainingForm, reassignOnFail: e.target.value === 'yes' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="no">No - Keep training available</option>
                          <option value="yes">Yes - Reassign after fail</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          {trainingForm.reassignOnFail 
                            ? 'User must re-complete training before retest.' 
                            : 'User can retake follow-up quiz immediately.'}
                        </p>
                      </div>

                      {trainingForm.reassignOnFail && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reschedule After (Days)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="365"
                            value={trainingForm.rescheduleDays}
                            onChange={(e) => setTrainingForm({ ...trainingForm, rescheduleDays: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Days to wait before user can retake follow-up.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Document Permissions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl">
                        <input
                          type="checkbox"
                          checked={trainingForm.allowDownload}
                          onChange={(e) => setTrainingForm({ ...trainingForm, allowDownload: e.target.checked })}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Allow Download</span>
                      </label>
                      <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl">
                        <input
                          type="checkbox"
                          checked={trainingForm.allowPrint}
                          onChange={(e) => setTrainingForm({ ...trainingForm, allowPrint: e.target.checked })}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Allow Print</span>
                      </label>
                      <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl">
                        <input
                          type="checkbox"
                          checked={trainingForm.allowShare}
                          onChange={(e) => setTrainingForm({ ...trainingForm, allowShare: e.target.checked })}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Allow Share</span>
                      </label>
                    </div>

                    <h3 className="text-md font-semibold text-gray-900 mb-4">Assign to Users</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {users.map((user) => (
                        <label key={user.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={trainingForm.selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTrainingForm({
                                  ...trainingForm,
                                  selectedUsers: [...trainingForm.selectedUsers, user.id]
                                });
                              } else {
                                setTrainingForm({
                                  ...trainingForm,
                                  selectedUsers: trainingForm.selectedUsers.filter(id => id !== user.id)
                                });
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{user.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={resetTrainingForm}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
                    >
                      <Save className="w-4 h-4 inline mr-2" />
                      {editingTraining ? 'Update Training' : 'Save Training'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}

        {showShareModal && shareTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="flex items-start justify-between p-6 border-b border-slate-200">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Share {shareTarget.type === 'quiz' ? 'Quiz' : shareTarget.type === 'video' ? 'Video Training' : 'Training Asset'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Select users who should receive access to this {shareTarget.type === 'quiz' ? 'quiz' : shareTarget.type === 'video' ? 'video training' : 'training asset'}.
                  </p>
                </div>
                <button
                  onClick={closeShareModal}
                  className="text-slate-500 hover:text-slate-900"
                  aria-label="Close share modal"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="text-sm text-slate-600">
                  <p className="font-medium text-slate-800">{shareTarget.item.title}</p>
                  <p>{shareTarget.item.description}</p>
                </div>

                <div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                      <span className="text-sm font-semibold text-slate-900">Assign To Users</span>
                      <p className="text-xs text-slate-500">Search users and select one or more recipients.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={selectAllVisibleShareUsers}
                        className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm"
                      >
                        Select all
                      </button>
                      <button
                        type="button"
                        onClick={clearShareSelection}
                        className="px-3 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition text-sm"
                      >
                        Clear selection
                      </button>
                      <span className="text-xs text-slate-500">{shareSelectedUsers.length} selected</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <input
                      type="text"
                      value={shareSearchTerm}
                      onChange={(e) => setShareSearchTerm(e.target.value)}
                      placeholder="Search users..."
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                    {filteredShareUsers.map((user) => (
                      <label key={user.id} className="flex items-center space-x-3 rounded-xl border border-slate-200 p-3 hover:border-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shareSelectedUsers.includes(user.id)}
                          onChange={(e) => updateShareSelection(user.id, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="min-w-0">
                          <p className="text-sm text-slate-700 truncate">{user.name}</p>
                          {user.email && <p className="text-xs text-slate-500 truncate">{user.email}</p>}
                        </div>
                      </label>
                    ))}

                    {users.length === 0 && (
                      <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                        No users found. Add users first before sharing.
                      </div>
                    )}
                    {users.length > 0 && filteredShareUsers.length === 0 && (
                      <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                        No users match your search.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 bg-slate-50 p-5">
                <button
                  onClick={closeShareModal}
                  className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmShareAssignment}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Save Assignment
                </button>
              </div>
            </div>
          </div>
        )}

        {showUserDetailsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex items-start justify-between p-6 border-b border-slate-200 flex-shrink-0">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    User Details - {userDetailsData.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    View shared users and their attempt status
                  </p>
                </div>
                <button
                  onClick={() => setShowUserDetailsModal(false)}
                  className="text-slate-500 hover:text-slate-900"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Shared Users ({userDetailsData.shared.length})
                  </h3>
                  {userDetailsData.shared.length === 0 ? (
                    <div className="text-sm text-slate-500 italic">No users shared with this content.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left border border-slate-200 rounded-lg">
                        <thead className="bg-slate-50 text-slate-700">
                          <tr>
                            <th className="px-4 py-2 font-semibold">Name</th>
                            <th className="px-4 py-2 font-semibold">Email</th>
                            <th className="px-4 py-2 font-semibold">Department</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {userDetailsData.shared.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50">
                              <td className="px-4 py-2">{user.name}</td>
                              <td className="px-4 py-2">{user.email || '-'}</td>
                              <td className="px-4 py-2">{user.department || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-md font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Attempted Users ({userDetailsData.attempted.length})
                  </h3>
                  {userDetailsData.attempted.length === 0 ? (
                    <div className="text-sm text-slate-500 italic">No users have attempted this content yet.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left border border-slate-200 rounded-lg">
                        <thead className="bg-slate-50 text-slate-700">
                          <tr>
                            <th className="px-4 py-2 font-semibold">Name</th>
                            <th className="px-4 py-2 font-semibold">Email</th>
                            <th className="px-4 py-2 font-semibold">Department</th>
                            <th className="px-4 py-2 font-semibold">Score</th>
                            <th className="px-4 py-2 font-semibold">Status</th>
                            <th className="px-4 py-2 font-semibold">Date</th>
                            <th className="px-4 py-2 font-semibold">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {userDetailsData.attempted.map((user) => (
                            <tr key={`${user.id}-${user.completedAt}`} className="hover:bg-slate-50">
                              <td className="px-4 py-2">{user.name}</td>
                              <td className="px-4 py-2">{user.email || '-'}</td>
                              <td className="px-4 py-2">{user.department || '-'}</td>
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-slate-900">{user.score}%</span>
                                  {user.correctAnswers !== undefined && user.totalQuestions && (
                                    <span className="text-xs text-slate-500">({user.correctAnswers}/{user.totalQuestions})</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {user.passed ? 'Passed' : 'Failed'}
                                </span>
                              </td>
                              <td className="px-4 py-2">{user.completedAt ? new Date(user.completedAt).toLocaleString() : '-'}</td>
                              <td className="px-4 py-2">
                                {user.timeTaken ? `${Math.round(user.timeTaken / 60)}m ${user.timeTaken % 60}s` : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 bg-slate-50 p-5 flex-shrink-0">
                <button
                  onClick={() => setShowUserDetailsModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  );
};

export default LTModule;
