-- Isolated-QA schema parity for the live learner career-match profile read.
-- Production already has public.resumes; this file MUST NOT run there.
BEGIN;
SET LOCAL search_path = public, pg_catalog;

DO $qa$
BEGIN
  IF to_regclass('private.qa_environment_identity') IS NULL THEN
    RAISE EXCEPTION 'QA learner resumes requires the isolated QA identity';
  END IF;
  IF (SELECT array_agg(project_ref) FROM private.qa_environment_identity)
       IS DISTINCT FROM ARRAY['isdgjcdabhxxozarmxta']::text[] THEN
    RAISE EXCEPTION 'QA learner resumes refused outside isolated QA';
  END IF;
  IF to_regclass('public.resumes') IS NOT NULL THEN
    RAISE EXCEPTION 'QA learner resumes preflight: relation already exists';
  END IF;
END;
$qa$;

-- Mirror the production table contract needed by getLearnerCareerMatches.
CREATE TABLE public.resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resume_data jsonb,
  user_id uuid
);
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.resumes FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resumes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resumes TO authenticated;
CREATE POLICY qa_resumes_select_own ON public.resumes FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY qa_resumes_insert_own ON public.resumes FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY qa_resumes_update_own ON public.resumes FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY qa_resumes_delete_own ON public.resumes FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

NOTIFY pgrst, 'reload schema';
COMMIT;
