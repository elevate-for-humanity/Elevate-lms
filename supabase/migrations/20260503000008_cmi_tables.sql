-- CMI (Choice Medical Institute) operational tables.
-- School Code: #015188
--
-- CNA students route to CMI after application approval.
-- Separate from the LMS engine — CMI is partner-delivered.

-- ── cmi_students ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cmi_students (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  application_id UUID        REFERENCES public.applications(id) ON DELETE SET NULL,
  cohort         TEXT,
  status         TEXT        NOT NULL DEFAULT 'enrolled',
  enrolled_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One application → one CMI student. Prevents double-enrollment.
CREATE UNIQUE INDEX IF NOT EXISTS idx_cmi_students_application
  ON public.cmi_students(application_id);

CREATE INDEX IF NOT EXISTS idx_cmi_students_user_id
  ON public.cmi_students(user_id);

-- ── cmi_attendance ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cmi_attendance (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID    NOT NULL REFERENCES public.cmi_students(id) ON DELETE CASCADE,
  date       DATE    NOT NULL,
  present    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_cmi_attendance_student_id
  ON public.cmi_attendance(student_id);

-- ── cmi_clinicals ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cmi_clinicals (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID    NOT NULL REFERENCES public.cmi_students(id) ON DELETE CASCADE,
  site       TEXT,
  hours      INTEGER NOT NULL DEFAULT 0,
  approved   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cmi_clinicals_student_id
  ON public.cmi_clinicals(student_id);

-- ── cmi_competencies ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cmi_competencies (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID    NOT NULL REFERENCES public.cmi_students(id) ON DELETE CASCADE,
  skill      TEXT    NOT NULL,
  passed     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, skill)
);

CREATE INDEX IF NOT EXISTS idx_cmi_competencies_student_id
  ON public.cmi_competencies(student_id);

-- ── cmi_certificates ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cmi_certificates (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID        NOT NULL REFERENCES public.cmi_students(id) ON DELETE CASCADE,
  issued_by  TEXT        NOT NULL DEFAULT 'CMI',
  issued_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id)
);

CREATE INDEX IF NOT EXISTS idx_cmi_certificates_student_id
  ON public.cmi_certificates(student_id);

-- ── Verify ───────────────────────────────────────────────────────────────────
-- SELECT tablename FROM pg_tables
-- WHERE schemaname = 'public' AND tablename LIKE 'cmi_%'
-- ORDER BY tablename;
