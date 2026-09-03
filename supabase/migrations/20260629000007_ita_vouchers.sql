-- ITA (Individual Training Account) Vouchers
-- Tracks WIOA-funded training vouchers issued by WorkOne / EmployIndy.
-- Each row represents one voucher document from the LWDB.

CREATE TABLE IF NOT EXISTS public.ita_vouchers (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Participant
  participant_name      text        NOT NULL,
  ssn_last4             text,                        -- last 4 digits only
  state_id              text,                        -- Indiana State ID
  student_id            text,

  -- Voucher identifiers
  voucher_id            text        NOT NULL UNIQUE, -- e.g. '664344'
  app_id                text,                        -- WorkOne App ID e.g. '5516285'
  voucher_date          date,
  voucher_expire_date   date,

  -- Funding stream
  lwdb_region           text,                        -- e.g. 'Region 12'
  fund_stream           text,                        -- e.g. 'R12 WIOA DW - ITA'
  program_title         text,                        -- e.g. 'Title I - WIOA - Dislocated Worker'
  wioa_type             text,                        -- 'Adult' | 'Dislocated Worker' | 'Youth'
  service_code          text,                        -- e.g. '300'
  service_name          text,                        -- e.g. 'Hvac Technician (10004322 Indianapolis)'

  -- Provider
  provider_name         text,                        -- e.g. '2exclusive Llc-S'
  provider_fein         text,                        -- e.g. '882609728'
  vendor_id             text,                        -- e.g. '100006800'
  provider_address      text,

  -- Service dates
  service_start_date    date,
  service_end_date      date,

  -- Cost breakdown (all in USD)
  tuition_fee           numeric(10,2) DEFAULT 0,
  books                 numeric(10,2) DEFAULT 0,
  tools                 numeric(10,2) DEFAULT 0,
  supplies              numeric(10,2) DEFAULT 0,
  fees                  numeric(10,2) DEFAULT 0,
  test_fees             numeric(10,2) DEFAULT 0,
  other_costs           numeric(10,2) DEFAULT 0,
  admin_fees            numeric(10,2) DEFAULT 0,
  total_training_costs  numeric(10,2) DEFAULT 0,
  total_voucher_amount  numeric(10,2) DEFAULT 0,
  payments_to_date      numeric(10,2) DEFAULT 0,

  -- Status
  status                text NOT NULL DEFAULT 'approved'
                          CHECK (status IN ('approved','pending','invoiced','paid','expired','denied')),
  is_final              boolean DEFAULT false,
  comments              text,

  -- Remittance
  remittance_email      text,                        -- e.g. 'payables@employindy.org'

  -- Audit
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- Index for common lookups
CREATE INDEX IF NOT EXISTS idx_ita_vouchers_status        ON public.ita_vouchers(status);
CREATE INDEX IF NOT EXISTS idx_ita_vouchers_voucher_date  ON public.ita_vouchers(voucher_date);
CREATE INDEX IF NOT EXISTS idx_ita_vouchers_participant   ON public.ita_vouchers(participant_name);

-- RLS: admin/staff read-write, no public access
ALTER TABLE public.ita_vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ita_vouchers_admin_all" ON public.ita_vouchers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff', 'org_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff', 'org_admin')
    )
  );

-- ── Seed: Pedro Vera-Carpintero (Voucher 664344) ─────────────────────────────
INSERT INTO public.ita_vouchers (
  participant_name, ssn_last4, state_id, student_id,
  voucher_id, app_id, voucher_date, voucher_expire_date,
  lwdb_region, fund_stream, program_title, wioa_type,
  service_code, service_name,
  provider_name, provider_fein, vendor_id,
  provider_address,
  service_start_date, service_end_date,
  tuition_fee, books, tools, supplies, fees, test_fees, other_costs, admin_fees,
  total_training_costs, total_voucher_amount, payments_to_date,
  status, is_final, remittance_email, comments
) VALUES (
  'Pedro Vera-Carpintero', '5101', '17073486', 'N/A',
  '664344', '5516285', '2026-05-05', '2026-06-30',
  'Region 12', 'R12 WIOA DW - ITA',
  'Title I - Workforce Development (WIOA) - Dislocated Worker', 'Dislocated Worker',
  '300', 'Hvac Technician (10004322 Indianapolis)',
  '2exclusive Llc-S', '882609728', '100006800',
  '8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240',
  '2026-05-05', '2026-12-31',
  3070.00, 200.00, 600.00, 300.00, 500.00, 180.00, 150.00, 150.00,
  4020.00, 5000.00, 0.00,
  'approved', false, 'payables@employindy.org', 'Admin Fees: $150.00'
)
ON CONFLICT (voucher_id) DO NOTHING;

-- ── Seed: Austin F Fletcher (Voucher 664346) ─────────────────────────────────
INSERT INTO public.ita_vouchers (
  participant_name, ssn_last4, state_id, student_id,
  voucher_id, app_id, voucher_date, voucher_expire_date,
  lwdb_region, fund_stream, program_title, wioa_type,
  service_code, service_name,
  provider_name, provider_fein, vendor_id,
  provider_address,
  service_start_date, service_end_date,
  tuition_fee, books, tools, supplies, fees, test_fees, other_costs, admin_fees,
  total_training_costs, total_voucher_amount, payments_to_date,
  status, is_final, remittance_email, comments
) VALUES (
  'Austin F Fletcher', '1840', '17069782', 'N/A',
  '664346', '5509403', '2026-05-05', '2026-06-30',
  'Region 12', 'R12 WIOA Adult - ITA',
  'Title I - Workforce Development (WIOA) - Adult', 'Adult',
  '300', 'Hvac Technician (10004322 Indianapolis)',
  '2exclusive Llc-S', '882609728', '100006800',
  '8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240',
  '2026-05-05', '2026-12-31',
  3070.00, 200.00, 600.00, 300.00, 500.00, 180.00, 150.00, 150.00,
  4020.00, 5000.00, 0.00,
  'approved', false, 'payables@employindy.org', 'Admin Fees: $150.00'
)
ON CONFLICT (voucher_id) DO NOTHING;
