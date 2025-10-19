-- Migration script for gamification and practice sessions tables
CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject VARCHAR(100) NOT NULL,
  grade VARCHAR(50) NOT NULL,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  reward_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS practice_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES practice_sessions(id) ON DELETE CASCADE,
  question_id VARCHAR(255) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  grade VARCHAR(50) NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option VARCHAR(255) NOT NULL,
  answered_correctly BOOLEAN,
  answered_at TIMESTAMPTZ,
  difficulty DECIMAL(3,2) NOT NULL,
  reward_points_earned INTEGER DEFAULT 0
);

-- Indexes for quick lookups
CREATE INDEX idx_practice_sessions_student ON practice_sessions(student_id);
CREATE INDEX idx_practice_questions_session ON practice_questions(session_id);
