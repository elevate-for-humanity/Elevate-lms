-- Practical requirements per lesson.
-- One row per lesson that requires hands-on evidence or skill sign-off.
-- Read by /api/lms/practical-requirements to configure the evidence submission UI.

CREATE TABLE IF NOT EXISTS public.practical_requirements (
  id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id                   uuid NOT NULL UNIQUE,
  practical_type              text NOT NULL DEFAULT 'evidence'
                                CHECK (practical_type IN ('evidence','hours','skill_signoff','combined')),
  required_hours              numeric(6,2),
  required_attempts           integer DEFAULT 1,
  requires_evaluator_approval boolean DEFAULT false,
  requires_skill_signoff      boolean DEFAULT false,
  allowed_submission_modes    text[] DEFAULT ARRAY['text','file'],
  instructions                text,
  rubric_json                 jsonb,
  safety_guidance             text,
  materials_needed            text,
  created_at                  timestamptz DEFAULT now(),
  updated_at                  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pr_lesson_idx ON public.practical_requirements (lesson_id);

COMMENT ON TABLE public.practical_requirements IS
  'Per-lesson practical/evidence requirements. Read by /api/lms/practical-requirements.';
