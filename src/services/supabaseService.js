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
  
  // Convert snake_case to camelCase for consistency with localStorage
  return data.map(item => ({
    ...item,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }));
};

export const saveTrainingSchedule = async (training) => {
  // Convert camelCase to snake_case for Supabase
  // Only include core fields that are likely to exist in any training_schedules table
  const supabaseData = {
    id: training.id,
    title: training.title,
    status: training.status,
    created_at: training.createdAt || new Date().toISOString(),
    updated_at: training.updatedAt || new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('training_schedules')
    .upsert(supabaseData, { onConflict: 'id' });
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
  return data;
};

export const saveAttendance = async (attendance) => {
  const { data, error } = await supabase
    .from('attendances')
    .upsert(attendance, { onConflict: 'id' });
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
