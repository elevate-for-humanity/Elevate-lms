-- Backfill 2 missing program_enrollments for approved HVAC applicants
-- Root cause: approve.ts upsert used onConflict:'user_id,program_slug' but
-- program_slug was NULL on both applications — NULL != NULL in SQL unique
-- constraints so the insert silently failed. Fixed in approve.ts.
--
-- Montrell Leslie  — app 3c926418, user a1bd80f4
-- Jones Elysee     — app b7d5a20e, user 9f37400c
-- Program: HVAC Technician (4226f7f6-fbc1-44b5-83e8-b12ea149e4c7, slug: hvac-technician)

INSERT INTO public.program_enrollments (
  user_id, program_id, program_slug, email, full_name,
  amount_paid_cents, funding_source, status, enrollment_state,
  funding_verified, payout_status, at_risk, created_at, updated_at
)
VALUES
  (
    'a1bd80f4-f8e2-4e3b-9d45-9432c0772d44',
    '4226f7f6-fbc1-44b5-83e8-b12ea149e4c7',
    'hvac-technician',
    'montrellleslie@gmail.com',
    'Montrell Leslie',
    0, 'pending', 'active', 'active',
    false, 'pending', false,
    now(), now()
  ),
  (
    '9f37400c-dc85-4035-acff-368794512992',
    '4226f7f6-fbc1-44b5-83e8-b12ea149e4c7',
    'hvac-technician',
    'ejhonaken@gmail.com',
    'Jones Elysee',
    0, 'pending', 'active', 'active',
    false, 'pending', false,
    now(), now()
  )
ON CONFLICT (user_id, program_slug) DO NOTHING;

-- enrollments is a view — skip direct insert, program_enrollments above is sufficient.

-- Backfill program_slug on the applications so the approval pipeline doesn't re-hit this
UPDATE public.applications SET program_slug = 'hvac-technician'
WHERE id IN (
  '3c926418-6df5-4776-97ef-abadcf2085c6',
  'b7d5a20e-d43b-49d9-b9c2-3ec05434bc3b'
) AND program_slug IS NULL;
