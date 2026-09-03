-- ============================================================
-- POST-MIGRATION VERIFICATION
-- Run after 20260312000004 and 20260312000005 in order.
-- All queries should return non-empty results.
-- ============================================================

-- 1. Confirm evidence integrity columns exist on exam_sessions
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'exam_sessions'
  AND column_name IN ('evidence_hash', 'evidence_storage_key', 'evidence_uploaded_at')
ORDER BY column_name;
-- Expected: 3 rows

-- 2. Confirm immutability trigger is attached
SELECT trigger_name, event_manipulation, action_timing, event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'exam_sessions'
  AND trigger_name = 'trg_prevent_evidence_key_overwrite';
-- Expected: 1 row, BEFORE UPDATE

-- 3. Confirm exam_session_events table exists with correct columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'exam_session_events'
ORDER BY ordinal_position;
-- Expected: id, session_id, event_type, actor_id, actor_role, metadata, created_at

-- 4. Confirm RLS is enabled on exam_session_events
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'exam_session_events'
  AND relnamespace = 'public'::regnamespace;
-- Expected: relrowsecurity = true

-- 5. Confirm policies: SELECT and INSERT exist, no UPDATE, no DELETE
SELECT policyname, cmd, permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'exam_session_events'
ORDER BY cmd;
-- Expected: exactly 2 rows — SELECT and INSERT
-- If UPDATE or DELETE rows appear, those policies must be dropped immediately

-- 6. Immutability truth test
-- Run this block to confirm the DB trigger fires correctly.
-- It should raise: "evidence_storage_key is immutable once set."
DO $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Create a minimal test session (will be cleaned up below)
  INSERT INTO public.exam_sessions (
    student_name, provider, exam_name, proctor_name,
    evidence_storage_key, status, result
  ) VALUES (
    'VERIFY_TEST', 'other', 'Verification Test', 'System',
    'test-bucket/original-key.pdf', 'checked_in', 'pending'
  ) RETURNING id INTO v_session_id;

  -- Attempt to overwrite evidence_storage_key — must raise exception
  BEGIN
    UPDATE public.exam_sessions
    SET evidence_storage_key = 'test-bucket/tampered-key.pdf'
    WHERE id = v_session_id;
    RAISE EXCEPTION 'FAIL: trigger did not fire — evidence_storage_key was overwritten';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%immutable%' THEN
      RAISE NOTICE 'PASS: trigger correctly blocked evidence_storage_key overwrite';
    ELSE
      RAISE EXCEPTION 'FAIL: unexpected error: %', SQLERRM;
    END IF;
  END;

  -- Clean up test row
  DELETE FROM public.exam_sessions WHERE id = v_session_id;
END;
$$;

-- 7. Sample recent event rows (run after a real or test session)
SELECT session_id, event_type, actor_role, metadata, created_at
FROM public.exam_session_events
ORDER BY created_at DESC
LIMIT 20;
-- Expected after any POST/PATCH to /api/proctor/sessions:
-- session_created, optionally retest_detected, recording_uploaded,
-- id_verified, exam_started, result_recorded, session_voided

-- ============================================================
-- SERVICE ROLE BYPASS NOTE
-- RLS does not apply to the Supabase service role key.
-- Confirm no admin scripts or cron jobs do:
--   DELETE FROM exam_session_events
--   UPDATE exam_session_events
-- The only application code path is appendSessionEvent() in
-- lib/proctor/session-events.ts which only calls .insert().
-- ============================================================
