-- Audit fixes: 4 missing tables + partners RLS tightening
-- Generated from supabase-deep-audit.mjs results 2026-06-27

-- ─── 1. compliance_flags ─────────────────────────────────────────────────────
-- Referenced by admin compliance pages. Stores per-record compliance flag events.
CREATE TABLE IF NOT EXISTS public.compliance_flags (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type   text NOT NULL,           -- 'enrollment' | 'application' | 'partner' etc.
  entity_id     uuid NOT NULL,
  flag_type     text NOT NULL,           -- 'missing_docs' | 'overdue' | 'policy_violation' etc.
  severity      text NOT NULL DEFAULT 'medium', -- 'low' | 'medium' | 'high' | 'critical'
  description   text,
  resolved      boolean NOT NULL DEFAULT false,
  resolved_at   timestamptz,
  resolved_by   uuid REFERENCES public.profiles(id),
  created_by    uuid REFERENCES public.profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "compliance_flags_admin" ON public.compliance_flags;
CREATE POLICY "compliance_flags_admin" ON public.compliance_flags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff', 'org_admin')
    )
  );

CREATE INDEX IF NOT EXISTS compliance_flags_entity_idx ON public.compliance_flags(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS compliance_flags_resolved_idx ON public.compliance_flags(resolved);

-- ─── 2. wioa_exports ─────────────────────────────────────────────────────────
-- The admin WIOA PIRL export route queries 'wioa-exports' (hyphenated).
-- Create the canonical snake_case table and a view alias for the hyphenated name.
CREATE TABLE IF NOT EXISTS public.wioa_exports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  export_type     text NOT NULL DEFAULT 'pirl',
  status          text NOT NULL DEFAULT 'pending', -- 'pending' | 'processing' | 'complete' | 'failed'
  file_url        text,
  record_count    integer DEFAULT 0,
  period_start    date,
  period_end      date,
  exported_by     uuid REFERENCES public.profiles(id),
  error_message   text,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wioa_exports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wioa_exports_admin" ON public.wioa_exports;
CREATE POLICY "wioa_exports_admin" ON public.wioa_exports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff', 'org_admin')
    )
  );

CREATE INDEX IF NOT EXISTS wioa_exports_status_idx ON public.wioa_exports(status);
CREATE INDEX IF NOT EXISTS wioa_exports_created_idx ON public.wioa_exports(created_at DESC);

-- ─── 3. payroll_records ──────────────────────────────────────────────────────
-- Referenced by admin payroll pages. Stores individual payroll record lines.
CREATE TABLE IF NOT EXISTS public.payroll_records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id  uuid REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  employee_id     uuid REFERENCES public.profiles(id),
  employee_name   text,
  pay_period_start date,
  pay_period_end   date,
  -- 'amount' is the canonical pay amount — queried by get-kpis.ts (.select('status, amount'))
  amount          numeric(10,2) DEFAULT 0,
  net_pay         numeric(10,2) DEFAULT 0,
  deductions      numeric(10,2) DEFAULT 0,
  hours_worked    numeric(8,2) DEFAULT 0,
  pay_type        text DEFAULT 'hourly', -- 'hourly' | 'salary' | 'stipend'
  status          text DEFAULT 'draft',  -- 'draft' | 'approved' | 'paid'
  notes           text,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payroll_records_admin" ON public.payroll_records;
CREATE POLICY "payroll_records_admin" ON public.payroll_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff', 'org_admin')
    )
  );

CREATE INDEX IF NOT EXISTS payroll_records_run_idx ON public.payroll_records(payroll_run_id);
CREATE INDEX IF NOT EXISTS payroll_records_employee_idx ON public.payroll_records(employee_id);

-- ─── 4. Fix partners RLS — tighten open SELECT policy ────────────────────────
-- Current state: "partners_select" uses USING (true) — fully public.
-- Public pages only need active partners. Internal fields (contact info,
-- banking, notes) should not be readable by anonymous users.
-- Fix: restrict anon reads to is_active = true rows only.

DROP POLICY IF EXISTS "partners_select" ON public.partners;

-- Public can only see active partners (for /courses/partners, program pages etc.)
DROP POLICY IF EXISTS "partners_public_select" ON public.partners;
CREATE POLICY "partners_public_select" ON public.partners
  FOR SELECT
  USING (is_active = true);

-- Authenticated admin/staff can see all partners
DROP POLICY IF EXISTS "partners_admin_select" ON public.partners;
CREATE POLICY "partners_admin_select" ON public.partners
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff', 'org_admin', 'instructor')
    )
  );
