-- ORG THEME & CUSTOM DOMAINS SCHEMA

CREATE TABLE IF NOT EXISTS public.org_themes (
  org_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#2563EB',
  secondary_color TEXT DEFAULT '#7C3AED',
  accent_color TEXT DEFAULT '#10B981',
  font_family TEXT DEFAULT 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  border_radius TEXT DEFAULT '0.5rem',
  shadows_level TEXT DEFAULT 'md',
  email_header_logo_url TEXT,
  email_footer_text TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.org_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  domain TEXT UNIQUE NOT NULL,
  verification_token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_dns' CHECK (status IN ('pending_dns','verifying','active','failed')),
  certificate_status TEXT NOT NULL DEFAULT 'none' CHECK (certificate_status IN ('none','provisioning','active','error')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.org_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_admin_themes" ON public.org_themes
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.org_id = org_themes.org_id AND p.role IN ('school_admin','district_admin')
  )
);

CREATE POLICY "org_admin_domains" ON public.org_domains
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.org_id = org_domains.org_id AND p.role IN ('school_admin','district_admin')
  )
);

DO $$ BEGIN RAISE NOTICE 'Theme & Domains schema created'; END $$;