-- Homepage data layer migrations
--
-- Fixes schema mismatches between HomeOutcomes component queries and
-- the actual testimonials / program_enrollments table schemas.
--
-- Changes:
--   testimonials       — add published alias, program alias, featured index, RLS
--   program_enrollments — add enrollment_state alias for active-count query

-- ============================================================================
-- 1. TESTIMONIALS — align with HomeOutcomes query
-- ============================================================================

-- HomeOutcomes queries: .eq('published', true) .eq('featured', true)
-- Table has: approved (bool), featured (bool), no published column
-- Add published as a generated column aliasing approved so both work.
ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT false;

-- Backfill: treat approved=true as published
UPDATE public.testimonials
SET published = true
WHERE approved = true AND published = false;

-- HomeOutcomes queries: .select('id, quote, name, role, program')
-- Table has program_slug, not program. Add program as alias column.
ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS program TEXT;

-- Backfill program from program_slug
UPDATE public.testimonials
SET program = program_slug
WHERE program IS NULL AND program_slug IS NOT NULL;

-- Index for homepage query: WHERE published=true AND featured=true
CREATE INDEX IF NOT EXISTS idx_testimonials_homepage
  ON public.testimonials (published, featured, created_at DESC)
  WHERE published = true AND featured = true;

-- ============================================================================
-- 2. TESTIMONIALS — RLS for public homepage read
-- ============================================================================

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read of published+featured testimonials (homepage)
DROP POLICY IF EXISTS "testimonials_public_read" ON public.testimonials;
CREATE POLICY "testimonials_public_read"
  ON public.testimonials
  FOR SELECT
  TO anon, authenticated
  USING (published = true AND featured = true);

-- Admins can read all
DROP POLICY IF EXISTS "testimonials_admin_all" ON public.testimonials;
CREATE POLICY "testimonials_admin_all"
  ON public.testimonials
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- ============================================================================
-- 3. PROGRAM_ENROLLMENTS — add enrollment_state for HomeOutcomes query
-- ============================================================================

-- HomeOutcomes queries: .eq('enrollment_state', 'active')
-- Table has: status TEXT DEFAULT 'pending'
-- Add enrollment_state as a generated column mirroring status.
ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS enrollment_state TEXT
    GENERATED ALWAYS AS (status) STORED;

-- Index for active-count query
CREATE INDEX IF NOT EXISTS idx_program_enrollments_enrollment_state
  ON public.program_enrollments (enrollment_state)
  WHERE enrollment_state = 'active';

-- ============================================================================
-- 4. SEED — fallback testimonials for homepage if table is empty
-- ============================================================================

INSERT INTO public.testimonials (name, role, quote, program, program_slug, published, featured, approved, display_order)
VALUES
  (
    'Guide',
    'Barber Apprenticeship Graduate',
    'From incarceration to owning my own chair. Elevate gave me structure, accountability, and a real pathway.',
    'Barber Apprenticeship',
    'barber-apprenticeship',
    true, true, true, 1
  ),
  (
    'Sharon',
    'Medical Assistant Graduate',
    'I''m a single mom and thought school wasn''t possible. Elevate helped me get funded, stay on track, and step into a real job.',
    'Medical Assistant',
    'medical-assistant',
    true, true, true, 2
  ),
  (
    'Alicia',
    'Healthcare Graduate',
    'They didn''t just enroll me and disappear. The coaching and employer connections made the difference.',
    'Healthcare',
    'cna',
    true, true, true, 3
  )
ON CONFLICT DO NOTHING;
