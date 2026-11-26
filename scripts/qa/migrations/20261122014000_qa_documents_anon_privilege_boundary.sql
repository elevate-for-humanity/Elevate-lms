-- Isolated QA ONLY (Supabase project isdgjcdabhxxozarmxta).
-- Correct drift: the QA documents table grants all table privileges to anon,
-- while production grants anon none. Preserve every QA row and authenticated
-- owner/service-role behavior. NEVER place this under supabase/migrations.
--
-- Fail closed if applied to a different schema or to production.
DO $qa_documents_preflight$
BEGIN
  IF to_regclass('public.documents') IS NULL
     OR (SELECT count(*) FROM pg_attribute
         WHERE attrelid='public.documents'::regclass
           AND attnum > 0 AND NOT attisdropped) <> 14
     OR NOT (SELECT relrowsecurity FROM pg_class
             WHERE oid='public.documents'::regclass)
     OR NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname='public' AND tablename='documents'
         AND policyname='qa_documents_owner_read'
         AND cmd='SELECT'
     )
     OR NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname='public' AND tablename='documents'
         AND policyname='qa_documents_service'
     )
  THEN
    RAISE EXCEPTION 'QA documents privilege prerequisites differ; refuse migration';
  END IF;
END
$qa_documents_preflight$;

-- RLS already denies anonymous rows; eliminate the unnecessary grants at source.
-- REVOKE is a privilege operation only: no document row or approval is modified.
REVOKE ALL PRIVILEGES ON TABLE public.documents FROM anon;

DO $qa_documents_verify$
BEGIN
  IF has_table_privilege('anon','public.documents','SELECT')
     OR has_table_privilege('anon','public.documents','INSERT')
     OR has_table_privilege('anon','public.documents','UPDATE')
     OR has_table_privilege('anon','public.documents','DELETE')
     OR NOT has_table_privilege('authenticated','public.documents','SELECT')
     OR NOT has_table_privilege('service_role','public.documents','SELECT')
     OR NOT (SELECT relrowsecurity FROM pg_class
             WHERE oid='public.documents'::regclass)
     OR NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname='public' AND tablename='documents'
         AND policyname='qa_documents_owner_read'
     )
  THEN
    RAISE EXCEPTION 'QA document access verification failed; rollback required';
  END IF;
END
$qa_documents_verify$;

NOTIFY pgrst, 'reload schema';
