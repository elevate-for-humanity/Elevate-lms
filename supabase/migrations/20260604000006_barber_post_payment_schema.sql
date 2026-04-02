-- Post-payment barber enrollment schema.
-- Adds columns to applications and creates external_course_access for
-- provider credential tracking (Milady and future integrations).

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS enrollment_id      uuid        REFERENCES public.program_enrollments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS milady_status      text        NOT NULL DEFAULT 'not_applicable',
  ADD COLUMN IF NOT EXISTS onboarding_sent_at timestamptz;

-- milady_status values:
--   not_applicable | pending | queued | issued | failed

CREATE TABLE IF NOT EXISTS public.external_course_access (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  student_id         uuid        REFERENCES public.profiles(id)      ON DELETE SET NULL,
  application_id     uuid        REFERENCES public.applications(id)  ON DELETE SET NULL,
  provider           text        NOT NULL,       -- 'milady' | 'nha' | etc.
  provider_user_id   text,
  provider_course_id text,
  access_status      text        NOT NULL DEFAULT 'pending',
  -- pending | issued | failed | revoked
  login_email        text,
  temp_password      text,
  activation_url     text,
  issued_at          timestamptz,
  notes              text
);

CREATE INDEX IF NOT EXISTS idx_eca_student     ON public.external_course_access(student_id);
CREATE INDEX IF NOT EXISTS idx_eca_application ON public.external_course_access(application_id);
CREATE INDEX IF NOT EXISTS idx_eca_provider    ON public.external_course_access(provider);
