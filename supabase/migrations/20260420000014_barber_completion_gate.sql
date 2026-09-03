-- Barber Apprenticeship: Completion Gate
--
-- A student cannot be marked complete unless ALL conditions are true:
--   1. 2000 total hours logged and verified
--   2. Each module meets its minimum hour requirement
--   3. All practical counts met (all 8 categories at count_required)
--   4. All 8 module checkpoints passed (≥ 80%)
--   5. Final exam passed (≥ 80%)
--   6. Instructor final_readiness sign-off exists
--
-- This view is the single enforcement point. The API reads it before
-- issuing any completion certificate or exam authorization.

CREATE OR REPLACE VIEW public.barber_completion_status AS
WITH ledger AS (
  SELECT
    l.user_id,
    l.program_id,
    l.total_hours,
    l.theory_hours,
    l.practical_hours,
    -- Module hour checks against config
    (l.mod1_theory  + l.mod1_practical) >= 200  AS mod1_hours_met,
    (l.mod2_theory  + l.mod2_practical) >= 200  AS mod2_hours_met,
    (l.mod3_theory  + l.mod3_practical) >= 200  AS mod3_hours_met,
    (l.mod4_theory  + l.mod4_practical) >= 800  AS mod4_hours_met,
    (l.mod5_theory  + l.mod5_practical) >= 300  AS mod5_hours_met,
    (l.mod6_theory  + l.mod6_practical) >= 200  AS mod6_hours_met,
    (l.mod7_theory  + l.mod7_practical) >= 100  AS mod7_hours_met,
    (l.mod8_theory  + l.mod8_practical) >= 100  AS mod8_hours_met
  FROM public.barber_hour_ledger l
),
practicals AS (
  SELECT
    user_id,
    program_id,
    COUNT(*) FILTER (WHERE completed_count >= required_count) AS categories_met,
    COUNT(*) AS categories_total
  FROM public.barber_student_practicals
  GROUP BY user_id, program_id
),
signoffs AS (
  SELECT
    user_id,
    program_id,
    COUNT(DISTINCT module_number) FILTER (
      WHERE signoff_type = 'module_competency' AND status = 'approved'
    ) AS modules_signed_off,
    bool_or(signoff_type = 'final_readiness' AND status = 'approved') AS final_signoff
  FROM public.barber_instructor_signoffs
  GROUP BY user_id, program_id
),
checkpoints AS (
  -- checkpoint_scores: user_id, lesson_id, passed, score
  -- Join to course_lessons to get module context via lesson slug
  SELECT
    cs.user_id,
    cl.course_id AS program_id,
    COUNT(*) FILTER (WHERE cs.passed = true) AS checkpoints_passed,
    COUNT(*) AS checkpoints_total
  FROM public.checkpoint_scores cs
  JOIN public.course_lessons cl ON cl.id = cs.lesson_id
  WHERE cl.lesson_type = 'checkpoint'
  GROUP BY cs.user_id, cl.course_id
),
final_exam AS (
  SELECT
    cs.user_id,
    cl.course_id AS program_id,
    bool_or(cs.passed = true AND cs.score >= 80) AS exam_passed
  FROM public.checkpoint_scores cs
  JOIN public.course_lessons cl ON cl.id = cs.lesson_id
  WHERE cl.lesson_type = 'exam'
  GROUP BY cs.user_id, cl.course_id
)
SELECT
  l.user_id,
  l.program_id,

  -- Individual gate results
  l.total_hours                                          AS total_hours,
  (l.total_hours >= 2000)                                AS gate_total_hours,
  (l.mod1_hours_met AND l.mod2_hours_met AND l.mod3_hours_met AND
   l.mod4_hours_met AND l.mod5_hours_met AND l.mod6_hours_met AND
   l.mod7_hours_met AND l.mod8_hours_met)               AS gate_module_hours,
  (COALESCE(p.categories_met, 0) >= 8)                  AS gate_practicals,
  (COALESCE(s.modules_signed_off, 0) >= 8)              AS gate_signoffs,
  COALESCE(s.final_signoff, false)                       AS gate_final_signoff,
  (COALESCE(c.checkpoints_passed, 0) >= 8)              AS gate_checkpoints,
  COALESCE(e.exam_passed, false)                         AS gate_final_exam,

  -- Supporting detail
  COALESCE(p.categories_met, 0)                         AS practicals_met,
  COALESCE(s.modules_signed_off, 0)                     AS modules_signed_off,
  COALESCE(c.checkpoints_passed, 0)                     AS checkpoints_passed,

  -- Master gate: ALL must be true
  (
    l.total_hours >= 2000
    AND l.mod1_hours_met AND l.mod2_hours_met AND l.mod3_hours_met
    AND l.mod4_hours_met AND l.mod5_hours_met AND l.mod6_hours_met
    AND l.mod7_hours_met AND l.mod8_hours_met
    AND COALESCE(p.categories_met, 0) >= 8
    AND COALESCE(s.modules_signed_off, 0) >= 8
    AND COALESCE(s.final_signoff, false)
    AND COALESCE(c.checkpoints_passed, 0) >= 8
    AND COALESCE(e.exam_passed, false)
  ) AS is_complete

FROM ledger l
LEFT JOIN practicals p ON p.user_id = l.user_id AND p.program_id = l.program_id
LEFT JOIN signoffs   s ON s.user_id = l.user_id AND s.program_id = l.program_id
LEFT JOIN checkpoints c ON c.user_id = l.user_id AND c.program_id = l.program_id
LEFT JOIN final_exam  e ON e.user_id = l.user_id AND e.program_id = l.program_id;

-- Completion records (issued only when is_complete = true)
CREATE TABLE IF NOT EXISTS public.barber_completions (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id      uuid         NOT NULL,
  total_hours     numeric(7,2) NOT NULL,
  completed_at    timestamptz  NOT NULL DEFAULT now(),
  issued_by       uuid,        -- admin/system UUID
  certificate_id  uuid,        -- links to program_completion_certificates
  exam_auth_id    uuid,        -- links to exam_funding_authorizations
  notes           text
);

ALTER TABLE public.barber_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Student reads own completion"  ON public.barber_completions;
DROP POLICY IF EXISTS "Service role full completions" ON public.barber_completions;
CREATE POLICY "Student reads own completion"
  ON public.barber_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full completions"
  ON public.barber_completions USING (auth.role() = 'service_role');

