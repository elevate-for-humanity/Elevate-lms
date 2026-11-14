-- Add role column to payroll_profiles so program_holder/staff/contractor
-- can be distinguished per payout record.
ALTER TABLE public.payroll_profiles
  ADD COLUMN IF NOT EXISTS role TEXT;

CREATE INDEX IF NOT EXISTS idx_payroll_profiles_role
  ON public.payroll_profiles(role);
