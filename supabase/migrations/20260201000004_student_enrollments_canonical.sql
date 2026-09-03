-- Canonical student_enrollments table for program enrollment checkout
-- This is the single source of truth for paid/funded program enrollments

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.student_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  program_id UUID,
  program_slug TEXT,
  stripe_checkout_session_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  funding_source TEXT DEFAULT 'self_pay',
  amount_paid NUMERIC DEFAULT 0,
  region_id TEXT DEFAULT 'IN',
  transfer_hours NUMERIC DEFAULT 0,
  required_hours NUMERIC DEFAULT 1500,
  has_host_shop BOOLEAN DEFAULT false,
  host_shop_name TEXT,
  case_id UUID,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if table already exists (idempotent)
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS program_slug TEXT;
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS funding_source TEXT DEFAULT 'self_pay';
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0;
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS region_id TEXT DEFAULT 'IN';
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS transfer_hours NUMERIC DEFAULT 0;
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS required_hours NUMERIC DEFAULT 1500;
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS has_host_shop BOOLEAN DEFAULT false;
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS host_shop_name TEXT;
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS case_id UUID;
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Create unique constraint on stripe_checkout_session_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'student_enrollments_stripe_checkout_session_id_key'
  ) THEN
    ALTER TABLE public.student_enrollments 
    ADD CONSTRAINT student_enrollments_stripe_checkout_session_id_key 
    UNIQUE (stripe_checkout_session_id);
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Indexes for common queries
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS student_id TEXT;
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_id ON public.student_enrollments(student_id);
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS program_slug TEXT;
CREATE INDEX IF NOT EXISTS idx_student_enrollments_program_slug ON public.student_enrollments(program_slug);
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_student_enrollments_status ON public.student_enrollments(status);
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;
CREATE INDEX IF NOT EXISTS idx_student_enrollments_stripe_session ON public.student_enrollments(stripe_checkout_session_id);

-- Enable RLS
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.student_enrollments;
CREATE POLICY "Students can view own enrollments" ON public.student_enrollments
  FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Service role full access" ON public.student_enrollments;
CREATE POLICY "Service role full access" ON public.student_enrollments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Staff can view all enrollments" ON public.student_enrollments;
CREATE POLICY "Staff can view all enrollments" ON public.student_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'staff', 'instructor')
    )
  );

-- Grant permissions
GRANT SELECT ON public.student_enrollments TO authenticated;
GRANT ALL ON public.student_enrollments TO service_role;

COMMENT ON TABLE public.student_enrollments IS 'Canonical table for all program enrollments (paid and funded)';
COMMENT ON COLUMN public.student_enrollments.stripe_checkout_session_id IS 'Stripe checkout session ID - unique, used for idempotent provisioning';
COMMENT ON COLUMN public.student_enrollments.funding_source IS 'self_pay, workone, wioa, grant, employer';
