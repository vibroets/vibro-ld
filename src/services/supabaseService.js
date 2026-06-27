import { supabase } from '../supabaseConfig';

// Users
export const getUsers = async () => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data;
};

export const saveUser = async (user) => {
  const { data, error } = await supabase
    .from('users')
    .upsert(user, { onConflict: 'id' });
  if (error) throw error;
  return data;
};

export const deleteUser = async (userId) => {
  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) throw error;
};

// Admins
export const getAdmins = async () => {
  const { data, error } = await supabase.from('admins').select('*');
  if (error) throw error;
  return data;
};

export const saveAdmin = async (admin) => {
  const { data, error } = await supabase
    .from('admins')
    .upsert(admin, { onConflict: 'id' });
  if (error) throw error;
  return data;
};

// Training Schedules
export const getTrainingSchedules = async () => {
  const { data, error } = await supabase.from('training_schedules').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  // If rows have a 'data' JSONB column, return those; otherwise return mapped rows
  return data.map(item => {
    if (item.data && typeof item.data === 'object') {
      return { ...item.data, id: item.id, status: item.status || item.data.status };
    }
    return { ...item, createdAt: item.created_at, updatedAt: item.updated_at };
  });
};

export const saveTrainingSchedule = async (training) => {
  const supabaseData = {
    id: training.id,
    title: training.title,
    status: training.status,
    data: training, // Store full training object as JSONB
    created_at: training.createdAt || new Date().toISOString(),
    updated_at: training.updatedAt || new Date().toISOString()
  };
  const { data, error } = await supabase
    .from('training_schedules')
    .upsert(supabaseData, { onConflict: 'id' });
  if (error) throw error;
  return data;
};

export const saveAllTrainingSchedules = async (trainings) => {
  if (!Array.isArray(trainings) || trainings.length === 0) return;
  const rows = trainings.map(t => ({
    id: t.id,
    title: t.title,
    status: t.status,
    data: t,
    created_at: t.createdAt || new Date().toISOString(),
    updated_at: t.updatedAt || new Date().toISOString()
  }));
  const { data, error } = await supabase
    .from('training_schedules')
    .upsert(rows, { onConflict: 'id' });
  if (error) throw error;
  return data;
};

export const deleteTrainingSchedule = async (trainingId) => {
  const { error } = await supabase.from('training_schedules').delete().eq('id', trainingId);
  if (error) throw error;
};

// Attendances
export const getAttendances = async () => {
  const { data, error } = await supabase.from('attendances').select('*');
  if (error) throw error;
  return data.map(item => {
    if (item.data && typeof item.data === 'object') {
      return { ...item.data, id: item.id };
    }
    return item;
  });
};

export const saveAttendance = async (attendance) => {
  const supabaseData = {
    id: attendance.id,
    training_id: attendance.trainingId,
    user_id: attendance.userId,
    status: attendance.status,
    data: attendance,
  };
  const { data, error } = await supabase
    .from('attendances')
    .upsert(supabaseData, { onConflict: 'id' });
  if (error) throw error;
  return data;
};

// Enrollments
export const getEnrollments = async () => {
  const { data, error } = await supabase.from('enrollments').select('*');
  if (error) throw error;
  return data.map(item => item.data && typeof item.data === 'object' ? { ...item.data, id: item.id } : item);
};

export const saveEnrollment = async (enrollment) => {
  const supabaseData = {
    id: enrollment.id,
    content_id: enrollment.contentId,
    participant_id: enrollment.participantId,
    status: enrollment.status,
    data: enrollment,
  };
  const { data, error } = await supabase
    .from('enrollments')
    .upsert(supabaseData, { onConflict: 'id' });
  if (error) throw error;
  return data;
};

// Quizzes
export const getQuizzes = async () => {
  const { data, error } = await supabase.from('quizzes').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const saveQuiz = async (quiz) => {
  const { data, error } = await supabase
    .from('quizzes')
    .upsert(quiz, { onConflict: 'id' });
  if (error) throw error;
  return data;
};

export const deleteQuiz = async (quizId) => {
  const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
  if (error) throw error;
};

// Quiz Results
export const getQuizResults = async () => {
  const { data, error } = await supabase.from('quiz_results').select('*');
  if (error) throw error;
  return data;
};

export const saveQuizResult = async (result) => {
  const { data, error } = await supabase
    .from('quiz_results')
    .upsert(result, { onConflict: 'id' });
  if (error) throw error;
  return data;
};

// Videos
export const getVideos = async () => {
  const { data, error } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const saveVideo = async (video) => {
  const { data, error } = await supabase
    .from('videos')
    .upsert(video, { onConflict: 'id' });
  if (error) throw error;
  return data;
};

export const deleteVideo = async (videoId) => {
  const { error } = await supabase.from('videos').delete().eq('id', videoId);
  if (error) throw error;
};

// Video Progress
export const getVideoProgress = async (userId) => {
  const { data, error } = await supabase.from('video_progress').select('*').eq('user_id', userId);
  if (error) throw error;
  return data;
};

export const saveVideoProgress = async (progress) => {
  const { data, error } = await supabase
    .from('video_progress')
    .upsert(progress, { onConflict: 'id' });
  if (error) throw error;
  return data;
};

// Certificates
export const getCertificates = async (userId) => {
  const { data, error } = await supabase.from('certificates').select('*').eq('user_id', userId);
  if (error) throw error;
  return data;
};

export const saveCertificate = async (certificate) => {
  const { data, error } = await supabase
    .from('certificates')
    .upsert(certificate, { onConflict: 'id' });
  if (error) throw error;
  return data;
};
