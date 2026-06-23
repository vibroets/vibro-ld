import { getTrainingSchedules as supabaseGetTrainingSchedules, saveTrainingSchedule as supabaseSaveTrainingSchedule, getAttendances, saveAttendance, getQuizzes, saveQuiz, getQuizResults, saveQuizResult, getVideos, saveVideo, getCertificates, saveCertificate, getUsers, saveUser, getAdmins, saveAdmin } from './supabaseService';

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
    try {
      const data = await supabaseGetTrainingSchedules();
      // If Supabase returns empty array, fallback to localStorage
      if (!data || data.length === 0) {
        console.log('Supabase returned empty, falling back to localStorage');
        const localData = JSON.parse(localStorage.getItem('trainingSchedules') || '[]');
        console.log('Loaded from localStorage:', localData);
        return localData;
      }
      return data;
    } catch (error) {
      console.error('Supabase error for trainingSchedules:', error);
      // Fallback to localStorage
      const localData = JSON.parse(localStorage.getItem('trainingSchedules') || '[]');
      console.log('Falling back to localStorage for trainingSchedules:', localData);
      return localData;
    }
  },

  async saveTrainingSchedule(training) {
    // If training is an array, save the entire array to Supabase
    if (Array.isArray(training)) {
      try {
        for (const t of training) {
          await supabaseSaveTrainingSchedule(t);
        }
        // Also save to localStorage as backup
        localStorage.setItem('trainingSchedules', JSON.stringify(training));
        console.log('Saved training schedules to Supabase and localStorage');
        return true;
      } catch (error) {
        console.error('Supabase error for training schedules:', error);
        console.error('Supabase error details:', JSON.stringify(error, null, 2));
        // Fallback to localStorage
        localStorage.setItem('trainingSchedules', JSON.stringify(training));
        console.log('Saved training schedules to localStorage only (Supabase error)');
        return true;
      }
    }
    // For single training, save to Supabase
    try {
      await supabaseSaveTrainingSchedule(training);
      // Also save to localStorage as backup
      localStorage.setItem('trainingSchedules', JSON.stringify(training));
      console.log('Saved training schedule to Supabase and localStorage');
      return true;
    } catch (error) {
      console.error('Supabase error for training schedule:', error);
      console.error('Supabase error details:', JSON.stringify(error, null, 2));
      // Fallback to localStorage
      localStorage.setItem('trainingSchedules', JSON.stringify(training));
      console.log('Saved training schedule to localStorage only (Supabase error)');
      return true;
    }
  },

  // Attendances
  async getAttendances() {
    return this.getData('attendances', getAttendances);
  },

  async saveAttendance(attendance) {
    return this.saveData('attendances', attendance, saveAttendance);
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
    return this.getData('quizResults', getQuizResults);
  },

  async saveQuizResult(result) {
    return this.saveData('quizResults', result, saveQuizResult);
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
