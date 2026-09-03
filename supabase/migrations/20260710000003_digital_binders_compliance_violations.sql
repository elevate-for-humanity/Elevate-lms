-- digital_binders: learner document binder per enrollment (ensure-digital-binder.ts)
-- compliance_violations: program-holder guardrail metrics (guardrail-engine.ts)

CREATE TABLE IF NOT EXISTS public.digital_binders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES public.program_enrollments (id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT 'Student Digital Binder',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS digital_binders_user_id_idx ON public.digital_binders (user_id);
CREATE INDEX IF NOT EXISTS digital_binders_enrollment_id_idx ON public.digital_binders (enrollment_id);

ALTER TABLE public.digital_binders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "digital_binders_select_own" ON public.digital_binders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "digital_binders_insert_own" ON public.digital_binders
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "digital_binders_update_own" ON public.digital_binders
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "digital_binders_service_role_all" ON public.digital_binders
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.compliance_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_holder_id uuid NOT NULL,
  violation_type text NOT NULL CHECK (
    violation_type IN (
      'fraud_suspected',
      'data_quality',
      'credential_misuse',
      'safety_violation'
    )
  ),
  severity text NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor', 'major', 'critical')),
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS compliance_violations_holder_idx
  ON public.compliance_violations (program_holder_id, created_at DESC);

CREATE INDEX IF NOT EXISTS compliance_violations_type_idx
  ON public.compliance_violations (violation_type, created_at DESC);

ALTER TABLE public.compliance_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "compliance_violations_admin_read" ON public.compliance_violations
  FOR SELECT TO authenticated
  USING (public.is_admin_role());

CREATE POLICY "compliance_violations_service_role_all" ON public.compliance_violations
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
