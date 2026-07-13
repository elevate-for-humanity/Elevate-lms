-- ============================================================
-- Job board enhancements + employer directory
-- 20260525000004_job_board_and_employer_directory.sql
-- ============================================================

-- 1. Add workforce-specific columns to job_postings
ALTER TABLE public.job_postings
  ADD COLUMN IF NOT EXISTS is_ojt            BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_apprenticeship BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wotc_eligible     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wioa_approved     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS remote_type       TEXT    CHECK (remote_type IN ('onsite','hybrid','remote')) DEFAULT 'onsite',
  ADD COLUMN IF NOT EXISTS application_url   TEXT,
  ADD COLUMN IF NOT EXISTS external_source   TEXT,   -- 'usajobs' | 'careeronestop' | 'indiana_career_connect' | null
  ADD COLUMN IF NOT EXISTS external_id       TEXT,   -- provider's job ID for dedup
  ADD COLUMN IF NOT EXISTS expires_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by       UUID REFERENCES auth.users(id);

-- Unique constraint to prevent duplicate government feed imports
CREATE UNIQUE INDEX IF NOT EXISTS job_postings_external_source_id
  ON public.job_postings (external_source, external_id)
  WHERE external_source IS NOT NULL AND external_id IS NOT NULL;

-- 2. Add directory-facing columns to employers
ALTER TABLE public.employers
  ADD COLUMN IF NOT EXISTS website_url       TEXT,
  ADD COLUMN IF NOT EXISTS logo_url          TEXT,
  ADD COLUMN IF NOT EXISTS description       TEXT,
  ADD COLUMN IF NOT EXISTS city              TEXT,
  ADD COLUMN IF NOT EXISTS state             TEXT DEFAULT 'IN',
  ADD COLUMN IF NOT EXISTS zip               TEXT,
  ADD COLUMN IF NOT EXISTS is_hiring         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepts_ojt       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepts_apprentices BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wotc_participant  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS listed_in_directory BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ DEFAULT NOW();

-- 3. Public employer directory view — only verified, opted-in employers
CREATE OR REPLACE VIEW public.employer_directory AS
SELECT
  e.id,
  e.business_name,
  e.company_name,
  e.industry,
  e.company_size,
  e.city,
  e.state,
  e.zip,
  e.website_url,
  e.logo_url,
  e.description,
  e.is_hiring,
  e.accepts_ojt,
  e.accepts_apprentices,
  e.wotc_participant,
  e.verified_at,
  COUNT(jp.id) FILTER (WHERE jp.status = 'active') AS active_job_count
FROM public.employers e
LEFT JOIN public.job_postings jp ON jp.employer_id = e.id
WHERE e.approved = true
  AND e.listed_in_directory = true
GROUP BY e.id;

-- 4. Public job board view — active internal + government feed jobs
CREATE OR REPLACE VIEW public.public_job_board AS
SELECT
  jp.id,
  jp.title,
  jp.description,
  jp.location,
  jp.salary_range,
  jp.job_type,
  jp.remote_type,
  jp.is_ojt,
  jp.is_apprenticeship,
  jp.wotc_eligible,
  jp.wioa_approved,
  jp.application_url,
  jp.external_source,
  jp.external_id,
  jp.created_at,
  jp.expires_at,
  -- Employer info
  COALESCE(e.business_name, e.company_name) AS employer_name,
  e.industry,
  e.logo_url,
  e.city AS employer_city,
  e.state AS employer_state
FROM public.job_postings jp
LEFT JOIN public.employers e ON e.id = jp.employer_id
WHERE jp.status = 'active'
  AND (jp.expires_at IS NULL OR jp.expires_at > NOW());

-- 5. government_job_feed table — staging area for USAJobs / CareerOneStop imports
CREATE TABLE IF NOT EXISTS public.government_job_feed (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source          TEXT NOT NULL,          -- 'usajobs' | 'careeronestop' | 'indiana_career_connect'
  external_id     TEXT NOT NULL,
  title           TEXT NOT NULL,
  organization    TEXT,
  location        TEXT,
  salary_range    TEXT,
  job_type        TEXT,
  remote_type     TEXT,
  description     TEXT,
  application_url TEXT NOT NULL,
  posted_at       TIMESTAMPTZ,
  closes_at       TIMESTAMPTZ,
  raw_payload     JSONB,
  imported_at     TIMESTAMPTZ DEFAULT NOW(),
  promoted_to_job_postings BOOLEAN DEFAULT false,
  UNIQUE (source, external_id)
);

-- Index for feed queries
CREATE INDEX IF NOT EXISTS government_job_feed_source_idx ON public.government_job_feed (source, imported_at DESC);
CREATE INDEX IF NOT EXISTS government_job_feed_promoted_idx ON public.government_job_feed (promoted_to_job_postings) WHERE promoted_to_job_postings = false;

-- 6. RLS
ALTER TABLE public.government_job_feed ENABLE ROW LEVEL SECURITY;

-- Public can read government feed
CREATE POLICY "government_job_feed_public_read"
  ON public.government_job_feed FOR SELECT
  USING (true);

-- Only service role can insert/update
CREATE POLICY "government_job_feed_service_write"
  ON public.government_job_feed FOR ALL
  USING (auth.role() = 'service_role');
