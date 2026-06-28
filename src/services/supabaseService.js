import { supabase } from '../supabaseConfig';

// Users
export const getUsers = async () => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    password: u.password,
    designation: u.designation,
    isAdmin: u.is_admin,
    isSuperAdmin: u.is_super_admin,
    moduleAccess: u.module_access,
    createdAt: u.created_at,
    updatedAt: u.updated_at
  }));
};

export const saveUser = async (user) => {
  const supabaseUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    password: user.password,
    designation: user.designation,
    is_admin: user.isAdmin,
    is_super_admin: user.isSuperAdmin,
    module_access: user.moduleAccess,
    created_at: user.createdAt || new Date().toISOString(),
    updated_at: user.updatedAt || new Date().toISOString()
  };
  const { data, error } = await supabase
    .from('users')
    .upsert(supabaseUser, { onConflict: 'id' });
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
  return data.map(a => ({
    id: a.id,
    name: a.name,
    email: a.email,
    password: a.password,
    isAdmin: a.is_admin,
    isSuperAdmin: a.is_super_admin,
    moduleAccess: a.module_access,
    createdAt: a.created_at,
    updatedAt: a.updated_at
  }));
};

export const saveAdmin = async (admin) => {
  const supabaseAdmin = {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    password: admin.password,
    is_admin: admin.isAdmin,
    is_super_admin: admin.isSuperAdmin,
    module_access: admin.moduleAccess,
    created_at: admin.createdAt || new Date().toISOString(),
    updated_at: admin.updatedAt || new Date().toISOString()
  };
  const { data, error } = await supabase
    .from('admins')
    .upsert(supabaseAdmin, { onConflict: 'id' });
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
    start_time: training.startTime || null,
    end_time: training.endTime || null,
    venue: training.venue || null,
    trainer: training.trainer || null,
    participants: training.participants || null,
    description: training.description || null,
    start_date: training.startDate || null,
    end_date: training.endDate || null,
    data: training,
    created_at: training.createdAt || new Date().toISOString(),
    updated_at: training.updatedAt || new Date().toISOString()
  };
  const { data, error } = await supabase
    .from('training_schedules')
    .upsert(supabaseData, { onConflict: 'id' });
  if (error) {
    // Fallback: try without data column (schema may not have it yet)
    const basicData = { 
      id: training.id, 
      title: training.title,
      start_time: training.startTime || null,
      end_time: training.endTime || null,
      venue: training.venue || null,
      trainer: training.trainer || null,
      participants: training.participants || null,
      description: training.description || null,
      start_date: training.startDate || null,
      end_date: training.endDate || null,
      created_at: training.createdAt || new Date().toISOString(), 
      updated_at: training.updatedAt || new Date().toISOString() 
    };
    const { data: data2, error: error2 } = await supabase
      .from('training_schedules')
      .upsert(basicData, { onConflict: 'id' });
    if (error2) throw error2;
    return data2;
  }
  return data;
};

export const saveAllTrainingSchedules = async (trainings) => {
  if (!Array.isArray(trainings) || trainings.length === 0) return;
  const rows = trainings.map(t => ({
    id: t.id,
    title: t.title,
    start_time: t.startTime || null,
    end_time: t.endTime || null,
    venue: t.venue || null,
    trainer: t.trainer || null,
    participants: t.participants || null,
    description: t.description || null,
    start_date: t.startDate || null,
    end_date: t.endDate || null,
    data: t,
    created_at: t.createdAt || new Date().toISOString(),
    updated_at: t.updatedAt || new Date().toISOString()
  }));
  const { data, error } = await supabase
    .from('training_schedules')
    .upsert(rows, { onConflict: 'id' });
  if (error) {
    // Fallback: try without data column
    const basicRows = trainings.map(t => ({ 
      id: t.id, 
      title: t.title,
      start_time: t.startTime || null,
      end_time: t.endTime || null,
      venue: t.venue || null,
      trainer: t.trainer || null,
      participants: t.participants || null,
      description: t.description || null,
      start_date: t.startDate || null,
      end_date: t.endDate || null,
      created_at: t.createdAt || new Date().toISOString(), 
      updated_at: t.updatedAt || new Date().toISOString() 
    }));
    const { data: data2, error: error2 } = await supabase
      .from('training_schedules')
      .upsert(basicRows, { onConflict: 'id' });
    if (error2) throw error2;
    return data2;
  }
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
  // Try with full data column first
  const supabaseData = {
    id: attendance.id,
    training_id: attendance.trainingId || attendance.training_id,
    user_id: attendance.userId || attendance.user_id,
    status: attendance.status,
    data: attendance,
  };
  const { data, error } = await supabase
    .from('attendances')
    .upsert(supabaseData, { onConflict: 'id' });
  if (error) {
    // Fallback: try without data/training_id/user_id columns (basic schema)
    const basicData = { id: attendance.id, status: attendance.status };
    const { data: data2, error: error2 } = await supabase
      .from('attendances')
      .upsert(basicData, { onConflict: 'id' });
    if (error2) throw error2;
    return data2;
  }
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
    created_at: enrollment.createdAt || new Date().toISOString(),
    updated_at: enrollment.updatedAt || new Date().toISOString()
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
  const supabaseQuiz = {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    created_at: quiz.createdAt || new Date().toISOString(),
    updated_at: quiz.updatedAt || new Date().toISOString()
  };
  const { data, error } = await supabase
    .from('quizzes')
    .upsert(supabaseQuiz, { onConflict: 'id' });
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
  return data.map(r => ({
    id: r.id,
    quizId: r.quiz_id,
    userId: r.user_id,
    userName: r.user_name,
    score: r.score,
    total: r.total,
    percentage: r.percentage,
    status: r.status,
    answers: r.answers,
    completedAt: r.completed_at
  }));
};

export const saveQuizResult = async (result) => {
  const supabaseResult = {
    id: result.id,
    quiz_id: result.quizId,
    user_id: result.userId,
    user_name: result.userName,
    score: result.score,
    total: result.total,
    percentage: result.percentage,
    status: result.status,
    answers: result.answers,
    completed_at: result.completedAt || new Date().toISOString()
  };
  const { data, error } = await supabase
    .from('quiz_results')
    .upsert(supabaseResult, { onConflict: 'id' });
  if (error) throw error;
  return data;
};

// Videos
export const getVideos = async () => {
  const { data, error } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(v => ({
    id: v.id,
    title: v.title,
    description: v.description,
    url: v.url,
    thumbnail: v.thumbnail,
    duration: v.duration,
    selectedUsers: v.selected_users,
    sharedWith: v.shared_with,
    createdBy: v.created_by,
    createdAt: v.created_at,
    updatedAt: v.updated_at
  }));
};

export const saveVideo = async (video) => {
  const supabaseVideo = {
    id: video.id,
    title: video.title,
    description: video.description,
    url: video.url,
    thumbnail: video.thumbnail,
    duration: video.duration,
    selected_users: video.selectedUsers,
    shared_with: video.sharedWith,
    created_by: video.createdBy,
    created_at: video.createdAt || new Date().toISOString(),
    updated_at: video.updatedAt || new Date().toISOString()
  };
  const { data, error } = await supabase
    .from('videos')
    .upsert(supabaseVideo, { onConflict: 'id' });
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
  return data.map(p => ({
    id: p.id,
    userId: p.user_id,
    videoId: p.video_id,
    progress: p.progress,
    completed: p.completed,
    lastPosition: p.last_position,
    updatedAt: p.updated_at
  }));
};

export const saveVideoProgress = async (progress) => {
  const supabaseProgress = {
    id: progress.id,
    user_id: progress.userId,
    video_id: progress.videoId,
    progress: progress.progress,
    completed: progress.completed,
    last_position: progress.lastPosition,
    updated_at: progress.updatedAt || new Date().toISOString()
  };
  const { data, error } = await supabase
    .from('video_progress')
    .upsert(supabaseProgress, { onConflict: 'id' });
  if (error) throw error;
  return data;
};

// Certificates
export const getCertificates = async (userId) => {
  const { data, error } = await supabase.from('certificates').select('*').eq('user_id', userId);
  if (error) throw error;
  return data.map(c => ({
    id: c.id,
    userId: c.user_id,
    quizId: c.quiz_id,
    videoId: c.video_id,
    trainingId: c.training_id,
    certificateUrl: c.certificate_url,
    issuedAt: c.issued_at
  }));
};

export const saveCertificate = async (certificate) => {
  const supabaseCertificate = {
    id: certificate.id,
    user_id: certificate.userId,
    quiz_id: certificate.quizId,
    video_id: certificate.videoId,
    training_id: certificate.trainingId,
    certificate_url: certificate.certificateUrl,
    issued_at: certificate.issuedAt || new Date().toISOString()
  };
  const { data, error } = await supabase
    .from('certificates')
    .upsert(supabaseCertificate, { onConflict: 'id' });
  if (error) throw error;
  return data;
};
