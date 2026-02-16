-- Add enrollment state machine columns to program_enrollments.
-- These columns are referenced by:
--   app/api/enrollment/documents/complete/route.ts
--   app/api/enrollment/orientation/complete/route.ts
--   app/enrollment/documents/page.tsx
--   app/enrollment/confirmed/page.tsx
--   app/enrollment/orientation/page.tsx
--   app/programs/barber-apprenticeship/*/layout.tsx
--   app/programs/nail-technician-apprenticeship/*/layout.tsx

BEGIN;

-- 1. State machine column
ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS enrollment_state text DEFAULT 'applied';

-- 2. Timestamp columns for each state transition
ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS orientation_completed_at timestamptz;

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS documents_completed_at timestamptz;

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS documents_submitted_at timestamptz;

-- 3. Next action hint for the frontend
ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS next_required_action text;

-- 4. Backfill: set enrollment_state from existing status where possible
UPDATE public.program_enrollments
  SET enrollment_state = CASE
    WHEN status = 'ACTIVE' THEN 'active'
    WHEN status = 'active' THEN 'active'
    WHEN status = 'completed' THEN 'active'
    WHEN status = 'pending' THEN 'applied'
    WHEN status = 'confirmed' THEN 'confirmed'
    WHEN status = 'cancelled' THEN 'applied'
    ELSE 'applied'
  END
WHERE enrollment_state IS NULL OR enrollment_state = 'applied';

-- 5. Index for state queries
CREATE INDEX IF NOT EXISTS idx_program_enrollments_state
  ON public.program_enrollments (enrollment_state);

-- 6. Student UPDATE policy so the API routes can advance state
-- (The server-side createClient uses the user's JWT, so RLS applies)
DROP POLICY IF EXISTS "Students can update own program enrollments" ON public.program_enrollments;
CREATE POLICY "Students can update own program enrollments"
  ON public.program_enrollments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMIT;
