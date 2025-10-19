-- LMS INTEGRATIONS SCHEMA (Google Classroom, Canvas, Moodle)
-- Stores encrypted credentials and sync logs per organization

-- Enable pgcrypto (if not enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Connections table
CREATE TABLE IF NOT EXISTS public.lms_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lms_type TEXT NOT NULL CHECK (lms_type IN ('google_classroom','canvas','moodle')),
  auth_mode TEXT NOT NULL CHECK (auth_mode IN ('oauth','token')),
  client_id TEXT,
  client_secret BYTEA, -- encrypted
  access_token BYTEA,  -- encrypted
  refresh_token BYTEA, -- encrypted
  token_expires_at TIMESTAMPTZ,
  base_url TEXT, -- Canvas/Moodle
  scopes TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected','connected','error')),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, lms_type)
);

-- 2) Sync logs
CREATE TABLE IF NOT EXISTS public.lms_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.lms_connections(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('dry_run','full_sync','delta_sync')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','success','failed')),
  details JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ
);

-- 3) Helper functions to encrypt/decrypt using a shared key
-- Store the key in a secure secret store; set at session time via SET app.kms_key = '...'
CREATE OR REPLACE FUNCTION public.encrypt_text(value TEXT)
RETURNS BYTEA AS $$
DECLARE
  key TEXT := current_setting('app.kms_key', true);
BEGIN
  IF key IS NULL OR key = '' THEN
    RAISE EXCEPTION 'KMS key not set (SET app.kms_key)';
  END IF;
  RETURN pgp_sym_encrypt(value, key, 'cipher-algo=aes256');
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrypt_text(value BYTEA)
RETURNS TEXT AS $$
DECLARE
  key TEXT := current_setting('app.kms_key', true);
BEGIN
  IF key IS NULL OR key = '' THEN
    RAISE EXCEPTION 'KMS key not set (SET app.kms_key)';
  END IF;
  RETURN pgp_sym_decrypt(value, key);
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) RLS
ALTER TABLE public.lms_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_sync_logs ENABLE ROW LEVEL SECURITY;

-- Only admins of the org can access their connections
CREATE POLICY "org_admin_manage_lms_connections" ON public.lms_connections
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
      AND p.org_id = lms_connections.org_id 
      AND p.role IN ('school_admin','district_admin')
  )
);

CREATE POLICY "org_admin_access_lms_logs" ON public.lms_sync_logs
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.lms_connections c
    JOIN public.profiles p ON p.org_id = c.org_id
    WHERE c.id = lms_sync_logs.connection_id
      AND p.id = auth.uid()
      AND p.role IN ('school_admin','district_admin')
  )
);

-- 5) Triggers to update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_lms_connections ON public.lms_connections;
CREATE TRIGGER set_updated_at_lms_connections
BEFORE UPDATE ON public.lms_connections
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Success
DO $$ BEGIN RAISE NOTICE 'LMS schema created'; END $$;