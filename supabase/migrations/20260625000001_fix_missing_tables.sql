-- Migration: Fix missing tables that caused runtime errors
-- Applied: 2026-06-25
-- Issue: positions and volunteer_opportunities tables missing from prod DB

-- positions table (matches baseline migration schema)
CREATE TABLE IF NOT EXISTS public.positions (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  title text,
  description text,
  department_id uuid,
  min_salary numeric,
  max_salary numeric,
  is_active boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS for positions (match baseline)
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.positions TO service_role;
GRANT SELECT ON public.positions TO authenticated;

-- volunteer_opportunities table (matches baseline migration schema)
CREATE TABLE IF NOT EXISTS public.volunteer_opportunities (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  title text,
  description text,
  commitment_type text,
  location text,
  skills_needed jsonb DEFAULT '[]',
  status text DEFAULT 'active',
  available_slots integer,
  filled_slots integer DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS for volunteer_opportunities (match baseline)
ALTER TABLE public.volunteer_opportunities ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.volunteer_opportunities TO service_role;
GRANT SELECT ON public.volunteer_opportunities TO authenticated;

-- Record this migration
INSERT INTO public.efh_migrations (filename, executed_at)
VALUES ('20260625000001_fix_missing_tables.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
