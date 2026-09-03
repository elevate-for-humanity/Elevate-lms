-- EmployIndy ACH payment received via FISPAN on 2026-05-15
-- $10,000 total across two HVAC vouchers (Pedro Vera-Carpintero + Austin F Fletcher)
-- Invoice date: 2026-05-11 | Payment initiated: 2026-05-15

UPDATE public.ita_vouchers
SET
  status           = 'paid',
  payments_to_date = total_voucher_amount,
  is_final         = true,
  comments         = COALESCE(comments || ' | ', '') ||
                     'ACH payment $5,000.00 initiated 2026-05-15 via EmployIndy/FISPAN (PINACLE PNC). Invoice date 2026-05-11.',
  updated_at       = now()
WHERE voucher_id IN ('664344', '664346');
