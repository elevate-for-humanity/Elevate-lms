-- ============================================================================
-- CMI (Computer Managed Instruction) - COMPLETE SYSTEM
-- Created: July 7, 2026
-- Purpose: Complete CMI tracking layer for workforce LMS
-- 
-- CMI handles:
-- - Student enrollment records
-- - Course assignments
-- - Lesson completion tracking
-- - Quiz/test scores
-- - Attempts and pass/fail status
-- - Time spent in lessons ("seat time")
-- - Progress percentages
-- - Certificates issued
-- - Instructor reports
-- - Compliance records
-- ============================================================================

-- ============================================================================
-- 1. CMI ENROLLMENTS - Track which students are enrolled in what
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cmi_enrollments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID        NOT NULL REFERENCES public.cmi_students(id) ON DELETE CASCADE,
  program_id      UUID        REFERENCES public.programs(id) ON DELETE SET NULL,
  course_id       UUID        REFERENCES public.courses(id) ON DELETE SET NULL,
  enrolled_by     UUID        REFERENCES public.profiles(id),
  enrolled_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  status          TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'withdrawn')),
  completion_pct  NUMERIC(5,2) DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cmi_enrollments_student ON public.cmi_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_cmi_enrollments_program ON public.cmi_enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_cmi_enrollments_course ON public.cmi_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_cmi_enrollments_status ON public.cmi_enrollments(status);

-- ============================================================================
-- 2. CMI ASSIGNMENTS - What lessons/modules are assigned to students
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cmi_assignments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   UUID        NOT NULL REFERENCES public.cmi_enrollments(id) ON DELETE CASCADE,
  course_id       UUID        REFERENCES public.courses(id) ON DELETE SET NULL,
  module_id       UUID        REFERENCES public.modules(id) ON DELETE SET NULL,
  lesson_id       UUID        REFERENCES public.lessons(id) ON DELETE SET NULL,
  assigned_by     UUID        REFERENCES public.profiles(id),
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date        TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  status          TEXT        NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'overdue')),
  order_index     INTEGER     DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cmi_assignments_enrollment ON public.cmi_assignments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_cmi_assignments_module ON public.cmi_assignments(module_id);
CREATE INDEX IF NOT EXISTS idx_cmi_assignments_lesson ON public.cmi_assignments(lesson_id);

-- ============================================================================
-- 3. CMI LESSON PROGRESS - Track lesson completion
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cmi_lesson_progress (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   UUID        NOT NULL REFERENCES public.cmi_enrollments(id) ON DELETE CASCADE,
  lesson_id       UUID        NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  student_id      UUID        NOT NULL REFERENCES public.cmi_students(id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  completion_pct  NUMERIC(5,2) DEFAULT 0,
  status          TEXT        NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(enrollment_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_cmi_lesson_progress_enrollment ON public.cmi_lesson_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_cmi_lesson_progress_lesson ON public.cmi_lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_cmi_lesson_progress_student ON public.cmi_lesson_progress(student_id);

-- ============================================================================
-- 4. CMI QUIZ SCORES - Track quiz/test results
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cmi_quiz_scores (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   UUID        NOT NULL REFERENCES public.cmi_enrollments(id) ON DELETE CASCADE,
  lesson_id       UUID        REFERENCES public.lessons(id) ON DELETE SET NULL,
  quiz_id         UUID,
  student_id      UUID        NOT NULL REFERENCES public.cmi_students(id) ON DELETE CASCADE,
  score_raw       NUMERIC(5,2),
  score_pct       NUMERIC(5,2),
  passing_score   NUMERIC(5,2) DEFAULT 70,
  passed          BOOLEAN,
  max_score       NUMERIC(5,2),
  time_spent_secs INTEGER,
  taken_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cmi_quiz_scores_enrollment ON public.cmi_quiz_scores(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_cmi_quiz_scores_student ON public.cmi_quiz_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_cmi_quiz_scores_lesson ON public.cmi_quiz_scores(lesson_id);

-- ============================================================================
-- 5. CMI ATTEMPTS - Track multiple attempts at lessons/quizzes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cmi_attempts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   UUID        NOT NULL REFERENCES public.cmi_enrollments(id) ON DELETE CASCADE,
  lesson_id       UUID        REFERENCES public.lessons(id) ON DELETE SET NULL,
  quiz_id         UUID,
  student_id      UUID        NOT NULL REFERENCES public.cmi_students(id) ON DELETE CASCADE,
  attempt_number  INTEGER     NOT NULL DEFAULT 1,
  score_raw       NUMERIC(5,2),
  score_pct       NUMERIC(5,2),
  passed          BOOLEAN,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  time_spent_secs INTEGER,
  responses       JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cmi_attempts_enrollment ON public.cmi_attempts(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_cmi_attempts_student ON public.cmi_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_cmi_attempts_lesson ON public.cmi_attempts(lesson_id);

-- ============================================================================
-- 6. CMI SEAT TIME - Track time spent in lessons
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cmi_seat_time (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   UUID        NOT NULL REFERENCES public.cmi_enrollments(id) ON DELETE CASCADE,
  student_id      UUID        NOT NULL REFERENCES public.cmi_students(id) ON DELETE CASCADE,
  lesson_id       UUID        REFERENCES public.lessons(id) ON DELETE SET NULL,
  date            DATE        NOT NULL,
  seconds_spent   INTEGER     NOT NULL DEFAULT 0,
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cmi_seat_time_enrollment ON public.cmi_seat_time(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_cmi_seat_time_student ON public.cmi_seat_time(student_id);
CREATE INDEX IF NOT EXISTS idx_cmi_seat_time_date ON public.cmi_seat_time(date);

-- ============================================================================
-- 7. CMI PROGRESS - Overall progress tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cmi_progress (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   UUID        NOT NULL REFERENCES public.cmi_enrollments(id) ON DELETE CASCADE,
  student_id      UUID        NOT NULL REFERENCES public.cmi_students(id) ON DELETE CASCADE,
  total_lessons   INTEGER     DEFAULT 0,
  completed_lessons INTEGER   DEFAULT 0,
  total_modules   INTEGER     DEFAULT 0,
  completed_modules INTEGER    DEFAULT 0,
  overall_pct     NUMERIC(5,2) DEFAULT 0,
  total_seat_time INTEGER     DEFAULT 0,
  last_activity   TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(enrollment_id)
);

CREATE INDEX IF NOT EXISTS idx_cmi_progress_enrollment ON public.cmi_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_cmi_progress_student ON public.cmi_progress(student_id);

-- ============================================================================
-- 8. CMI INSTRUCTOR REPORTS - Reports generated by instructors
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cmi_instructor_reports (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID        NOT NULL REFERENCES public.cmi_students(id) ON DELETE CASCADE,
  instructor_id   UUID        NOT NULL REFERENCES public.profiles(id),
  enrollment_id   UUID        REFERENCES public.cmi_enrollments(id) ON DELETE SET NULL,
  report_type     TEXT        NOT NULL,
  report_data     JSONB,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cmi_instructor_reports_student ON public.cmi_instructor_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_cmi_instructor_reports_instructor ON public.cmi_instructor_reports(instructor_id);

-- ============================================================================
-- 9. CMI COMPLIANCE RECORDS - For audits and funding reports
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cmi_compliance_records (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID        NOT NULL REFERENCES public.cmi_students(id) ON DELETE CASCADE,
  enrollment_id   UUID        REFERENCES public.cmi_enrollments(id) ON DELETE SET NULL,
  requirement     TEXT        NOT NULL,
  requirement_type TEXT       NOT NULL,
  met             BOOLEAN     NOT NULL DEFAULT FALSE,
  evidence        JSONB,
  verified_by     UUID        REFERENCES public.profiles(id),
  verified_at     TIMESTAMPTZ,
  due_date        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cmi_compliance_student ON public.cmi_compliance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_cmi_compliance_enrollment ON public.cmi_compliance_records(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_cmi_compliance_met ON public.cmi_compliance_records(met);

-- ============================================================================
-- 10. CMI OUTCOMES - Track completion outcomes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cmi_outcomes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID        NOT NULL REFERENCES public.cmi_students(id) ON DELETE CASCADE,
  enrollment_id   UUID        REFERENCES public.cmi_enrollments(id) ON DELETE SET NULL,
  outcome_type    TEXT        NOT NULL,
  outcome_value   TEXT,
  credential_id   UUID,
  issued_at       TIMESTAMPTZ,
  placed_job      BOOLEAN,
  job_title       TEXT,
  employer        TEXT,
  wages           NUMERIC(10,2),
  placed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cmi_outcomes_student ON public.cmi_outcomes(student_id);
CREATE INDEX IF NOT EXISTS idx_cmi_outcomes_enrollment ON public.cmi_outcomes(enrollment_id);
