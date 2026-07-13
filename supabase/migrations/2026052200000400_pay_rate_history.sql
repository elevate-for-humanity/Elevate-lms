-- Pay rate history audit table
CREATE TABLE IF NOT EXISTS public.pay_rate_history (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id    UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  rate           NUMERIC(10,2),
  payment_type   TEXT,   -- hourly | salary | contractor
  payout_method  TEXT,   -- direct_deposit | check | payroll_card
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  set_by         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pay_rate_history_employee
  ON public.pay_rate_history(employee_id, effective_date DESC);

ALTER TABLE public.pay_rate_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_pay_rate_history"
  ON public.pay_rate_history
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );
