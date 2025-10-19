-- AI CONTENT GENERATION SCHEMA (Queue + Cache)

CREATE TABLE IF NOT EXISTS public.content_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','generating','ready','failed')),
  request_type TEXT NOT NULL CHECK (request_type IN ('mcq','explanation','worksheet','lesson_plan')),
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  skill TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('Easy','Medium','Hard')),
  language TEXT DEFAULT 'en',
  provider_preference TEXT DEFAULT 'auto' CHECK (provider_preference IN ('fast','quality','auto')),
  prompt JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  request_id UUID REFERENCES public.content_requests(id) ON DELETE SET NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('mcq','explanation','worksheet','lesson_plan')),
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  skill TEXT NOT NULL,
  difficulty TEXT,
  language TEXT DEFAULT 'en',
  payload JSONB NOT NULL, -- normalized content
  provider_used TEXT,
  latency_ms INTEGER,
  cached_from BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.content_cache (
  cache_key TEXT PRIMARY KEY,
  content JSONB NOT NULL,
  provider_used TEXT,
  generated_at TIMESTAMPTZ DEFAULT now(),
  ttl_seconds INTEGER DEFAULT 604800 -- 7 days
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_content_requests_status ON public.content_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_items_lookup ON public.content_items (org_id, grade, subject, skill, difficulty);

-- RLS
ALTER TABLE public.content_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_access_content_requests" ON public.content_requests
FOR ALL USING (
  org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "org_access_content_items" ON public.content_items
FOR ALL USING (
  org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
);

-- cache can be shared read-only (no PII) or scoped; start scoped to org
CREATE POLICY "org_access_content_cache" ON public.content_cache
FOR SELECT USING (
  TRUE -- allow read for all authenticated if content is sanitized; tighten if needed
);

DO $$ BEGIN RAISE NOTICE 'AI content schema created'; END $$;