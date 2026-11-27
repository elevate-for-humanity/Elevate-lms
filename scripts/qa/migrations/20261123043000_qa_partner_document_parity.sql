-- QA ONLY: restore the two missing Host Shop document reads observed in
-- PR #2769 desktop shard 4. No production data or approvals are copied.
BEGIN;
SET LOCAL search_path = public, pg_catalog;

DO $qa$
BEGIN
  IF to_regclass('private.qa_environment_identity') IS NULL OR
     (SELECT array_agg(project_ref ORDER BY project_ref)
        FROM private.qa_environment_identity)
       IS DISTINCT FROM ARRAY['isdgjcdabhxxozarmxta']::text[] THEN
    RAISE EXCEPTION 'QA partner document parity requires the isolated QA identity';
  END IF;
  IF to_regclass('public.partner_documents') IS NOT NULL OR
     to_regclass('public.partner_document_requirements') IS NOT NULL THEN
    RAISE EXCEPTION 'QA partner document stage refuses existing relations';
  END IF;
  IF to_regclass('public.partner_users') IS NULL OR
     to_regclass('public.partners') IS NULL OR
     to_regprocedure('rpc_private.is_admin()') IS NULL THEN
    RAISE EXCEPTION 'QA partner document prerequisite missing';
  END IF;
END;
$qa$;

-- Structural parity with production, without copying uploads or identities.
CREATE TABLE public.partner_document_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state varchar(50) NOT NULL,
  program_id varchar(50) NOT NULL,
  document_type varchar(50) NOT NULL,
  document_name varchar(100) NOT NULL,
  description text,
  is_required boolean DEFAULT true,
  allowed_file_types text[],
  max_file_size_mb integer DEFAULT 10,
  requires_expiration boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (state, program_id, document_type)
);

CREATE TABLE public.partner_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  file_url text,
  status text DEFAULT 'pending',
  uploaded_at timestamptz DEFAULT now(),
  partner_id uuid NOT NULL REFERENCES public.partners(id),
  document_type varchar(50),
  program_id varchar(50),
  state varchar(50),
  file_name varchar(255),
  reviewed_at timestamptz,
  reviewed_by uuid,
  rejection_reason text,
  expiration_date timestamptz,
  file_type text,
  file_size integer,
  storage_bucket text NOT NULL DEFAULT 'partner-documents',
  notes text
);

CREATE INDEX qa_partner_documents_partner_idx ON public.partner_documents(partner_id);
CREATE INDEX qa_partner_documents_status_idx ON public.partner_documents(status);
CREATE INDEX qa_partner_document_requirements_scope_idx
  ON public.partner_document_requirements(state, program_id);

ALTER TABLE public.partner_document_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_documents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.partner_document_requirements, public.partner_documents
  FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.partner_document_requirements, public.partner_documents TO service_role;
-- Requirement definitions are public templates, not partner documents.
GRANT SELECT ON public.partner_document_requirements TO anon, authenticated;
CREATE POLICY qa_requirement_read ON public.partner_document_requirements
  FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT, INSERT ON public.partner_documents TO authenticated;
CREATE POLICY qa_partner_document_own_read ON public.partner_documents
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.partner_users pu
      WHERE pu.partner_id = partner_documents.partner_id
        AND pu.user_id = (SELECT auth.uid()))
    OR (SELECT rpc_private.is_admin())
  );
CREATE POLICY qa_partner_document_own_pending_insert ON public.partner_documents
  FOR INSERT TO authenticated WITH CHECK (
    status = 'pending' AND reviewed_at IS NULL AND reviewed_by IS NULL
    AND rejection_reason IS NULL
    AND EXISTS (SELECT 1 FROM public.partner_users pu
      WHERE pu.partner_id = partner_documents.partner_id
        AND pu.user_id = (SELECT auth.uid()))
  );

-- Canonical published *requirement definitions* only; no signed documents,
-- application status, funding eligibility, or privileged approval is seeded.
INSERT INTO public.partner_document_requirements
  (state, program_id, document_type, document_name, description,
   is_required, allowed_file_types, requires_expiration)
VALUES
  ('Indiana', 'barber', 'mou', 'Partner MOU', 'Signed Memorandum of Understanding', true, ARRAY['application/pdf'], false),
  ('Indiana', 'barber', 'w9', 'IRS W-9', 'Completed W-9 tax form', true, ARRAY['application/pdf'], false),
  ('Indiana', 'barber', 'business_license', 'Business License', 'Proof of business formation or license', true, ARRAY['application/pdf','image/jpeg','image/png'], false),
  ('Indiana', 'barber', 'insurance_coi', 'Certificate of Insurance', 'Proof of liability insurance', true, ARRAY['application/pdf'], true),
  ('Indiana', 'barber', 'establishment_license', 'Barber Shop License', 'Indiana State Board barber establishment license', true, ARRAY['application/pdf','image/jpeg','image/png'], true),
  ('ALL', 'ALL', 'mou', 'Partner MOU', 'Signed Memorandum of Understanding', true, ARRAY['application/pdf'], false),
  ('ALL', 'ALL', 'w9', 'IRS W-9', 'Completed W-9 tax form', true, ARRAY['application/pdf'], false);
NOTIFY pgrst, 'reload schema';
COMMIT;
