-- ANALYTICS: RISK SIGNALS & SCORES SCHEMA (Rules v1; ML-ready)

CREATE TABLE IF NOT EXISTS public.risk_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  time_window TEXT NOT NULL CHECK (time_window IN ('7d','14d','30d')),
  avg_score NUMERIC(5,2) DEFAULT 0,
  quizzes_count INTEGER DEFAULT 0,
  missed_assignments INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ,
  streak_days INTEGER DEFAULT 0,
  topic_mastery JSONB DEFAULT '{}',
  computed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low','medium','high')),
  score NUMERIC(5,2) NOT NULL,
  top_factors JSONB DEFAULT '{}',
  recommended_actions JSONB DEFAULT '{}',
  computed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_risk_scores_org ON public.risk_scores(org_id, risk_level, computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_signals_org ON public.risk_signals(org_id, time_window, computed_at DESC);

ALTER TABLE public.risk_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_access_risk" ON public.risk_signals
FOR ALL USING (
  org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "org_access_risk_scores" ON public.risk_scores
FOR ALL USING (
  org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
);

-- RULES ENGINE (simple, explainable)
CREATE OR REPLACE FUNCTION public.compute_risk_level(avg_score NUMERIC, quizzes_count INT, last_active_at TIMESTAMPTZ, streak_days INT, missed_assignments INT)
RETURNS TEXT AS $$
DECLARE
  inactivity_days INT := CASE WHEN last_active_at IS NULL THEN 999 ELSE EXTRACT(EPOCH FROM (now() - last_active_at))/86400 END;
BEGIN
  IF (avg_score < 60 AND quizzes_count >= 5) OR inactivity_days > 7 OR (streak_days <= 1 AND missed_assignments >= 2) THEN
    RETURN 'high';
  ELSIF (avg_score >= 60 AND avg_score < 75) OR quizzes_count < 3 OR inactivity_days > 3 THEN
    RETURN 'medium';
  ELSE
    RETURN 'low';
  END IF;
END; $$ LANGUAGE plpgsql IMMUTABLE;

DO $$ BEGIN RAISE NOTICE 'Risk analytics schema created'; END $$;