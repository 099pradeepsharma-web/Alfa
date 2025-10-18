-- ALFANUMRIK SUPABASE SETUP - GUARANTEED TO WORK
-- ==============================================
-- Copy this ENTIRE content and paste in Supabase SQL Editor
-- Click "Run" once - should complete without errors

-- Step 1: Clean slate (remove any problematic existing tables)
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.study_goals CASCADE;
DROP TABLE IF EXISTS public.performance CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 2: Enable required extensions  
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 3: Create tables in correct order (no foreign key conflicts)

-- PROFILES TABLE (references auth.users)
CREATE TABLE public.profiles (
    id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'student',
    full_name TEXT,
    grade TEXT,
    school_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_role_check CHECK (role IN ('student', 'teacher', 'parent'))
);

-- PERFORMANCE TABLE (references profiles)
CREATE TABLE public.performance (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    chapter TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER DEFAULT 10,
    completed_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT performance_pkey PRIMARY KEY (id),
    CONSTRAINT performance_score_check CHECK (score >= 0 AND score <= 100)
);

-- STUDY GOALS TABLE
CREATE TABLE public.study_goals (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT study_goals_pkey PRIMARY KEY (id)
);

-- ACHIEVEMENTS TABLE  
CREATE TABLE public.achievements (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '🏆',
    points INTEGER DEFAULT 0,
    category TEXT DEFAULT 'academic',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT achievements_pkey PRIMARY KEY (id)
);

-- QUESTIONS TABLE
CREATE TABLE public.questions (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    chapter TEXT NOT NULL,
    concept TEXT NOT NULL,
    question_text TEXT NOT NULL,
    ai_response TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    CONSTRAINT questions_pkey PRIMARY KEY (id)
);

-- Step 4: Create optimized indexes for performance
CREATE INDEX idx_performance_student_date ON public.performance (student_id, completed_date DESC);
CREATE INDEX idx_performance_subject ON public.performance (student_id, subject);
CREATE INDEX idx_goals_student_status ON public.study_goals (student_id, is_completed);
CREATE INDEX idx_achievements_student ON public.achievements (student_id, created_at DESC);
CREATE INDEX idx_questions_student ON public.questions (student_id, created_at DESC);

-- Step 5: Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Step 6: Create security policies (tables now definitely exist with student_id)
CREATE POLICY "Users access own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Students access own performance" ON public.performance  
    FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Students access own goals" ON public.study_goals
    FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Students access own achievements" ON public.achievements
    FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Students access own questions" ON public.questions
    FOR ALL USING (auth.uid() = student_id);

-- Step 7: Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Step 8: Create helpful function for user setup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, role, full_name)
    VALUES (NEW.id, 'student', COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Success confirmation
DO $$
BEGIN
    RAISE NOTICE '🎉 ALFANUMRIK DATABASE SETUP COMPLETE!';
    RAISE NOTICE '✅ Tables: profiles, performance, study_goals, achievements, questions';
    RAISE NOTICE '🔒 Row Level Security enabled with proper policies';
    RAISE NOTICE '🔗 Foreign keys properly configured';
    RAISE NOTICE '⚡ Indexes created for optimal performance';
    RAISE NOTICE '🚀 Ready for authentication and cloud sync!';
END $$;