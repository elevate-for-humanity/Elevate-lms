-- Program holder governance: atomic approval, audit trail, DB constraints.
--
-- Fixes:
--   1. program_holder_programs is a generic lookup table — rebuild as junction table
--   2. No audit trail — add admin_audit_events
--   3. No primary program concept — add primary_program_id to program_holders
--   4. No approved_by tracking — add to program_holders
--   5. No FK from profiles.program_holder_id → program_holders
--   6. Approval is 3 separate writes — replace with atomic RPC

BEGIN;

-- ============================================================
-- 1. admin_audit_events — immutable audit trail
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  actor_user_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.admin_audit_events(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_target ON public.admin_audit_events(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.admin_audit_events(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.admin_audit_events(created_at DESC);

-- Immutable: no UPDATE or DELETE allowed via RLS
ALTER TABLE public.admin_audit_events ENABLE ROW LEVEL SECURITY;

-- Admins can read audit events
CREATE POLICY "admins_read_audit" ON public.admin_audit_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Only service_role can insert (via RPC)
CREATE POLICY "service_insert_audit" ON public.admin_audit_events
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- 2. Add approved_by + primary_program_id to program_holders
-- ============================================================
ALTER TABLE public.program_holders
  ADD COLUMN IF NOT EXISTS approved_by UUID,
  ADD COLUMN IF NOT EXISTS primary_program_id UUID;

-- FK: approved_by → auth.users (soft — no CASCADE, admin might be deleted)
-- FK: primary_program_id → programs
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'program_holders_primary_program_fkey'
  ) THEN
    ALTER TABLE public.program_holders
      ADD CONSTRAINT program_holders_primary_program_fkey
      FOREIGN KEY (primary_program_id) REFERENCES public.programs(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 3. Rebuild program_holder_programs as a junction table
--    The existing table has (id, name, description, status, created_at, updated_at, program_slug)
--    We need (id, program_holder_id, program_id, role_in_program, is_primary, status, created_at)
-- ============================================================

-- Drop old columns that don't belong on a junction table
ALTER TABLE public.program_holder_programs
  DROP COLUMN IF EXISTS name,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS program_slug,
  DROP COLUMN IF EXISTS updated_at;

-- Add junction columns
ALTER TABLE public.program_holder_programs
  ADD COLUMN IF NOT EXISTS program_holder_id UUID,
  ADD COLUMN IF NOT EXISTS program_id UUID,
  ADD COLUMN IF NOT EXISTS role_in_program TEXT NOT NULL DEFAULT 'owner',
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT false;

-- Set NOT NULL after adding (in case existing rows need backfill — table is empty)
ALTER TABLE public.program_holder_programs
  ALTER COLUMN program_holder_id SET NOT NULL,
  ALTER COLUMN program_id SET NOT NULL;

-- Add FKs
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'php_holder_fkey'
  ) THEN
    ALTER TABLE public.program_holder_programs
      ADD CONSTRAINT php_holder_fkey
      FOREIGN KEY (program_holder_id) REFERENCES public.program_holders(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'php_program_fkey'
  ) THEN
    ALTER TABLE public.program_holder_programs
      ADD CONSTRAINT php_program_fkey
      FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Unique composite: one assignment per holder+program
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'php_holder_program_unique'
  ) THEN
    ALTER TABLE public.program_holder_programs
      ADD CONSTRAINT php_holder_program_unique UNIQUE (program_holder_id, program_id);
  END IF;
END $$;

-- Unique partial index: only one active primary per holder
CREATE UNIQUE INDEX IF NOT EXISTS idx_php_one_primary_per_holder
  ON public.program_holder_programs (program_holder_id)
  WHERE is_primary = true AND status = 'active';

-- Indexes for lookups
CREATE INDEX IF NOT EXISTS idx_php_holder ON public.program_holder_programs(program_holder_id);
CREATE INDEX IF NOT EXISTS idx_php_program ON public.program_holder_programs(program_id);

-- ============================================================
-- 4. FK from profiles.program_holder_id → program_holders
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_program_holder_fkey'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_program_holder_fkey
      FOREIGN KEY (program_holder_id) REFERENCES public.program_holders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 5. Atomic RPC: approve_and_provision_program_holder
--    Single transaction: lock → validate → activate → provision → audit
-- ============================================================
CREATE OR REPLACE FUNCTION public.approve_and_provision_program_holder(
  p_holder_id UUID,
  p_program_id UUID,
  p_actor_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_holder RECORD;
  v_program RECORD;
  v_profile RECORD;
  v_assignment_id UUID;
BEGIN
  -- 1. Lock holder row to prevent concurrent approval
  SELECT id, user_id, status, organization_name
  INTO v_holder
  FROM program_holders
  WHERE id = p_holder_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Holder not found');
  END IF;

  -- 2. Validate holder is in an approvable state
  IF v_holder.status NOT IN ('pending', 'rejected', 'suspended') THEN
    RETURN jsonb_build_object('success', false, 'error',
      format('Holder status is %s — only pending/rejected/suspended can be approved', v_holder.status));
  END IF;

  -- 3. Validate holder has a linked user
  IF v_holder.user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Holder has no linked user_id');
  END IF;

  -- 4. Validate linked profile exists
  SELECT id, role INTO v_profile
  FROM profiles
  WHERE id = v_holder.user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Linked profile not found');
  END IF;

  -- 5. Validate program exists and is active
  SELECT id, name, is_active INTO v_program
  FROM programs
  WHERE id = p_program_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Program not found');
  END IF;

  IF NOT v_program.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Program is not active');
  END IF;

  -- 6. Validate actor is admin/super_admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_actor_id AND role IN ('admin', 'super_admin')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Actor lacks approval authority');
  END IF;

  -- ── All validations passed — execute atomic writes ──

  -- 7. Activate holder
  UPDATE program_holders SET
    status = 'active',
    approved_at = now(),
    approved_by = p_actor_id,
    primary_program_id = p_program_id
  WHERE id = p_holder_id;

  -- 8. Set profile role + linkage
  UPDATE profiles SET
    role = 'program_holder',
    program_holder_id = p_holder_id
  WHERE id = v_holder.user_id;

  -- 9. Provision primary program (upsert)
  INSERT INTO program_holder_programs (program_holder_id, program_id, role_in_program, is_primary, status)
  VALUES (p_holder_id, p_program_id, 'owner', true, 'active')
  ON CONFLICT (program_holder_id, program_id)
  DO UPDATE SET is_primary = true, status = 'active'
  RETURNING id INTO v_assignment_id;

  -- 10. Audit event (immutable record)
  INSERT INTO admin_audit_events (action, actor_user_id, target_type, target_id, metadata)
  VALUES (
    'program_holder.approved_and_provisioned',
    p_actor_id,
    'program_holder',
    p_holder_id,
    jsonb_build_object(
      'holder_org', v_holder.organization_name,
      'user_id', v_holder.user_id,
      'program_id', p_program_id,
      'program_name', v_program.name,
      'assignment_id', v_assignment_id,
      'previous_status', v_holder.status
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'holder_id', p_holder_id,
    'user_id', v_holder.user_id,
    'program_id', p_program_id,
    'assignment_id', v_assignment_id
  );
END;
$$;

-- ============================================================
-- 6. RPC: provision_additional_program (post-approval)
-- ============================================================
CREATE OR REPLACE FUNCTION public.provision_additional_program(
  p_holder_id UUID,
  p_program_id UUID,
  p_actor_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_holder RECORD;
  v_program RECORD;
  v_assignment_id UUID;
BEGIN
  -- Lock + validate holder is active
  SELECT id, status, organization_name INTO v_holder
  FROM program_holders WHERE id = p_holder_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Holder not found');
  END IF;

  IF v_holder.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Holder is not active');
  END IF;

  -- Validate program
  SELECT id, name, is_active INTO v_program
  FROM programs WHERE id = p_program_id;

  IF NOT FOUND OR NOT v_program.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Program not found or inactive');
  END IF;

  -- Validate actor
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = p_actor_id AND role IN ('admin', 'super_admin')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Actor lacks provisioning authority');
  END IF;

  -- Insert (not primary by default)
  INSERT INTO program_holder_programs (program_holder_id, program_id, role_in_program, is_primary, status)
  VALUES (p_holder_id, p_program_id, 'owner', false, 'active')
  ON CONFLICT (program_holder_id, program_id)
  DO UPDATE SET status = 'active'
  RETURNING id INTO v_assignment_id;

  -- Audit
  INSERT INTO admin_audit_events (action, actor_user_id, target_type, target_id, metadata)
  VALUES (
    'program_holder.program_provisioned',
    p_actor_id,
    'program_holder',
    p_holder_id,
    jsonb_build_object(
      'program_id', p_program_id,
      'program_name', v_program.name,
      'assignment_id', v_assignment_id
    )
  );

  RETURN jsonb_build_object('success', true, 'assignment_id', v_assignment_id);
END;
$$;

-- ============================================================
-- 7. RPC: deprovision_program (remove assignment)
-- ============================================================
CREATE OR REPLACE FUNCTION public.deprovision_program(
  p_assignment_id UUID,
  p_actor_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignment RECORD;
BEGIN
  -- Validate actor
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = p_actor_id AND role IN ('admin', 'super_admin')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Actor lacks authority');
  END IF;

  -- Get assignment details before deleting
  SELECT id, program_holder_id, program_id, is_primary INTO v_assignment
  FROM program_holder_programs WHERE id = p_assignment_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Assignment not found');
  END IF;

  -- Prevent removing the primary program if it's the only one
  IF v_assignment.is_primary THEN
    IF (SELECT count(*) FROM program_holder_programs
        WHERE program_holder_id = v_assignment.program_holder_id AND status = 'active') <= 1 THEN
      RETURN jsonb_build_object('success', false, 'error',
        'Cannot remove the only provisioned program. Suspend the holder instead.');
    END IF;
  END IF;

  DELETE FROM program_holder_programs WHERE id = p_assignment_id;

  -- If we removed the primary, promote the oldest remaining
  IF v_assignment.is_primary THEN
    UPDATE program_holder_programs SET is_primary = true
    WHERE id = (
      SELECT id FROM program_holder_programs
      WHERE program_holder_id = v_assignment.program_holder_id
        AND status = 'active'
      ORDER BY created_at ASC
      LIMIT 1
    );

    -- Also update primary_program_id on holder
    UPDATE program_holders SET primary_program_id = (
      SELECT program_id FROM program_holder_programs
      WHERE program_holder_id = v_assignment.program_holder_id
        AND is_primary = true AND status = 'active'
      LIMIT 1
    ) WHERE id = v_assignment.program_holder_id;
  END IF;

  -- Audit
  INSERT INTO admin_audit_events (action, actor_user_id, target_type, target_id, metadata)
  VALUES (
    'program_holder.program_deprovisioned',
    p_actor_id,
    'program_holder',
    v_assignment.program_holder_id,
    jsonb_build_object(
      'program_id', v_assignment.program_id,
      'assignment_id', p_assignment_id,
      'was_primary', v_assignment.is_primary
    )
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- 8. RLS policies (from previous migration, re-applied)
-- ============================================================
ALTER TABLE public.program_holder_programs ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION public.current_program_holder_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT program_holder_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Holders see their own program associations
DROP POLICY IF EXISTS "holders_own_programs" ON public.program_holder_programs;
CREATE POLICY "holders_own_programs" ON public.program_holder_programs
  FOR SELECT USING (
    program_holder_id = public.current_program_holder_id()
  );

-- Admins can manage all
DROP POLICY IF EXISTS "admins_manage_php" ON public.program_holder_programs;
CREATE POLICY "admins_manage_php" ON public.program_holder_programs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- 9. RLS on program_holders (re-applied with staff=read-only)
-- ============================================================
ALTER TABLE public.program_holders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "holders_see_own" ON public.program_holders;
CREATE POLICY "holders_see_own" ON public.program_holders
  FOR SELECT USING (id = public.current_program_holder_id());

DROP POLICY IF EXISTS "admins_manage_holders" ON public.program_holders;
CREATE POLICY "admins_manage_holders" ON public.program_holders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Staff can read but not mutate
DROP POLICY IF EXISTS "staff_read_holders" ON public.program_holders;
CREATE POLICY "staff_read_holders" ON public.program_holders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'staff'
    )
  );

COMMIT;
