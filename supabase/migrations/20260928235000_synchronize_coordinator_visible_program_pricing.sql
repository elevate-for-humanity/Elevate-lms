-- Synchronize coordinator-visible catalog prices from the canonical program
-- definitions so oversight dashboards never hide known published amounts.
update public.programs
set tuition = case slug
      when 'construction-trades-certification' then 3800
      when 'emergency-health-safety' then 4950
      when 'forklift' then 500
      when 'hospitality' then 1800
      when 'office-administration' then 1800
      when 'project-management' then 2000
      else tuition
    end,
    total_cost = case slug
      when 'construction-trades-certification' then 3800
      when 'emergency-health-safety' then 4950
      when 'forklift' then 500
      when 'hospitality' then 1800
      when 'office-administration' then 1800
      when 'project-management' then 2000
      else total_cost
    end,
    price = case slug
      when 'construction-trades-certification' then 3800
      when 'emergency-health-safety' then 4950
      when 'forklift' then 500
      when 'hospitality' then 1800
      when 'office-administration' then 1800
      when 'project-management' then 2000
      else price
    end,
    is_free = false,
    funding_tags = case slug
      when 'construction-trades-certification' then array['WIOA','WRG','Self-Pay']::text[]
      when 'emergency-health-safety' then array['WIOA','Self-Pay']::text[]
      when 'forklift' then array['Self-Pay']::text[]
      when 'hospitality' then array['WIOA','WRG','Self-Pay']::text[]
      when 'office-administration' then array['WIOA','WRG','Self-Pay']::text[]
      when 'project-management' then array['WIOA','Self-Pay']::text[]
      else funding_tags
    end,
    funding = case slug
      when 'forklift' then 'Self-pay program. Any sponsor or workforce funding must be verified in writing before it is described as approved.'
      else 'Workforce funding may be available only after program eligibility, participant eligibility, and written agency authorization are verified. Self-pay remains available.'
    end,
    updated_at = now()
where slug in (
  'construction-trades-certification',
  'emergency-health-safety',
  'forklift',
  'hospitality',
  'office-administration',
  'project-management'
);
