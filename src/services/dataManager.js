import { getQuizzes, saveQuiz, getQuizResults as supabaseGetQuizResults, saveQuizResult as supabaseSaveQuizResult, getVideos, saveVideo, getCertificates, saveCertificate, getUsers, saveUser, getAdmins, saveAdmin, getTrainingSchedules as supabaseGetTrainingSchedules, saveTrainingSchedule as supabaseSaveTrainingSchedule, saveAllTrainingSchedules as supabaseSaveAllTrainingSchedules, getAttendances as supabaseGetAttendances, saveAttendance as supabaseSaveAttendance } from './supabaseService';

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
    const localData = JSON.parse(localStorage.getItem('trainingSchedules') || '[]');
    const localSchedules = Array.isArray(localData) ? localData : [];
    try {
      const supabaseSchedules = await supabaseGetTrainingSchedules();
      if (supabaseSchedules && supabaseSchedules.length > 0) {
        // Supabase is source of truth — prefer Supabase over local
        // Add any local-only records not yet pushed to Supabase
        const merged = [...supabaseSchedules];
        localSchedules.forEach(lr => {
          if (!merged.some(sr => sr.id === lr.id)) merged.push(lr);
        });
        localStorage.setItem('trainingSchedules', JSON.stringify(merged));
        console.log('Loaded training schedules (Supabase primary):', merged.length);
        return merged;
      }
    } catch (error) {
      console.error('Supabase error for trainingSchedules, using localStorage:', error);
    }
    console.log('Loaded training schedules from localStorage:', localSchedules.length);
    return localSchedules;
  },

  async saveTrainingSchedule(training) {
    console.log('DataManager.saveTrainingSchedule called with:', training);
    console.log('Is training an array?', Array.isArray(training));
    // Save to localStorage
    if (Array.isArray(training)) {
      localStorage.setItem('trainingSchedules', JSON.stringify(training));
      console.log('Saved training array to localStorage, length:', training.length);
      // Save all to Supabase
      try {
        await supabaseSaveAllTrainingSchedules(training);
        console.log('Saved all training schedules to Supabase successfully');
      } catch (error) {
        console.error('Supabase save error for training schedules:', error);
      }
      return true;
    }
    // Single training save
    const localData = JSON.parse(localStorage.getItem('trainingSchedules') || '[]');
    const schedules = Array.isArray(localData) ? localData : [];
    const idx = schedules.findIndex(t => t.id === training.id);
    if (idx >= 0) schedules[idx] = training;
    else schedules.push(training);
    localStorage.setItem('trainingSchedules', JSON.stringify(schedules));
    console.log('Saved single training to localStorage:', training.id);
    try {
      await supabaseSaveTrainingSchedule(training);
      console.log('Saved training schedule to Supabase successfully:', training.id);
    } catch (error) {
      console.error('Supabase save error for training schedule:', error);
    }
    return true;
  },

  // Attendances
  async getAttendances() {
    const localData = JSON.parse(localStorage.getItem('attendances') || '[]');
    const localAttendances = Array.isArray(localData) ? localData : [];
    try {
      const supabaseAttendances = await supabaseGetAttendances();
      if (supabaseAttendances && supabaseAttendances.length > 0) {
        const merged = [...localAttendances];
        supabaseAttendances.forEach(sa => {
          const exists = merged.some(la => la.id === sa.id);
          if (!exists) merged.push(sa);
        });
        localStorage.setItem('attendances', JSON.stringify(merged));
        console.log('Loaded attendances (merged localStorage + Supabase):', merged.length);
        return merged;
      }
    } catch (error) {
      console.error('Supabase error for attendances, using localStorage:', error);
    }
    console.log('Loaded attendances from localStorage:', localAttendances.length);
    return localAttendances;
  },

  async saveAttendance(attendance) {
    const localData = JSON.parse(localStorage.getItem('attendances') || '[]');
    const attendances = Array.isArray(localData) ? localData : [];
    const existingIndex = attendances.findIndex(a => a.id === attendance.id);
    if (existingIndex >= 0) {
      attendances[existingIndex] = attendance;
    } else {
      attendances.push(attendance);
    }
    localStorage.setItem('attendances', JSON.stringify(attendances));
    try {
      await supabaseSaveAttendance(attendance);
      console.log('Saved attendance to Supabase:', attendance.id);
    } catch (error) {
      console.error('Supabase save error for attendance:', error);
    }
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
