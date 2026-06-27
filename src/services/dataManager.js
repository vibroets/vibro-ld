import { getQuizzes, saveQuiz, getQuizResults as supabaseGetQuizResults, saveQuizResult as supabaseSaveQuizResult, getVideos, saveVideo, getCertificates, saveCertificate, getUsers, saveUser, getAdmins, saveAdmin } from './supabaseService';

// Unified data manager that handles both Supabase and localStorage fallback
export const DataManager = {
  // Get data with Supabase first, fallback to localStorage
  async getData(key, supabaseFn) {
    try {
      const data = await supabaseFn();
      return data;
    } catch (error) {
      console.error(`Supabase error for ${key}:`, error);
      // Fallback to localStorage
      return JSON.parse(localStorage.getItem(key) || '[]');
    }
  },

  // Save data to both Supabase and localStorage
  async saveData(key, data, supabaseFn) {
    try {
      await supabaseFn(data);
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Supabase save error for ${key}:`, error);
      // Fallback to localStorage only
      localStorage.setItem(key, JSON.stringify(data));
      return false;
    }
  },

  // Users
  async getUsers() {
    return this.getData('users', getUsers);
  },

  async saveUser(user) {
    return this.saveData('users', user, saveUser);
  },

  // Admins
  async getAdmins() {
    return this.getData('admins', getAdmins);
  },

  async saveAdmin(admin) {
    return this.saveData('admins', admin, saveAdmin);
  },

  // Training Schedules
  async getTrainingSchedules() {
    // Use localStorage only for training schedules due to Supabase schema mismatch
    const localData = JSON.parse(localStorage.getItem('trainingSchedules') || '[]');
    console.log('Loaded training schedules from localStorage:', localData);
    return localData;
  },

  async saveTrainingSchedule(training) {
    // Use localStorage only for training schedules due to Supabase schema mismatch
    if (Array.isArray(training)) {
      localStorage.setItem('trainingSchedules', JSON.stringify(training));
      console.log('Saved training schedules to localStorage');
      return true;
    }
    localStorage.setItem('trainingSchedules', JSON.stringify(training));
    console.log('Saved training schedule to localStorage');
    return true;
  },

  // Attendances
  async getAttendances() {
    // Use localStorage only for attendances due to Supabase schema mismatch
    const localData = JSON.parse(localStorage.getItem('attendances') || '[]');
    // Handle case where data is an object instead of array
    const attendances = Array.isArray(localData) ? localData : [];
    console.log('Loaded attendances from localStorage:', attendances);
    return attendances;
  },

  async saveAttendance(attendance) {
    // Use localStorage only for attendances due to Supabase schema mismatch
    const localData = JSON.parse(localStorage.getItem('attendances') || '[]');
    // Handle case where data is an object instead of array
    const attendances = Array.isArray(localData) ? localData : [];
    
    // Check if attendance with same ID exists, update it, otherwise add new
    const existingIndex = attendances.findIndex(a => a.id === attendance.id);
    if (existingIndex >= 0) {
      attendances[existingIndex] = attendance;
    } else {
      attendances.push(attendance);
    }
    
    localStorage.setItem('attendances', JSON.stringify(attendances));
    console.log('Saved attendance to localStorage:', attendance);
    return true;
  },

  // Quizzes
  async getQuizzes() {
    return this.getData('quizzes', getQuizzes);
  },

  async saveQuiz(quiz) {
    return this.saveData('quizzes', quiz, saveQuiz);
  },

  // Quiz Results
  async getQuizResults() {
    // Try Supabase first, merge with localStorage results
    const localData = JSON.parse(localStorage.getItem('quizResults') || '[]');
    const localResults = Array.isArray(localData) ? localData : [];
    try {
      const supabaseResults = await supabaseGetQuizResults();
      if (supabaseResults && supabaseResults.length > 0) {
        // Normalize Supabase snake_case fields to camelCase
        const normalizedSupabase = supabaseResults.map(sr => ({
          ...sr,
          quizId: sr.quizId || sr.quiz_id,
          userId: sr.userId || sr.user_id,
          userName: sr.userName || sr.user_name,
          correctAnswers: sr.correctAnswers || sr.correct_answers,
          totalQuestions: sr.totalQuestions || sr.total_questions,
          completedAt: sr.completedAt || sr.completed_at
        }));
        // Merge: use local results as base, add any Supabase results not already in local
        const merged = [...localResults];
        normalizedSupabase.forEach(sr => {
          const exists = merged.some(lr => lr.quizId === sr.quizId && lr.userId === sr.userId && lr.completedAt === sr.completedAt);
          if (!exists) merged.push(sr);
        });
        // Update localStorage with merged results
        localStorage.setItem('quizResults', JSON.stringify(merged));
        console.log('Loaded quiz results (merged localStorage + Supabase):', merged.length);
        return merged;
      }
    } catch (error) {
      console.error('Supabase error for quizResults, using localStorage only:', error);
    }
    console.log('Loaded quiz results from localStorage:', localResults.length);
    return localResults;
  },

  async saveQuizResult(result) {
    // Always save to localStorage first
    const localData = JSON.parse(localStorage.getItem('quizResults') || '[]');
    const results = Array.isArray(localData) ? localData : [];
    const existingIndex = results.findIndex(r => r.quizId === result.quizId && r.userId === result.userId && r.completedAt === result.completedAt);
    if (existingIndex >= 0) {
      results[existingIndex] = result;
    } else {
      results.push(result);
    }
    localStorage.setItem('quizResults', JSON.stringify(results));
    // Also try to save to Supabase with only safe core fields
    try {
      const supabaseResult = {
        id: result.id || `${result.userId}-${result.quizId}-${Date.now()}`,
        quiz_id: result.quizId,
        user_id: result.userId,
        user_name: result.userName,
        score: result.score,
        correct_answers: result.correctAnswers,
        total_questions: result.totalQuestions,
        completed_at: result.completedAt
      };
      await supabaseSaveQuizResult(supabaseResult);
      console.log('Saved quiz result to Supabase:', supabaseResult);
    } catch (error) {
      console.error('Supabase save error for quizResult, saved to localStorage only:', error);
    }
    return true;
  },

  // Videos
  async getVideos() {
    return this.getData('videos', getVideos);
  },

  async saveVideo(video) {
    return this.saveData('videos', video, saveVideo);
  },

  // Certificates
  async getCertificates(userId) {
    return getCertificates(userId);
  },

  async saveCertificate(certificate) {
    return this.saveData('certificates', certificate, saveCertificate);
  }
};

export default DataManager;
