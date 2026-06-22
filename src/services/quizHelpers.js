// Question type definitions and helper utilities for quiz authoring and taking

export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'mcq',
  TRUE_FALSE: 'truefalse',
  FILL_IN_BLANK: 'fillblank',
  NPS_SCALE: 'nps'
};

export const QUESTION_TYPE_LABELS = {
  [QUESTION_TYPES.MULTIPLE_CHOICE]: 'Multiple Choice',
  [QUESTION_TYPES.TRUE_FALSE]: 'True / False',
  [QUESTION_TYPES.FILL_IN_BLANK]: 'Fill in the Blank',
  [QUESTION_TYPES.NPS_SCALE]: 'NPS / Linear Scale'
};

export const createDefaultQuestion = (type = QUESTION_TYPES.MULTIPLE_CHOICE) => {
  const id = `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const base = {
    id,
    question: '',
    type,
    randomizeOptions: false,
    branchRules: [],
    questionTranslations: {},
    optionTranslations: []
  };

  switch (type) {
    case QUESTION_TYPES.MULTIPLE_CHOICE:
      return {
        ...base,
        options: ['', '', '', ''],
        correctAnswer: 0
      };
    case QUESTION_TYPES.TRUE_FALSE:
      return {
        ...base,
        options: ['True', 'False'],
        correctAnswer: 0
      };
    case QUESTION_TYPES.FILL_IN_BLANK:
      return {
        ...base,
        correctText: '',
        caseSensitive: false
      };
    case QUESTION_TYPES.NPS_SCALE:
      return {
        ...base,
        npsMin: 0,
        npsMax: 10,
        scaleMinLabel: 'Not at all likely',
        scaleMaxLabel: 'Extremely likely',
        correctAnswer: null
      };
    default:
      return { ...base, options: ['', '', '', ''], correctAnswer: 0 };
  }
};

// Fisher-Yates shuffle
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Prepare questions for a quiz attempt. Returns metadata needed for display and scoring.
export const prepareQuestionsForAttempt = (questions, randomizeQuestionOrder = true) => {
  if (!Array.isArray(questions)) return [];

  let processed = questions.map((q) => {
    let displayOptions = q.options || [];
    let displayOptionTranslations = Array.isArray(q.optionTranslations) ? q.optionTranslations : [];
    let optionMapping = displayOptions.map((_, i) => i);
    let correctAnswer = q.correctAnswer;

    // Always shuffle options for multiple choice and true/false questions.
    if (q.type === QUESTION_TYPES.MULTIPLE_CHOICE || q.type === QUESTION_TYPES.TRUE_FALSE) {
      const indices = displayOptions.map((_, i) => i);
      const shuffledIndices = shuffleArray(indices);
      displayOptions = shuffledIndices.map((i) => displayOptions[i]);
      displayOptionTranslations = shuffledIndices.map((i) => displayOptionTranslations[i]);
      optionMapping = shuffledIndices;
      if (typeof correctAnswer === 'number') {
        correctAnswer = shuffledIndices.indexOf(correctAnswer);
      }
    }

    return {
      ...q,
      displayOptions,
      optionTranslations: displayOptionTranslations,
      optionMapping,
      questionTranslations: q.questionTranslations || {},
      correctAnswer // display index for randomized options
    };
  });

  if (randomizeQuestionOrder) {
    processed = shuffleArray(processed);
  }

  return processed;
};

// Convert a user's display answer back to the original answer index.
export const getOriginalAnswerIndex = (question, displayAnswer) => {
  if (question.type === QUESTION_TYPES.MULTIPLE_CHOICE && question.randomizeOptions && question.optionMapping) {
    if (typeof displayAnswer !== 'number') return displayAnswer;
    return question.optionMapping[displayAnswer];
  }
  return displayAnswer;
};

// Check if the user's answer is correct for a given question.
export const checkAnswerCorrect = (question, answer) => {
  if (answer === null || answer === undefined || answer === '') return false;

  const qType = question.type || QUESTION_TYPES.MULTIPLE_CHOICE; // Default to multiple choice if type is undefined

  switch (qType) {
    case QUESTION_TYPES.MULTIPLE_CHOICE:
    case QUESTION_TYPES.TRUE_FALSE: {
      // For prepared questions correctAnswer is a display index; for raw questions it is an original index.
      // In both cases the stored answer and correctAnswer share the same coordinate system.
      return Number(answer) === Number(question.correctAnswer);
    }
    case QUESTION_TYPES.NPS_SCALE: {
      if (question.correctAnswer === null || question.correctAnswer === undefined) return true; // survey-only, no scoring
      return Number(answer) === Number(question.correctAnswer);
    }
    case QUESTION_TYPES.FILL_IN_BLANK: {
      const userAnswer = String(answer).trim();
      const correctText = String(question.correctText || '').trim();
      if (!correctText) return true; // survey-only
      if (question.caseSensitive) {
        return correctText === userAnswer;
      }
      return correctText.toLowerCase() === userAnswer.toLowerCase();
    }
    default:
      // Fallback: treat as multiple choice if type is unknown
      return Number(answer) === Number(question.correctAnswer);
  }
};

// Evaluate a simple rule condition.
const evaluateRuleCondition = (condition, answer, ruleValue) => {
  const a = Number(answer);
  const b = Number(ruleValue);
  switch (condition) {
    case 'equals': return String(answer).trim() === String(ruleValue).trim();
    case 'notEquals': return String(answer).trim() !== String(ruleValue).trim();
    case 'greaterThan': return !isNaN(a) && !isNaN(b) && a > b;
    case 'lessThan': return !isNaN(a) && !isNaN(b) && a < b;
    default: return String(answer).trim() === String(ruleValue).trim();
  }
};

// Determine the next question index given a question list and current answer.
export const getNextQuestionIndex = (questions, currentIndex, answer) => {
  const currentQuestion = questions[currentIndex];
  if (!Array.isArray(currentQuestion?.branchRules) || currentQuestion.branchRules.length === 0) {
    return currentIndex + 1;
  }

  const matchingRule = currentQuestion.branchRules.find((rule) =>
    evaluateRuleCondition(rule.condition, answer, rule.value)
  );

  if (matchingRule && matchingRule.targetQuestionId) {
    const targetIndex = questions.findIndex((q) => q.id === matchingRule.targetQuestionId);
    if (targetIndex !== -1) return targetIndex;
  }

  return currentIndex + 1;
};

// Calculate score for a quiz attempt.
export const calculateScore = (questions, answers) => {
  if (!questions.length) return 0;
  let correct = 0;
  let scorable = 0;
  questions.forEach((q, i) => {
    const answer = answers[i];
    if (answer === null || answer === undefined || answer === '') return;
    if (q.type === QUESTION_TYPES.NPS_SCALE && (q.correctAnswer === null || q.correctAnswer === undefined)) {
      return;
    }
    if (q.type === QUESTION_TYPES.FILL_IN_BLANK && !String(q.correctText || '').trim()) {
      return;
    }
    scorable++;
    if (checkAnswerCorrect(q, answer)) correct++;
  });
  // Calculate actual percentage based on scorable questions
  if (scorable === 0) return 0;
  return Math.round((correct / scorable) * 100);
};

// Format answer text for review.
export const formatAnswerText = (question, answer) => {
  if (answer === null || answer === undefined || answer === '') return 'Not answered';
  const qType = question.type || QUESTION_TYPES.MULTIPLE_CHOICE; // Default to multiple choice if type is undefined
  switch (qType) {
    case QUESTION_TYPES.MULTIPLE_CHOICE:
    case QUESTION_TYPES.TRUE_FALSE: {
      const options = question.displayOptions || question.options || [];
      return options[answer] ?? `Option ${answer + 1}`;
    }
    case QUESTION_TYPES.NPS_SCALE:
      return String(answer);
    case QUESTION_TYPES.FILL_IN_BLANK:
      return String(answer);
    default:
      // Fallback: try to get option text if available, otherwise return string value
      const options = question.displayOptions || question.options || [];
      return options[answer] ?? String(answer);
  }
};

// Determine correct answer text for review.
export const formatCorrectAnswerText = (question) => {
  const qType = question.type || QUESTION_TYPES.MULTIPLE_CHOICE; // Default to multiple choice if type is undefined
  switch (qType) {
    case QUESTION_TYPES.MULTIPLE_CHOICE:
    case QUESTION_TYPES.TRUE_FALSE: {
      const options = question.displayOptions || question.options || [];
      return options[question.correctAnswer] ?? `Option ${question.correctAnswer + 1}`;
    }
    case QUESTION_TYPES.FILL_IN_BLANK:
      return String(question.correctText || '').trim() || 'Any';
    case QUESTION_TYPES.NPS_SCALE:
      return question.correctAnswer !== null && question.correctAnswer !== undefined ? String(question.correctAnswer) : 'Any';
    default:
      // Fallback: try to get option text if available
      const options = question.displayOptions || question.options || [];
      return options[question.correctAnswer] ?? String(question.correctAnswer || '');
  }
};

// Draft helpers for admin forms.
const DRAFT_KEY = 'ltDrafts';

export const saveDraft = (draftType, draftId, payload) => {
  try {
    const drafts = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    drafts[draftType] = drafts[draftType] || {};
    drafts[draftType][draftId] = {
      payload,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  } catch (e) {
  }
};

export const loadDraft = (draftType, draftId) => {
  try {
    const drafts = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    const draft = drafts[draftType]?.[draftId] || null;
    if (!draft) return null;
    // New format: { payload, savedAt }. Old format: { title, description, ..., savedAt }.
    if (draft.payload && typeof draft.payload === 'object') {
      return draft;
    }
    if (draft.title || draft.description || draft.questions) {
      return { payload: draft, savedAt: draft.savedAt };
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const clearDraft = (draftType, draftId) => {
  try {
    const drafts = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    if (drafts[draftType]) {
      delete drafts[draftType][draftId];
      localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
    }
  } catch (e) {
  }
};

// User draft answers helpers.
const USER_DRAFT_KEY_PREFIX = 'userQuizDraft_';

export const saveUserDraftAnswers = (quizId, userId, answers, questions) => {
  try {
    const draftAnswers = questions?.map((q, index) => ({ id: q.id, answer: answers[index] })) || answers;
    localStorage.setItem(`${USER_DRAFT_KEY_PREFIX}${quizId}_${userId}`, JSON.stringify({
      answers: draftAnswers,
      savedAt: new Date().toISOString()
    }));
  } catch (e) {
  }
};

export const loadUserDraftAnswers = (quizId, userId, questions) => {
  try {
    const data = JSON.parse(localStorage.getItem(`${USER_DRAFT_KEY_PREFIX}${quizId}_${userId}`) || 'null');
    if (!data) return null;
    const saved = data.answers;
    if (!Array.isArray(saved)) return null;
    // If questions provided and draft is in new id->answer format, restore by id.
    if (questions && saved.length > 0 && saved[0] && typeof saved[0] === 'object' && 'id' in saved[0]) {
      const savedMap = {};
      saved.forEach(item => { savedMap[item.id] = item.answer; });
      return questions.map(q => savedMap[q.id] ?? null);
    }
    return saved;
  } catch (e) {
    return null;
  }
};

export const clearUserDraftAnswers = (quizId, userId) => {
  try {
    localStorage.removeItem(`${USER_DRAFT_KEY_PREFIX}${quizId}_${userId}`);
  } catch (e) {
  }
};
