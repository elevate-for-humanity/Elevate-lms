CREATE TABLE IF NOT EXISTS public.ultimate_objective_mastery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  lesson_id uuid,
  objective_id text NOT NULL,
  state text NOT NULL DEFAULT 'not_started',
  score numeric,
  practical_evidence_approved boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 0,
  remediation_count integer NOT NULL DEFAULT 0,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id, objective_id)
);

CREATE TABLE IF NOT EXISTS public.ultimate_remediation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  lesson_id uuid,
  objective_id text NOT NULL,
  failed_assessment_id text,
  return_to_teaching_cue text,
  different_explanation jsonb,
  different_example jsonb,
  guided_practice jsonb,
  independent_practice jsonb,
  reassessment jsonb,
  status text NOT NULL DEFAULT 'assigned',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS ultimate_mastery_user_course_idx ON public.ultimate_objective_mastery(user_id, course_id);
CREATE INDEX IF NOT EXISTS ultimate_remediation_user_course_idx ON public.ultimate_remediation_events(user_id, course_id);
ALTER TABLE public.ultimate_objective_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ultimate_remediation_events ENABLE ROW LEVEL SECURITY;