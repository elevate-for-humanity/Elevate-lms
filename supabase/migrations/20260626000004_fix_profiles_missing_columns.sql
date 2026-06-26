-- Fix missing columns in profiles table
-- Run in Supabase SQL Editor

-- Add verified column for employer/partner verification
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- Add company_name for employer profiles  
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Add company_logo for employer profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_logo TEXT;

-- Add verification status tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES profiles(id);

-- Set admin as verified by default
UPDATE profiles SET verified = true WHERE role IN ('admin', 'super_admin');

-- Verify the fix
SELECT 'Profiles fixed' as status;
SELECT role, verified, COUNT(*) FROM profiles GROUP BY role, verified;
