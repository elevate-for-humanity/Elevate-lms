-- =============================================================================
-- Phase 3.1: Credential expiration automation
--
-- Two mechanisms:
--   1. SQL function expire_stale_credentials() — idempotent, safe to run repeatedly
--   2. pg_cron schedule — runs daily at 02:00 UTC (enable pg_cron extension first)
--
-- The function transitions learner_credentials from active → expired when
-- expires_at < now(). Writes an audit entry for each expiration.
--
-- If pg_cron is not enabled, the function can be called from:
--   - /api/cron/expire-credentials (Netlify scheduled function)
--   - job_queue with job_type = 'credential_expire'
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. Expiration function
-- =============================================================================
CREATE OR REPLACE FUNCTION public.expire_stale_credentials()
RETURNS TABLE(expired_count INT, credential_ids UUID[]) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_expired_ids UUID[];
  v_count INT;
BEGIN
  -- Collect IDs to expire
  SELECT ARRAY_AGG(id) INTO v_expired_ids
  FROM public.learner_credentials
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < now();

  IF v_expired_ids IS NULL OR array_length(v_expired_ids, 1) = 0 THEN
    RETURN QUERY SELECT 0, ARRAY[]::UUID[];
    RETURN;
  END IF;

  -- Expire them
  UPDATE public.learner_credentials
  SET status = 'expired', updated_at = now()
  WHERE id = ANY(v_expired_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Write audit entries (one per expired credential)
  INSERT INTO public.audit_logs (
    user_id, action, resource_type, resource_id, details, created_at
  )
  SELECT
    lc.learner_id,
    'credential_expired',
    'learner_credential',
    lc.id,
    jsonb_build_object(
      'credential_id', lc.credential_id,
      'expired_at', lc.expires_at,
      'processed_at', now()
    ),
    now()
  FROM public.learner_credentials lc
  WHERE lc.id = ANY(v_expired_ids);

  RETURN QUERY SELECT v_count, v_expired_ids;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_stale_credentials() TO service_role;

-- =============================================================================
-- 2. pg_cron schedule (requires pg_cron extension — enable in Supabase Dashboard)
--    If pg_cron is not available this block is skipped safely.
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Remove existing schedule if present
    PERFORM cron.unschedule('expire-stale-credentials')
    WHERE EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'expire-stale-credentials'
    );

    -- Schedule daily at 02:00 UTC
    PERFORM cron.schedule(
      'expire-stale-credentials',
      '0 2 * * *',
      $$SELECT public.expire_stale_credentials()$$
    );

    RAISE NOTICE 'pg_cron schedule created: expire-stale-credentials (daily 02:00 UTC)';
  ELSE
    RAISE NOTICE 'pg_cron not enabled — use /api/cron/expire-credentials Netlify scheduled function instead';
  END IF;
END $$;

COMMIT;
