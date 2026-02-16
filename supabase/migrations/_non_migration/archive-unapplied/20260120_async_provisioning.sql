-- STEP 6: Async Safety, Auditability, Observability
-- Database-backed job queue for reliable provisioning

-- ============================================
-- A: PROVISIONING JOBS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS provisioning_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE,
  payment_intent_id TEXT,
  tenant_id UUID REFERENCES tenants(id),
  correlation_id TEXT NOT NULL,
  
  -- Job definition
  job_type TEXT NOT NULL CHECK (job_type IN (
    'license_provision',
    'license_suspend',
    'license_reactivate',
    'email_send',
    'tenant_setup',
    'webhook_process'
  )),
  payload JSONB NOT NULL DEFAULT '{}',
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued',
    'processing',
    'completed',
    'failed',
    'dead'
  )),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 10,
  last_error TEXT,
  
  -- Scheduling
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient job processing
CREATE INDEX IF NOT EXISTS idx_provisioning_jobs_status_run_at 
  ON provisioning_jobs(status, run_at) 
  WHERE status IN ('queued', 'failed');

CREATE INDEX IF NOT EXISTS idx_provisioning_jobs_correlation 
  ON provisioning_jobs(correlation_id);

CREATE INDEX IF NOT EXISTS idx_provisioning_jobs_tenant 
  ON provisioning_jobs(tenant_id);

CREATE INDEX IF NOT EXISTS idx_provisioning_jobs_stripe_event 
  ON provisioning_jobs(stripe_event_id);

CREATE INDEX IF NOT EXISTS idx_provisioning_jobs_dead 
  ON provisioning_jobs(status) 
  WHERE status = 'dead';

-- ============================================
-- FUNCTION: Claim jobs for processing (skip locked)
-- ============================================

CREATE OR REPLACE FUNCTION claim_provisioning_jobs(p_limit INTEGER DEFAULT 25)
RETURNS SETOF provisioning_jobs AS $$
BEGIN
  RETURN QUERY
  UPDATE provisioning_jobs
  SET 
    status = 'processing',
    started_at = NOW(),
    attempts = attempts + 1,
    updated_at = NOW()
  WHERE id IN (
    SELECT id FROM provisioning_jobs
    WHERE status IN ('queued', 'failed')
    AND run_at <= NOW()
    AND attempts < max_attempts
    ORDER BY run_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Complete a job
-- ============================================

CREATE OR REPLACE FUNCTION complete_provisioning_job(
  p_job_id UUID,
  p_success BOOLEAN,
  p_error TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_job provisioning_jobs;
BEGIN
  SELECT * INTO v_job FROM provisioning_jobs WHERE id = p_job_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  IF p_success THEN
    UPDATE provisioning_jobs
    SET 
      status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_job_id;
    
    -- Log success
    INSERT INTO provisioning_events (
      correlation_id,
      tenant_id,
      step,
      status,
      metadata
    ) VALUES (
      v_job.correlation_id,
      v_job.tenant_id,
      'job_completed_' || v_job.job_type,
      'completed',
      jsonb_build_object('job_id', p_job_id, 'attempts', v_job.attempts)
    );
  ELSE
    -- Check if should go to dead letter
    IF v_job.attempts >= v_job.max_attempts THEN
      UPDATE provisioning_jobs
      SET 
        status = 'dead',
        last_error = p_error,
        updated_at = NOW()
      WHERE id = p_job_id;
      
      -- Log dead letter
      INSERT INTO provisioning_events (
        correlation_id,
        tenant_id,
        step,
        status,
        metadata
      ) VALUES (
        v_job.correlation_id,
        v_job.tenant_id,
        'job_dead_letter',
        'failed',
        jsonb_build_object(
          'job_id', p_job_id, 
          'job_type', v_job.job_type,
          'attempts', v_job.attempts,
          'last_error', p_error
        )
      );
    ELSE
      -- Schedule retry with exponential backoff
      UPDATE provisioning_jobs
      SET 
        status = 'failed',
        last_error = p_error,
        run_at = NOW() + (POWER(2, v_job.attempts) * INTERVAL '1 minute'),
        updated_at = NOW()
      WHERE id = p_job_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Retry dead letter job
-- ============================================

CREATE OR REPLACE FUNCTION retry_dead_letter_job(
  p_job_id UUID,
  p_admin_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_job provisioning_jobs;
BEGIN
  SELECT * INTO v_job FROM provisioning_jobs WHERE id = p_job_id AND status = 'dead';
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  UPDATE provisioning_jobs
  SET 
    status = 'queued',
    attempts = 0,
    last_error = NULL,
    run_at = NOW(),
    updated_at = NOW()
  WHERE id = p_job_id;
  
  -- Audit the retry
  INSERT INTO admin_audit_events (
    admin_user_id,
    target_tenant_id,
    action,
    table_accessed,
    reason,
    metadata
  ) VALUES (
    p_admin_user_id,
    v_job.tenant_id,
    'retry_dead_letter_job',
    'provisioning_jobs',
    'Manual retry of dead letter job',
    jsonb_build_object('job_id', p_job_id, 'job_type', v_job.job_type)
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================
-- RLS for provisioning_jobs
-- ============================================

ALTER TABLE provisioning_jobs ENABLE ROW LEVEL SECURITY;

-- Only super admins can view jobs
CREATE POLICY "provisioning_jobs_select_super_admin"
  ON provisioning_jobs FOR SELECT
  TO authenticated
  USING (is_super_admin());

-- Service role can do everything (for worker)
-- No policy needed - service role bypasses RLS

COMMENT ON TABLE provisioning_jobs IS 'Async job queue for reliable provisioning';
COMMENT ON FUNCTION claim_provisioning_jobs IS 'Atomically claim jobs for processing with skip locked';
COMMENT ON FUNCTION complete_provisioning_job IS 'Mark job complete or failed with retry logic';
COMMENT ON FUNCTION retry_dead_letter_job IS 'Admin action to retry a dead letter job';
