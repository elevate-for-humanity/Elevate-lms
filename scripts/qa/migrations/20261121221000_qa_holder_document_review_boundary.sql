-- QA ONLY: isolated project isdgjcdabhxxozarmxta.
-- Defense in depth for Program Holder documents already bootstrapped in QA.
-- No production use, student/holder records copied, approval updates or deletes.
-- Preserve existing QA rows and the administrator-only review API.
DO $qa_guard$
BEGIN
  IF to_regclass('public.program_holder_documents') IS NULL
     OR to_regprocedure('rpc_private.is_admin()') IS NULL
     OR NOT EXISTS (
       SELECT 1 FROM pg_policies WHERE schemaname='public'
         AND tablename='program_holder_documents'
         AND policyname='docs_admin_all'
     )
  THEN RAISE EXCEPTION 'QA Program Holder review prerequisites absent; refuse repair'; END IF;
END
$qa_guard$;

-- Authenticated holders may edit syllabus text only; no direct updates to review state.
-- Admin review uses an authenticated Admin endpoint with the server-side service role.
REVOKE UPDATE ON public.program_holder_documents FROM authenticated;
GRANT UPDATE (description, ocr_text, updated_at)
  ON public.program_holder_documents TO authenticated;

DROP POLICY IF EXISTS docs_owner_insert ON public.program_holder_documents;
DROP POLICY IF EXISTS docs_owner_update ON public.program_holder_documents;
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

DO $verify$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.column_privileges
    WHERE table_schema='public' AND table_name='program_holder_documents'
      AND grantee='authenticated' AND privilege_type='UPDATE'
      AND column_name IN ('approved','status','approved_by','approved_at',
                          'reviewed_by','reviewed_at','approval_notes','rejection_reason')
  )
  THEN RAISE EXCEPTION 'Authenticated holder retains a protected review-column UPDATE privilege'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.column_privileges
    WHERE table_schema='public' AND table_name='program_holder_documents'
      AND grantee='authenticated' AND privilege_type='UPDATE'
      AND column_name='ocr_text'
  )
  THEN RAISE EXCEPTION 'Authorized holder syllabus text update privilege missing'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public'
      AND tablename='program_holder_documents'
      AND policyname='docs_owner_insert'
      AND with_check LIKE '%approved IS FALSE%'
      AND with_check LIKE '%status = %pending%'
  )
  THEN RAISE EXCEPTION 'Owner insert guard is not active'; END IF;
END
$verify$;
NOTIFY pgrst, 'reload schema';
