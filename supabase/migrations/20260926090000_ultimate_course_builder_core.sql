CREATE TABLE IF NOT EXISTS public.ultimate_course_builds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  profile jsonb NOT NULL,
  status text NOT NULL DEFAULT 'running',
  current_step text,
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ultimate_lesson_builds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id uuid NOT NULL REFERENCES public.ultimate_course_builds(id) ON DELETE CASCADE,
  lesson_key text NOT NULL,
  competency_id text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  artifacts jsonb NOT NULL DEFAULT '{}'::jsonb,
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(build_id, lesson_key)
);

CREATE TABLE IF NOT EXISTS public.ultimate_lesson_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_build_id uuid NOT NULL REFERENCES public.ultimate_lesson_builds(id) ON DELETE CASCADE,
  step text NOT NULL,
  state text NOT NULL DEFAULT 'pending',
  artifacts jsonb NOT NULL DEFAULT '{}'::jsonb,
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  UNIQUE(lesson_build_id, step)
);

CREATE TABLE IF NOT EXISTS public.ultimate_requirement_traceability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id uuid NOT NULL REFERENCES public.ultimate_course_builds(id) ON DELETE CASCADE,
  requirement_id text NOT NULL,
  competency_id text NOT NULL,
  objective_id text NOT NULL,
  instruction_id text,
  demonstration_id text,
  guided_practice_id text,
  independent_practice_id text,
  assessment_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  mastery_rule_id text,
  UNIQUE(build_id, requirement_id, objective_id)
);

CREATE INDEX IF NOT EXISTS ultimate_lesson_builds_build_idx ON public.ultimate_lesson_builds(build_id);
CREATE INDEX IF NOT EXISTS ultimate_lesson_steps_lesson_idx ON public.ultimate_lesson_steps(lesson_build_id);
CREATE INDEX IF NOT EXISTS ultimate_traceability_build_idx ON public.ultimate_requirement_traceability(build_id);

ALTER TABLE public.ultimate_course_builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ultimate_lesson_builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ultimate_lesson_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ultimate_requirement_traceability ENABLE ROW LEVEL SECURITY;
