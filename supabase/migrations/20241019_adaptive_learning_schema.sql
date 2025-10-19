-- Edge Functions for Adaptive Learning System
-- Database schema for supporting adaptive learning edge functions

-- Table for storing student skill mastery levels
CREATE TABLE IF NOT EXISTS student_skill_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id VARCHAR(255) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  mastery_level DECIMAL(3,2) CHECK (mastery_level >= 0 AND mastery_level <= 1),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  last_assessment_date TIMESTAMPTZ DEFAULT NOW(),
  practice_count INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_attempts INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  difficulty_progression DECIMAL(3,2) DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, skill_id, subject)
);

-- Table for storing performance data
CREATE TABLE IF NOT EXISTS student_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id VARCHAR(255) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  question_id VARCHAR(255),
  is_correct BOOLEAN NOT NULL,
  response_time_seconds INTEGER,
  difficulty_level DECIMAL(3,2),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  session_id UUID,
  hints_used INTEGER DEFAULT 0,
  attempts_before_correct INTEGER DEFAULT 1
);

-- Table for risk signals
CREATE TABLE IF NOT EXISTS student_risk_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_type VARCHAR(100) NOT NULL, -- 'engagement_drop', 'performance_decline', 'consistency_issues'
  severity VARCHAR(50) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  metadata JSONB,
  intervention_suggested VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE
);

-- Table for engagement tracking
CREATE TABLE IF NOT EXISTS student_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_duration_minutes INTEGER DEFAULT 0,
  questions_attempted INTEGER DEFAULT 0,
  videos_watched INTEGER DEFAULT 0,
  exercises_completed INTEGER DEFAULT 0,
  login_count INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  engagement_score DECIMAL(3,2) DEFAULT 0,
  UNIQUE(student_id, date)
);

-- Table for adaptive content assignments
CREATE TABLE IF NOT EXISTS adaptive_content_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id VARCHAR(255) NOT NULL,
  content_type VARCHAR(100) NOT NULL, -- 'lesson', 'practice', 'assessment', 'remedial'
  skill_id VARCHAR(255) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  priority_level INTEGER DEFAULT 1, -- 1=high, 2=medium, 3=low
  difficulty_level DECIMAL(3,2),
  estimated_duration_minutes INTEGER,
  ai_reasoning TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Table for notifications
CREATE TABLE IF NOT EXISTS student_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES auth.users(id), -- optional parent notification
  notification_type VARCHAR(100) NOT NULL, -- 'progress', 'assignment', 'reminder', 'achievement'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  delivery_channels TEXT[] DEFAULT ARRAY['in_app'], -- 'in_app', 'email', 'sms', 'push'
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB,
  is_sent BOOLEAN DEFAULT FALSE,
  is_read BOOLEAN DEFAULT FALSE
);

-- Enable RLS on all tables
ALTER TABLE student_skill_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_risk_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE adaptive_content_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_skill_mastery
CREATE POLICY "Students can view own mastery" ON student_skill_mastery
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can update own mastery" ON student_skill_mastery
  FOR UPDATE USING (auth.uid() = student_id);

-- RLS policies for student_performance
CREATE POLICY "Students can view own performance" ON student_performance
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own performance" ON student_performance
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- RLS policies for student_risk_signals
CREATE POLICY "Students can view own risk signals" ON student_risk_signals
  FOR SELECT USING (auth.uid() = student_id);

-- RLS policies for student_engagement
CREATE POLICY "Students can view own engagement" ON student_engagement
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can update own engagement" ON student_engagement
  FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own engagement" ON student_engagement
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- RLS policies for adaptive_content_assignments
CREATE POLICY "Students can view own assignments" ON adaptive_content_assignments
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can update own assignments" ON adaptive_content_assignments
  FOR UPDATE USING (auth.uid() = student_id);

-- RLS policies for student_notifications
CREATE POLICY "Students can view own notifications" ON student_notifications
  FOR SELECT USING (auth.uid() = student_id OR auth.uid() = parent_id);

CREATE POLICY "Students can update own notifications" ON student_notifications
  FOR UPDATE USING (auth.uid() = student_id);

-- Indexes for performance optimization
CREATE INDEX idx_student_skill_mastery_student_id ON student_skill_mastery(student_id);
CREATE INDEX idx_student_skill_mastery_skill ON student_skill_mastery(skill_id, subject);
CREATE INDEX idx_student_performance_student_id ON student_performance(student_id);
CREATE INDEX idx_student_performance_skill ON student_performance(skill_id, subject);
CREATE INDEX idx_student_performance_timestamp ON student_performance(timestamp DESC);
CREATE INDEX idx_student_risk_signals_student_id ON student_risk_signals(student_id);
CREATE INDEX idx_student_risk_signals_active ON student_risk_signals(is_active, detected_at DESC);
CREATE INDEX idx_student_engagement_student_date ON student_engagement(student_id, date DESC);
CREATE INDEX idx_adaptive_assignments_student_active ON adaptive_content_assignments(student_id, is_active, assigned_at DESC);
CREATE INDEX idx_notifications_student_scheduled ON student_notifications(student_id, scheduled_for DESC);
CREATE INDEX idx_notifications_unsent ON student_notifications(is_sent, scheduled_for) WHERE is_sent = FALSE;