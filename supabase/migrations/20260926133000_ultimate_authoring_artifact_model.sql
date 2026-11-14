CREATE TABLE IF NOT EXISTS public.ultimate_blueprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id uuid NOT NULL REFERENCES public.ultimate_course_builds(id) ON DELETE CASCADE,
  version integer NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','approved','superseded')),
  author_mode text NOT NULL DEFAULT 'AUTOPILOT' CHECK (author_mode IN ('AUTOPILOT','GUIDED','LOCKED')),
  blueprint jsonb NOT NULL,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_by uuid,
  approved_at timestamptz,
  UNIQUE(build_id,version)
);

CREATE TABLE IF NOT EXISTS public.ultimate_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id uuid NOT NULL REFERENCES public.ultimate_course_builds(id) ON DELETE CASCADE,
  lesson_build_id uuid REFERENCES public.ultimate_lesson_builds(id) ON DELETE CASCADE,
  stage text,
  artifact_type text NOT NULL,
  logical_key text NOT NULL,
  current_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(build_id,logical_key)
);

CREATE TABLE IF NOT EXISTS public.ultimate_artifact_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id uuid NOT NULL REFERENCES public.ultimate_artifacts(id) ON DELETE CASCADE,
  version integer NOT NULL,
  parent_version_id uuid REFERENCES public.ultimate_artifact_versions(id),
  content jsonb,
  storage_ref text,
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  qa_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  approval_status text NOT NULL DEFAULT 'unreviewed' CHECK (approval_status IN ('unreviewed','pending','approved','rejected','change_requested')),
  locked boolean NOT NULL DEFAULT false,
  locked_by uuid,
  locked_at timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  change_reason text,
  generated_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(artifact_id,version),
  CHECK (content IS NOT NULL OR storage_ref IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.ultimate_artifact_dependencies (
  artifact_version_id uuid NOT NULL REFERENCES public.ultimate_artifact_versions(id) ON DELETE CASCADE,
  depends_on_version_id uuid NOT NULL REFERENCES public.ultimate_artifact_versions(id) ON DELETE RESTRICT,
  dependency_kind text NOT NULL DEFAULT 'input',
  PRIMARY KEY(artifact_version_id,depends_on_version_id)
);

CREATE TABLE IF NOT EXISTS public.ultimate_review_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_version_id uuid NOT NULL REFERENCES public.ultimate_artifact_versions(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('approve','reject','request_change','lock','unlock','comment')),
  reviewer_id uuid NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ultimate_artifacts_lesson_idx ON public.ultimate_artifacts(lesson_build_id,stage);
CREATE INDEX IF NOT EXISTS ultimate_artifact_versions_artifact_idx ON public.ultimate_artifact_versions(artifact_id,version DESC);
CREATE INDEX IF NOT EXISTS ultimate_artifact_dependencies_upstream_idx ON public.ultimate_artifact_dependencies(depends_on_version_id);
ALTER TABLE public.ultimate_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ultimate_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ultimate_artifact_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ultimate_artifact_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ultimate_review_decisions ENABLE ROW LEVEL SECURITY;