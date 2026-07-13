-- Accreditation tracking system.
-- Replaces the hardcoded 23-item checklist with a DB-driven evidence system.
--
-- Architecture:
--   accreditation_standards   — the checklist items (seeded with real categories)
--   accreditation_evidence    — documents/timestamps proving each standard is met
--   accreditation_reviews     — periodic review records with reviewer + score
--
-- Readiness score = completed standards / total required standards × 100
-- A standard is "complete" when it has at least one accepted evidence row.

-- ── accreditation_standards ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.accreditation_standards (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  category        text        NOT NULL,
    -- 'Documentation' | 'Systems' | 'Compliance' | 'Student Experience'
  name            text        NOT NULL,
  description     text,
  required        boolean     NOT NULL DEFAULT true,
  evidence_types  text[]      NOT NULL DEFAULT '{}',
    -- accepted evidence types: 'document' | 'url' | 'timestamp' | 'attestation'
  admin_link      text,       -- direct admin link to manage this standard
  sort_order      integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Seed with the real accreditation checklist (replaces the hardcoded array)
INSERT INTO public.accreditation_standards
  (category, name, description, required, evidence_types, admin_link, sort_order)
VALUES
  -- Documentation
  ('Documentation', 'Mission Statement',      'Published mission statement accessible to public.',                  true, '{url,document}',      '/about',                    10),
  ('Documentation', 'Program Descriptions',   'Detailed descriptions for all active programs.',                    true, '{url,document}',      '/programs',                 20),
  ('Documentation', 'Course Syllabi',         'Syllabi for all active courses with learning outcomes.',            true, '{document}',          '/admin/curriculum',         30),
  ('Documentation', 'Student Handbook',       'Current student handbook distributed to all enrollees.',           true, '{document,url}',      '/student-handbook',         40),
  ('Documentation', 'Learning Outcomes',      'Documented learning outcomes per program.',                        true, '{document}',          '/admin/curriculum',         50),
  ('Documentation', 'Assessment Methods',     'Assessment methodology documented per course.',                    true, '{document}',          '/admin/curriculum',         60),
  -- Systems
  ('Systems', 'Student Information System',   'SIS operational and tracking all active students.',                true, '{attestation,url}',   '/admin/students',           70),
  ('Systems', 'Learning Management System',   'LMS operational with active course delivery.',                     true, '{attestation,url}',   '/lms',                      80),
  ('Systems', 'Financial Aid Management',     'Financial aid tracking system operational.',                       true, '{attestation}',       '/admin/financial-aid',      90),
  ('Systems', 'Attendance Tracking',          'Attendance recorded for all in-person sessions.',                  true, '{attestation}',       '/admin/attendance',        100),
  ('Systems', 'Outcome Tracking',             'Employment and certification outcomes tracked post-completion.',   true, '{attestation,document}','/admin/outcomes',         110),
  ('Systems', 'ECR Integration',              'Electronic Case Record integration with state workforce system.',  false,'{attestation,url}',   '/admin/integrations',      120),
  ('Systems', 'Hour Tracking Dashboard',      'Unified hour tracking across LMS and in-person sessions.',         false,'{attestation,url}',   '/admin/hours',             130),
  -- Compliance
  ('Compliance', 'FERPA Compliance',          'FERPA policy in place, staff trained, violations log maintained.', true, '{document,attestation}','/admin/ferpa',            140),
  ('Compliance', 'Title IX Compliance',       'Title IX coordinator designated, policy published.',               true, '{document,url}',      '/admin/title-ix',          150),
  ('Compliance', 'ADA Compliance',            'Accessibility accommodations documented and available.',           true, '{document,url}',      '/accessibility',           160),
  ('Compliance', 'State Authorization',       'State operating license current and on file.',                     true, '{document}',          '/admin/licensing',         170),
  ('Compliance', 'WIOA Approval',             'WIOA Eligible Training Provider status current.',                  true, '{document}',          '/admin/wioa',              180),
  ('Compliance', 'Safety Procedures',         'Emergency and safety procedures documented and distributed.',      true, '{document}',          '/student-handbook',        190),
  -- Student Experience
  ('Student Experience', 'Application Process',      'Online application functional and accessible.',             true, '{url,attestation}',   '/apply',                   200),
  ('Student Experience', 'Enrollment Agreements',    'Enrollment agreements signed and stored for all students.', true, '{document,attestation}','/admin/enrollments',      210),
  ('Student Experience', 'Orientation Program',      'Orientation delivered to all new students.',                true, '{attestation,document}','/orientation',            220),
  ('Student Experience', 'Academic Advising',        'Advising available and documented.',                        true, '{attestation}',       '/admin/advising',          230),
  ('Student Experience', 'Career Services',          'Career services offered and outcomes tracked.',             true, '{attestation,document}','/career-services',        240),
  ('Student Experience', 'Welcome Packet',           'Welcome packet delivered to all new enrollees.',            false,'{attestation,document}','/admin/welcome-packets',  250),
  ('Student Experience', 'Elevate LMS SSO Access',   'Single sign-on access configured for all learners.',       false,'{attestation,url}',   '/admin/integrations',      260)
ON CONFLICT DO NOTHING;

-- ── accreditation_evidence ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.accreditation_evidence (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_id     uuid        NOT NULL REFERENCES public.accreditation_standards(id) ON DELETE CASCADE,
  evidence_type   text        NOT NULL CHECK (evidence_type IN ('document','url','timestamp','attestation')),
  title           text        NOT NULL,
  url             text,
  document_path   text,       -- Supabase storage path
  notes           text,
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','accepted','rejected')),
  submitted_by    uuid        REFERENCES auth.users(id),
  reviewed_by     uuid        REFERENCES auth.users(id),
  reviewed_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ae_standard_status
  ON public.accreditation_evidence (standard_id, status);

-- ── accreditation_reviews ─────────────────────────────────────────────────────
-- Periodic review records — each review captures a point-in-time readiness score.
CREATE TABLE IF NOT EXISTS public.accreditation_reviews (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  review_type         text        NOT NULL DEFAULT 'internal'
                                  CHECK (review_type IN ('internal','external','self_study','site_visit')),
  reviewer_id         uuid        REFERENCES auth.users(id),
  reviewer_name       text,       -- external reviewer name if not a system user
  review_date         date        NOT NULL DEFAULT CURRENT_DATE,
  readiness_score     integer     CHECK (readiness_score BETWEEN 0 AND 100),
  standards_complete  integer     NOT NULL DEFAULT 0,
  standards_total     integer     NOT NULL DEFAULT 0,
  notes               text,
  findings            jsonb,      -- structured findings per category
  next_review_date    date,
  status              text        NOT NULL DEFAULT 'draft'
                                  CHECK (status IN ('draft','submitted','accepted')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ── Readiness score view ──────────────────────────────────────────────────────
-- Live readiness score computed from accepted evidence.
CREATE OR REPLACE VIEW public.accreditation_readiness AS
SELECT
  s.category,
  s.id                                                          AS standard_id,
  s.name,
  s.required,
  s.admin_link,
  s.sort_order,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.accreditation_evidence e
      WHERE e.standard_id = s.id AND e.status = 'accepted'
    ) THEN 'complete'
    WHEN EXISTS (
      SELECT 1 FROM public.accreditation_evidence e
      WHERE e.standard_id = s.id AND e.status = 'pending'
    ) THEN 'pending'
    ELSE 'missing'
  END                                                           AS status,
  (SELECT COUNT(*) FROM public.accreditation_evidence e
   WHERE e.standard_id = s.id AND e.status = 'accepted')       AS accepted_evidence_count
FROM public.accreditation_standards s
ORDER BY s.sort_order;

-- ── Readiness summary function ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_accreditation_readiness_summary()
RETURNS TABLE (
  total_required    bigint,
  total_complete    bigint,
  total_pending     bigint,
  total_missing     bigint,
  readiness_score   integer,
  last_review_date  date
) LANGUAGE sql STABLE AS $$
  SELECT
    COUNT(*) FILTER (WHERE s.required = true)                                                AS total_required,
    COUNT(*) FILTER (WHERE s.required = true AND ar.status = 'complete')                     AS total_complete,
    COUNT(*) FILTER (WHERE s.required = true AND ar.status = 'pending')                      AS total_pending,
    COUNT(*) FILTER (WHERE s.required = true AND ar.status = 'missing')                      AS total_missing,
    CASE
      WHEN COUNT(*) FILTER (WHERE s.required = true) = 0 THEN 0
      ELSE ROUND(
        COUNT(*) FILTER (WHERE s.required = true AND ar.status = 'complete')::numeric /
        COUNT(*) FILTER (WHERE s.required = true)::numeric * 100
      )::integer
    END                                                                                       AS readiness_score,
    (SELECT review_date FROM public.accreditation_reviews
     WHERE status = 'accepted' ORDER BY review_date DESC LIMIT 1)                            AS last_review_date
  FROM public.accreditation_standards s
  JOIN public.accreditation_readiness ar ON ar.standard_id = s.id;
$$;

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.accreditation_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accreditation_evidence  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accreditation_reviews   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_accreditation_standards" ON public.accreditation_standards;
DO $$ BEGIN CREATE POLICY "admin_read_accreditation_standards" ON public.accreditation_standards FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP POLICY IF EXISTS "admin_manage_accreditation_standards" ON public.accreditation_standards;
DO $$ BEGIN CREATE POLICY "admin_manage_accreditation_standards" ON public.accreditation_standards FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','super_admin'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP POLICY IF EXISTS "admin_manage_accreditation_evidence" ON public.accreditation_evidence;
DO $$ BEGIN CREATE POLICY "admin_manage_accreditation_evidence" ON public.accreditation_evidence FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP POLICY IF EXISTS "admin_manage_accreditation_reviews" ON public.accreditation_reviews;
DO $$ BEGIN CREATE POLICY "admin_manage_accreditation_reviews" ON public.accreditation_reviews FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','super_admin'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
