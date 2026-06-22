-- Create users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT UNIQUE,
  password TEXT,
  designation TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_super_admin BOOLEAN DEFAULT FALSE,
  module_access JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admins table
CREATE TABLE admins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT TRUE,
  is_super_admin BOOLEAN DEFAULT FALSE,
  module_access JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create training_schedules table
CREATE TABLE training_schedules (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date TEXT,
  end_date TEXT,
  start_time TEXT,
  end_time TEXT,
  venue TEXT,
  trainer TEXT,
  participants JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendances table
CREATE TABLE attendances (
  id TEXT PRIMARY KEY,
  training_id TEXT REFERENCES training_schedules(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT,
  status TEXT DEFAULT 'present',
  check_in_time TIMESTAMP WITH TIME ZONE,
  location JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quizzes table
CREATE TABLE quizzes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB,
  passing_score INTEGER,
  created_by TEXT,
  selected_users JSONB,
  shared_with JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz_results table
CREATE TABLE quiz_results (
  id TEXT PRIMARY KEY,
  quiz_id TEXT REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT,
  score INTEGER,
  total INTEGER,
  percentage FLOAT,
  status TEXT,
  answers JSONB,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create videos table
CREATE TABLE videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  thumbnail TEXT,
  duration TEXT,
  selected_users JSONB,
  shared_with JSONB,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create video_progress table
CREATE TABLE video_progress (
  id TEXT PRIMARY KEY,
  video_id TEXT REFERENCES videos(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  last_watched TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create certificates table
CREATE TABLE certificates (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  quiz_id TEXT REFERENCES quizzes(id) ON DELETE CASCADE,
  video_id TEXT REFERENCES videos(id) ON DELETE CASCADE,
  training_id TEXT REFERENCES training_schedules(id) ON DELETE CASCADE,
  certificate_url TEXT,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for development - adjust for production)
CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON users FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON users FOR DELETE USING (true);

CREATE POLICY "Enable read access for all admins" ON admins FOR SELECT USING (true);
CREATE POLICY "Enable insert for all admins" ON admins FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all admins" ON admins FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all admins" ON admins FOR DELETE USING (true);

CREATE POLICY "Enable read access for all training_schedules" ON training_schedules FOR SELECT USING (true);
CREATE POLICY "Enable insert for all training_schedules" ON training_schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all training_schedules" ON training_schedules FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all training_schedules" ON training_schedules FOR DELETE USING (true);

CREATE POLICY "Enable read access for all attendances" ON attendances FOR SELECT USING (true);
CREATE POLICY "Enable insert for all attendances" ON attendances FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all attendances" ON attendances FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all attendances" ON attendances FOR DELETE USING (true);

CREATE POLICY "Enable read access for all quizzes" ON quizzes FOR SELECT USING (true);
CREATE POLICY "Enable insert for all quizzes" ON quizzes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all quizzes" ON quizzes FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all quizzes" ON quizzes FOR DELETE USING (true);

CREATE POLICY "Enable read access for all quiz_results" ON quiz_results FOR SELECT USING (true);
CREATE POLICY "Enable insert for all quiz_results" ON quiz_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all quiz_results" ON quiz_results FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all quiz_results" ON quiz_results FOR DELETE USING (true);

CREATE POLICY "Enable read access for all videos" ON videos FOR SELECT USING (true);
CREATE POLICY "Enable insert for all videos" ON videos FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all videos" ON videos FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all videos" ON videos FOR DELETE USING (true);

CREATE POLICY "Enable read access for all video_progress" ON video_progress FOR SELECT USING (true);
CREATE POLICY "Enable insert for all video_progress" ON video_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all video_progress" ON video_progress FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all video_progress" ON video_progress FOR DELETE USING (true);

CREATE POLICY "Enable read access for all certificates" ON certificates FOR SELECT USING (true);
CREATE POLICY "Enable insert for all certificates" ON certificates FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all certificates" ON certificates FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all certificates" ON certificates FOR DELETE USING (true);
