-- Isolated QA contract for the existing PARIS application document routes.
-- Production already has these columns. Never apply this file to production.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DO $qa$
BEGIN
  IF to_regclass('private.qa_environment_identity') IS NULL THEN
    RAISE EXCEPTION 'INDEPENDENT_QA_PROJECT_IDENTITY_REQUIRED';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM private.qa_environment_identity
    WHERE project_ref = 'isdgjcdabhxxozarmxta'
  ) THEN
    RAISE EXCEPTION 'UNAUTHORIZED_QA_PROJECT_IDENTITY';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE slug = 'elevate-lms-qa') THEN
    RAISE EXCEPTION 'ISOLATED_QA_TENANT_REQUIRED';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE id = 'documents' AND public = false AND file_size_limit >= 10485760
  ) THEN
    RAISE EXCEPTION 'PRIVATE_QA_DOCUMENT_BUCKET_REQUIRED';
  END IF;
END;
$qa$;

-- Anonymous applications own documents through their verified opaque resume
-- session until account reconciliation attaches user_id. Existing owner RLS
-- remains unchanged and does not expose null-user documents to other users.
ALTER TABLE public.documents
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS file_size integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS file_size_bytes integer,
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS requirement_id uuid;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS qa_documents_application_owner_idx
  ON public.documents (owner_type, owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.document_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  document_type text NOT NULL,
  is_required boolean NOT NULL DEFAULT true,
  description text,
  instructions text,
  accepted_formats text[] DEFAULT ARRAY['pdf', 'jpg', 'jpeg', 'png'],
  max_file_size integer DEFAULT 10485760,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  program_id uuid,
  name text,
  required boolean DEFAULT true,
  due_stage text DEFAULT 'enrollment'
);
ALTER TABLE public.document_requirements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.document_requirements FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.document_requirements TO service_role;
GRANT SELECT ON public.document_requirements TO authenticated;
DROP POLICY IF EXISTS qa_document_requirements_service ON public.document_requirements;
CREATE POLICY qa_document_requirements_service ON public.document_requirements
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS qa_document_requirements_read ON public.document_requirements;
CREATE POLICY qa_document_requirements_read ON public.document_requirements
  FOR SELECT TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS qa_document_requirements_role_program_idx
  ON public.document_requirements (role, program_id, document_type);

-- Match the existing route's accepted formats while retaining a private bucket
-- and its current owner policies. No documents or applicant records are copied.
UPDATE storage.buckets
SET allowed_mime_types = CASE WHEN allowed_mime_types IS NULL THEN NULL ELSE
  ARRAY(SELECT DISTINCT unnest(allowed_mime_types || ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']))
END
WHERE id = 'documents' AND public = false;

NOTIFY pgrst, 'reload schema';
COMMIT;
