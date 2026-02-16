-- ============================================================================
-- ENROLLMENT STATE TRANSITIONS & VALIDATION
-- ============================================================================
-- Enforces valid state transitions and logs all changes
-- ============================================================================

-- ============================================================================
-- STEP 1: ENROLLMENT STATE VALIDATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_enrollment_state_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_valid_transition BOOLEAN := FALSE;
BEGIN
  -- If status hasn't changed, allow update
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Define valid state transitions
  -- applied → eligible → documents_complete → approved → enrolled → active → completed/withdrawn
  
  CASE OLD.status
    WHEN 'applied' THEN
      v_valid_transition := NEW.status IN ('eligible', 'withdrawn');
    
    WHEN 'eligible' THEN
      v_valid_transition := NEW.status IN ('documents_complete', 'withdrawn');
    
    WHEN 'documents_complete' THEN
      v_valid_transition := NEW.status IN ('approved', 'withdrawn');
    
    WHEN 'approved' THEN
      v_valid_transition := NEW.status IN ('enrolled', 'withdrawn');
    
    WHEN 'enrolled' THEN
      v_valid_transition := NEW.status IN ('active', 'withdrawn');
    
    WHEN 'active' THEN
      v_valid_transition := NEW.status IN ('completed', 'withdrawn', 'on_hold');
    
    WHEN 'on_hold' THEN
      v_valid_transition := NEW.status IN ('active', 'withdrawn');
    
    WHEN 'completed' THEN
      v_valid_transition := FALSE; -- Terminal state
    
    WHEN 'withdrawn' THEN
      v_valid_transition := FALSE; -- Terminal state
    
    ELSE
      v_valid_transition := FALSE;
  END CASE;

  -- Allow admins to override (for corrections)
  IF NOT v_valid_transition THEN
    -- Check if user is admin
    IF EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    ) THEN
      v_valid_transition := TRUE;
      
      -- Log the override
      INSERT INTO enrollment_events (
        enrollment_id,
        event_type,
        from_state,
        to_state,
        actor_id,
        metadata
      ) VALUES (
        NEW.id,
        'state_override',
        OLD.status,
        NEW.status,
        auth.uid(),
        jsonb_build_object(
          'reason', 'Admin override',
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END IF;
  END IF;

  IF NOT v_valid_transition THEN
    RAISE EXCEPTION 'Invalid enrollment state transition: % → %', OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 2: ENROLLMENT STATE CHANGE LOGGING TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION log_enrollment_state_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status != NEW.status THEN
    INSERT INTO enrollment_events (
      enrollment_id,
      event_type,
      from_state,
      to_state,
      actor_id,
      metadata
    ) VALUES (
      NEW.id,
      'state_change',
      OLD.status,
      NEW.status,
      auth.uid(),
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'payment_status', NEW.payment_status,
        'payment_mode', NEW.payment_mode
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 3: PAYMENT MODE LOCK TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION enforce_payment_mode_lock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If payment_mode is already locked, prevent changes
  IF OLD.payment_mode_locked_at IS NOT NULL AND OLD.payment_mode != NEW.payment_mode THEN
    -- Allow admins to override
    IF EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    ) THEN
      -- Log the override
      INSERT INTO enrollment_events (
        enrollment_id,
        event_type,
        from_state,
        to_state,
        actor_id,
        metadata
      ) VALUES (
        NEW.id,
        'payment_mode_override',
        OLD.payment_mode,
        NEW.payment_mode,
        auth.uid(),
        jsonb_build_object(
          'old_payment_mode', OLD.payment_mode,
          'new_payment_mode', NEW.payment_mode,
          'locked_at', OLD.payment_mode_locked_at
        )
      );
      
      RETURN NEW;
    ELSE
      RAISE EXCEPTION 'Payment mode is locked and cannot be changed. Locked at: %', OLD.payment_mode_locked_at;
    END IF;
  END IF;

  -- Auto-lock payment mode when enrollment reaches 'enrolled' status
  IF NEW.status = 'enrolled' AND NEW.payment_mode_locked_at IS NULL THEN
    NEW.payment_mode_locked_at := NOW();
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 4: BILLING LOCK ENFORCEMENT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION enforce_billing_lock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Prevent unlocking billing_lock unless admin or payment completed/failed
  IF OLD.billing_lock = TRUE AND NEW.billing_lock = FALSE THEN
    -- Allow if payment completed or failed
    IF NEW.payment_status IN ('paid', 'failed') THEN
      RETURN NEW;
    END IF;

    -- Allow admins to override
    IF EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    ) THEN
      INSERT INTO enrollment_events (
        enrollment_id,
        event_type,
        from_state,
        to_state,
        actor_id,
        metadata
      ) VALUES (
        NEW.id,
        'billing_lock_override',
        'locked',
        'unlocked',
        auth.uid(),
        jsonb_build_object(
          'payment_status', NEW.payment_status,
          'reason', 'Admin override'
        )
      );
      
      RETURN NEW;
    ELSE
      RAISE EXCEPTION 'Billing lock cannot be removed while payment is in progress';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 5: ATTACH TRIGGERS TO ENROLLMENTS TABLE
-- ============================================================================

-- State validation trigger (runs first)
DROP TRIGGER IF EXISTS trigger_validate_enrollment_state ON enrollments;
CREATE TRIGGER trigger_validate_enrollment_state
  BEFORE UPDATE ON enrollments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION validate_enrollment_state_transition();

-- State change logging trigger (runs after validation)
DROP TRIGGER IF EXISTS trigger_log_enrollment_state_change ON enrollments;
CREATE TRIGGER trigger_log_enrollment_state_change
  AFTER UPDATE ON enrollments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_enrollment_state_change();

-- Payment mode lock trigger
DROP TRIGGER IF EXISTS trigger_enforce_payment_mode_lock ON enrollments;
CREATE TRIGGER trigger_enforce_payment_mode_lock
  BEFORE UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION enforce_payment_mode_lock();

-- Billing lock enforcement trigger
DROP TRIGGER IF EXISTS trigger_enforce_billing_lock ON enrollments;
CREATE TRIGGER trigger_enforce_billing_lock
  BEFORE UPDATE ON enrollments
  FOR EACH ROW
  WHEN (OLD.billing_lock IS DISTINCT FROM NEW.billing_lock)
  EXECUTE FUNCTION enforce_billing_lock();

-- ============================================================================
-- STEP 6: HELPER VIEWS FOR MONITORING
-- ============================================================================

-- View: Enrollments ready for payment
CREATE OR REPLACE VIEW enrollments_ready_for_payment AS
SELECT 
  e.id,
  e.user_id,
  e.program_id,
  e.status,
  e.payment_mode,
  e.payment_status,
  e.billing_lock,
  e.amount_cents,
  p.name as program_name,
  u.email as user_email,
  u.full_name as user_name
FROM enrollments e
JOIN programs p ON p.id = e.program_id
JOIN auth.users u ON u.id = e.user_id
WHERE e.status = 'enrolled'
  AND e.payment_status = 'pending'
  AND e.billing_lock = FALSE
  AND e.payment_mode = 'self_pay';

COMMENT ON VIEW enrollments_ready_for_payment IS 'Enrollments in enrolled status ready for payment initiation';

-- View: Active enrollments with payment info
CREATE OR REPLACE VIEW enrollments_with_payment_status AS
SELECT 
  e.id,
  e.user_id,
  e.program_id,
  e.status,
  e.payment_mode,
  e.payment_status,
  e.amount_cents,
  e.paid_at,
  e.billing_lock,
  e.billing_lock_at,
  e.stripe_checkout_session_id,
  e.stripe_payment_intent_id,
  p.name as program_name,
  u.email as user_email,
  u.full_name as user_name,
  (
    SELECT COUNT(*)
    FROM enrollment_documents ed
    WHERE ed.enrollment_id = e.id
    AND ed.status NOT IN ('approved', 'waived')
  ) as pending_documents_count
FROM enrollments e
JOIN programs p ON p.id = e.program_id
JOIN auth.users u ON u.id = e.user_id
WHERE e.status IN ('enrolled', 'active');

COMMENT ON VIEW enrollments_with_payment_status IS 'Active enrollments with payment and document status';

-- ============================================================================
-- STEP 7: GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON enrollments_ready_for_payment TO authenticated;
GRANT SELECT ON enrollments_with_payment_status TO authenticated;

-- ============================================================================
-- DONE
-- ============================================================================
