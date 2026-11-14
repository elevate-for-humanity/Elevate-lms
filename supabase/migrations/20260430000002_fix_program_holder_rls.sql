-- Fix RLS policies for program_holder role.
-- The existing policies use user_id = auth.uid() but program_holders.user_id
-- is null for most rows. The correct lookup is via profiles.program_holder_id.
-- current_program_holder_id() already does this correctly but the SELECT
-- policies were not covering the authenticated program_holder role.

-- ── program_holders ──────────────────────────────────────────────────────────

-- Drop the broken user_id-based policy
DROP POLICY IF EXISTS "users_own" ON public.program_holders;

-- Add policy: program_holder role can read their own row via profiles.program_holder_id
DROP POLICY IF EXISTS "program_holder_read_own" ON public.program_holders;
CREATE POLICY "program_holder_read_own" ON public.program_holders
  FOR SELECT
  TO authenticated
  USING (
    id = (
      SELECT program_holder_id
      FROM public.profiles
      WHERE id = auth.uid()
      LIMIT 1
    )
  );

-- ── program_holder_acknowledgements ──────────────────────────────────────────

-- Existing policy program_holders_read_own_ack uses user_id = auth.uid() — correct
-- but verify it covers SELECT for authenticated role
DROP POLICY IF EXISTS "program_holders_read_own_ack" ON public.program_holder_acknowledgements;
CREATE POLICY "program_holders_read_own_ack" ON public.program_holder_acknowledgements
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow program_holder to insert their own acks
DROP POLICY IF EXISTS "program_holders_insert_ack" ON public.program_holder_acknowledgements;
CREATE POLICY "program_holders_insert_ack" ON public.program_holder_acknowledgements
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ── program_holder_documents ─────────────────────────────────────────────────

-- auth_read_program_holder_documents has qual=true but may be missing TO clause
DROP POLICY IF EXISTS "auth_read_program_holder_documents" ON public.program_holder_documents;
CREATE POLICY "auth_read_program_holder_documents" ON public.program_holder_documents
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ── program_holder_programs ──────────────────────────────────────────────────

-- Allow program_holder to read their own program associations
DROP POLICY IF EXISTS "program_holder_read_own_programs" ON public.program_holder_programs;
CREATE POLICY "program_holder_read_own_programs" ON public.program_holder_programs
  FOR SELECT
  TO authenticated
  USING (
    program_holder_id = (
      SELECT program_holder_id
      FROM public.profiles
      WHERE id = auth.uid()
      LIMIT 1
    )
  );

-- ── Table-level GRANTs ───────────────────────────────────────────────────────
-- RLS policies are no-ops without underlying table privileges.
-- The authenticated role needs SELECT (and INSERT where applicable) on these tables.

GRANT SELECT ON public.program_holders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.program_holder_acknowledgements TO authenticated;
GRANT SELECT, INSERT ON public.program_holder_documents TO authenticated;
GRANT SELECT ON public.program_holder_programs TO authenticated;
