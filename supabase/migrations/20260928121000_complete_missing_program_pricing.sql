-- Fill every missing amount in the active Program Holder catalog from the
-- current Elevate public catalog and the existing internal IT partner record.
update public.programs
set
  tuition = values_to_apply.amount,
  total_cost = values_to_apply.amount,
  price = values_to_apply.amount,
  is_free = false,
  funding_eligible = values_to_apply.funding_eligible,
  wioa_approved = values_to_apply.wioa_approved,
  etpl_listed = case when values_to_apply.slug = 'network-administration' then true else etpl_listed end,
  funding = case when values_to_apply.slug = 'network-administration'
    then 'WIOA and workforce funding may be available for eligible participants after written agency authorization. Self-pay remains available.'
    else 'Self-pay program. Any workforce or employer funding must be separately verified in writing before it is described as approved.'
  end,
  funding_tags = case
    when values_to_apply.slug = 'network-administration' then array['WIOA','WRG','Self-Pay']::text[]
    else array['Self-Pay']::text[]
  end,
  updated_at = now()
from (values
  ('cad-drafting', 4000.00::numeric, false, false),
  ('graphic-design', 4000.00::numeric, false, false),
  ('information-technology', 1800.00::numeric, false, false),
  ('it-help-desk', 2800.00::numeric, false, false),
  ('network-administration', 4500.00::numeric, true, true),
  ('network-support-technician', 2500.00::numeric, false, false),
  ('software-development', 5000.00::numeric, false, false),
  ('peer-recovery-specialist', 5000.00::numeric, false, false)
) as values_to_apply(slug, amount, funding_eligible, wioa_approved)
where public.programs.slug = values_to_apply.slug;
