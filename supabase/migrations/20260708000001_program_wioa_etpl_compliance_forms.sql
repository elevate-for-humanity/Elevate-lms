-- WIOA / INTraining ETPL compliance forms (per program)
-- 1) Initial Eligibility Aggregate Performance (IEAP) — new programs only
-- 2) Section 188 Equal Opportunity Compliance Checklist — all programs

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS etpl_listed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS etpl_requires_initial_eligibility boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS intraining_program_id text;

COMMENT ON COLUMN public.programs.etpl_requires_initial_eligibility IS
  'When true, staff must complete the Initial Eligibility Aggregate Performance form before ETPL submission for this program.';

-- Existing INTraining-listed programs are not "new" for IEAP purposes
UPDATE public.programs
SET etpl_requires_initial_eligibility = false
WHERE intraining_program_id IS NOT NULL AND btrim(intraining_program_id) <> '';

CREATE TABLE IF NOT EXISTS public.program_wioa_compliance_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  form_type text NOT NULL CHECK (
    form_type IN (
      'initial_eligibility_aggregate_performance',
      'section_188_checklist'
    )
  ),
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
  completed_at timestamptz,
  completed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_id, form_type)
);

CREATE INDEX IF NOT EXISTS idx_program_wioa_compliance_forms_program
  ON public.program_wioa_compliance_forms (program_id);

CREATE INDEX IF NOT EXISTS idx_program_wioa_compliance_forms_status
  ON public.program_wioa_compliance_forms (form_type, status);

DROP TRIGGER IF EXISTS trg_program_wioa_compliance_forms_updated_at
  ON public.program_wioa_compliance_forms;
CREATE TRIGGER trg_program_wioa_compliance_forms_updated_at
  BEFORE UPDATE ON public.program_wioa_compliance_forms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.program_wioa_compliance_forms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "program_wioa_compliance_forms_admin_all"
  ON public.program_wioa_compliance_forms;
CREATE POLICY "program_wioa_compliance_forms_admin_all"
  ON public.program_wioa_compliance_forms
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'staff')
    )
  );

INSERT INTO public.compliance_items (title, category, status, description)
VALUES
  (
    'IEAP — Initial Eligibility Aggregate Performance (new programs)',
    'Workforce Compliance',
    'pending',
    'One completed IEAP per new ETPL/INTraining program before initial listing'
  ),
  (
    'Section 188 Equal Opportunity Compliance Checklist',
    'Workforce Compliance',
    'pending',
    'Completed Section 188 / 29 CFR Part 38 checklist per program location'
  )
ON CONFLICT DO NOTHING;
