-- Adaptive Learning Extensions for ALFANUMRIK
-- ===========================================
-- Step 1: Create student skill mastery table
CREATE TABLE IF NOT EXISTS public.student_skill_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL, -- reference to a skill/topic
  mastery_level NUMERIC(3,2) DEFAULT 0.0, -- 0 to 1 scale
  last_assessed TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_student_skill UNIQUE (student_id, skill_id)
);

-- Step 2: Improve study_goals table for adaptive goals
ALTER TABLE public.study_goals
  ADD COLUMN IF NOT EXISTS parent_goal_id UUID REFERENCES public.study_goals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS progress_state TEXT DEFAULT 'not_started' CHECK (progress_state IN ('not_started','in_progress','completed','skipped'));

-- Step 3: Create engagement tracking
CREATE TABLE IF NOT EXISTS public.student_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- e.g., 'practice', 'quiz', 'video_view', 'login'
  activity_details JSONB,
  activity_date TIMESTAMPTZ DEFAULT now()
);

-- Step 4: Indexes
CREATE INDEX IF NOT EXISTS idx_mastery_student_skill ON public.student_skill_mastery(student_id, skill_id);
CREATE INDEX IF NOT EXISTS idx_engagement_student_date ON public.student_engagement(student_id, activity_date DESC);

-- Step 5: Triggers for update timestamps
CREATE OR REPLACE FUNCTION update_skill_mastery_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_mastery_timestamp ON public.student_skill_mastery;
CREATE TRIGGER trigger_update_mastery_timestamp
BEFORE UPDATE ON public.student_skill_mastery
FOR EACH ROW EXECUTE PROCEDURE update_skill_mastery_timestamp();

-- Success notice
DO $$ BEGIN
  RAISE NOTICE 'Adaptive learning extensions created';
END $$;