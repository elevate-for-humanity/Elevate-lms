-- QA ONLY: isolated Supabase project isdgjcdabhxxozarmxta.
-- Narrow repair for Program Holder authenticated acceptance; never run in production.
-- Observed production catalog 2026-11-21. No identities, placements,
-- approvals, signatures, student records or customer data are copied.
-- Deliberately separate from supabase/migrations and deploy workflows.
DO $qa_guard$
BEGIN
  IF current_database() IS NULL THEN RAISE EXCEPTION 'Database identity unavailable'; END IF;
  IF EXISTS (
    SELECT 1 FROM pg_class c
    WHERE c.relnamespace = 'public'::regnamespace
      AND c.relname IN ('program_holder_acknowledgements',
                        'program_holder_documents','program_holder_students')
  ) THEN
    RAISE EXCEPTION 'Refusing QA bootstrap: a target Program Holder table already exists';
  END IF;
  IF to_regclass('public.program_holders') IS NULL
     OR to_regclass('public.organizations') IS NULL
     OR to_regclass('public.program_enrollments') IS NULL
     OR to_regclass('public.applications') IS NULL
     OR to_regclass('public.profiles') IS NULL
     OR to_regprocedure('rpc_private.is_admin()') IS NULL
  THEN
    RAISE EXCEPTION 'Refusing QA bootstrap: prerequisite tenant, enrollment or admin objects missing';
  END IF;
END
$qa_guard$;

CREATE TABLE public.program_holder_acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type text,
  acknowledged_at timestamptz DEFAULT now(),
  ip_address text,
  created_at timestamptz DEFAULT now(),
  full_name text,
  title text,
  user_agent text
);
CREATE INDEX idx_pha_user_id ON public.program_holder_acknowledgements(user_id);

CREATE TABLE public.program_holder_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  document_type text, file_name text, file_url text,
  file_size bigint, mime_type text, description text,
  uploaded_by uuid REFERENCES auth.users(id),
  approved boolean DEFAULT false,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz, approval_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  uploaded_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  rejection_reason text, ocr_text text,
  storage_bucket text DEFAULT 'documents'
);
CREATE INDEX program_holder_documents_user_id_idx ON public.program_holder_documents(user_id);
CREATE INDEX program_holder_documents_organization_id_idx ON public.program_holder_documents(organization_id);

CREATE TABLE public.program_holder_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_holder_id uuid REFERENCES public.program_holders(id) ON DELETE CASCADE,
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  enrolled_at timestamptz DEFAULT now(),
  status text DEFAULT 'active', notes text,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES public.program_enrollments(id) ON DELETE SET NULL,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  application_id uuid REFERENCES public.applications(id),
  applicant_name text, applicant_email text, applicant_phone text,
  application_status text DEFAULT 'applied',
  label text, call_notes text, call_date timestamptz, call_outcome text,
  work_start_date date, work_dates jsonb DEFAULT '[]'::jsonb,
  work_progress text, work_site text, called_by text,
  completion_date date,
  hours_taught numeric(6,2) DEFAULT 0,
  hours_required numeric(6,2) DEFAULT 0,
  last_session_date date, next_follow_up date,
  expected_payout_cents bigint DEFAULT 0,
  expected_payout_status text DEFAULT 'not_projected'
    CHECK (expected_payout_status IN
      ('not_projected','pending_voucher_payment','eligible','paid','cancelled')),
  payout_contact_verified_at timestamptz,
  payout_contact_verified_by uuid,
  payout_contact_call_log_id uuid,
  outreach_interest text
);
CREATE INDEX program_holder_students_holder_idx ON public.program_holder_students(program_holder_id);
CREATE INDEX program_holder_students_student_idx ON public.program_holder_students(student_id);
CREATE INDEX program_holder_students_user_idx ON public.program_holder_students(user_id);

ALTER TABLE public.program_holder_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_holder_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_holder_students ENABLE ROW LEVEL SECURITY;

-- The project is isolated; do not create anonymous browsing permissions.
REVOKE ALL ON public.program_holder_acknowledgements,
  public.program_holder_documents, public.program_holder_students FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_holder_acknowledgements,
  public.program_holder_documents, public.program_holder_students TO authenticated;
GRANT ALL ON public.program_holder_acknowledgements,
  public.program_holder_documents, public.program_holder_students TO service_role;

-- Authenticated holders may edit syllabus text only; no direct updates to review state.
-- Admin review uses an authenticated Admin endpoint with the server-side service role.
REVOKE UPDATE ON public.program_holder_documents FROM authenticated;
GRANT UPDATE (description, ocr_text, updated_at)
  ON public.program_holder_documents TO authenticated;

CREATE POLICY ack_owner_select ON public.program_holder_acknowledgements
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY ack_owner_insert ON public.program_holder_acknowledgements
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY ack_admin_all ON public.program_holder_acknowledgements
  FOR ALL TO authenticated
  USING ((SELECT rpc_private.is_admin()))
  WITH CHECK ((SELECT rpc_private.is_admin()));

CREATE POLICY docs_owner_select ON public.program_holder_documents
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY docs_owner_insert ON public.program_holder_documents
  FOR INSERT TO authenticated WITH CHECK (
    user_id = (SELECT auth.uid())
    AND approved IS FALSE AND status = 'pending'
    AND approved_by IS NULL AND approved_at IS NULL
    AND reviewed_by IS NULL AND reviewed_at IS NULL
    AND approval_notes IS NULL AND rejection_reason IS NULL
    AND (uploaded_by IS NULL OR uploaded_by = (SELECT auth.uid()))
  );
CREATE POLICY docs_owner_update ON public.program_holder_documents
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) AND approved IS FALSE AND status = 'pending')
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND approved IS FALSE AND status = 'pending'
    AND approved_by IS NULL AND approved_at IS NULL
    AND reviewed_by IS NULL AND reviewed_at IS NULL
    AND approval_notes IS NULL AND rejection_reason IS NULL
  );
CREATE POLICY docs_admin_all ON public.program_holder_documents
  FOR ALL TO authenticated USING ((SELECT rpc_private.is_admin()))
  WITH CHECK ((SELECT rpc_private.is_admin()));

-- Restrict holder access to its own placement roster; no raw cross-holder reads.
CREATE POLICY phs_roster_select ON public.program_holder_students
  FOR SELECT TO authenticated USING (
    student_id = (SELECT auth.uid())
    OR user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id AND ph.user_id = (SELECT auth.uid())
    )
    OR (SELECT rpc_private.is_admin())
  );
CREATE POLICY phs_holder_insert ON public.program_holder_students
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id AND ph.user_id = (SELECT auth.uid())
    ) OR (SELECT rpc_private.is_admin())
  );
CREATE POLICY phs_holder_update ON public.program_holder_students
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id AND ph.user_id = (SELECT auth.uid())
    ) OR (SELECT rpc_private.is_admin())
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id AND ph.user_id = (SELECT auth.uid())
    ) OR (SELECT rpc_private.is_admin())
  );
CREATE POLICY phs_admin_delete ON public.program_holder_students
  FOR DELETE TO authenticated USING ((SELECT rpc_private.is_admin()));

-- No records are seeded; preserve the existing QA identity-provisioning lifecycle.
DO $verify$
BEGIN
  IF (SELECT count(*) FROM public.program_holder_acknowledgements) <> 0
     OR (SELECT count(*) FROM public.program_holder_documents) <> 0
     OR (SELECT count(*) FROM public.program_holder_students) <> 0 THEN
    RAISE EXCEPTION 'Unexpected records in newly bootstrapped QA tables';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE table_schema='public'
      AND table_name IN ('program_holder_acknowledgements','program_holder_documents','program_holder_students')
      AND grantee='anon'
  ) THEN RAISE EXCEPTION 'Anonymous Program Holder grants forbidden'; END IF;
END
$verify$;
NOTIFY pgrst, 'reload schema';
