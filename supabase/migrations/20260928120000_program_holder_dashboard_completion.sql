-- Complete Program Holder routing, communications, and PARIS directory data.
-- Code changes in the same release make the directory names audible, support
-- three-digit extension entry, and keep disabled extensions on PARIS callback routing.

update public.phone_systems
set
  greeting = 'Thank you for calling Elevate for Humanity. We help people build career skills, earn industry-recognized credentials, access workforce-funded training when eligible, and move toward employment or entrepreneurship. I am PARIS, your virtual career and admissions assistant. Please listen for the name of the person and program you need.',
  ai_instructions = 'Answer only approved Elevate for Humanity information. Be warm, clear, and concise. Explain that Elevate provides career and technical training, Registered Apprenticeship support, industry credentials, workforce pathways, and career support. Ask what the caller needs and answer approved questions. Collect a callback when the requested person is unavailable or when an answer is not established by approved information. Never promise funding, eligibility, financing approval, credentials, placement, dates, prices, or application status. Never collect Social Security numbers, payment-card details, passwords, medical information, or other highly sensitive information. For emergencies, direct the caller to hang up and call 911.',
  updated_at = now()
where id = '341f59a3-b1d6-4360-8463-0ce0402f86fe';

update public.phone_menu_options
set
  label = case digit
    when 0 then 'Elizabeth Greene, Administration and Admissions'
    when 1 then 'Amiko Martin, Technology and I T Programs'
    when 2 then 'David Nazaire, H V A C Certification'
    when 3 then 'Doreen Hawkins, Life Coach and Peer Support'
    when 4 then 'Doctor Carlina Wilkes, Business and Bookkeeping'
    when 5 then 'Jozanna George, Beauty, Barber, and Cosmetology'
    when 6 then 'K Singh, C D L Training'
    when 7 then 'Shawndra Quinn, Healthcare Programs'
    else label
  end,
  spoken_keywords = case digit
    when 0 then array['elizabeth','lizzy','greene','administration','administrator','admissions','enrollment','apply']::text[]
    when 1 then array['amiko','ameco','martin','technology','it','information technology','computer','cybersecurity','web development','software','network','data analytics','graphic design','cad']::text[]
    when 2 then array['david','nazaire','hvac','heating','cooling']::text[]
    when 3 then array['doreen','hawkins','life coach','peer support','recovery']::text[]
    when 4 then array['carlina','wilkes','business','bookkeeping','billing']::text[]
    when 5 then array['jozanna','george','beauty','barber','cosmetology','nail','esthetician']::text[]
    when 6 then array['k singh','singh','cdl','truck driving','commercial driver']::text[]
    when 7 then array['shawndra','quinn','healthcare','nursing','cna','qma','medical']::text[]
    else spoken_keywords
  end,
  updated_at = now()
where phone_system_id = '341f59a3-b1d6-4360-8463-0ce0402f86fe'
  and digit between 0 and 7;

update public.phone_destinations
set
  name = case extension_id
    when 'ea5439e0-014b-4020-8e25-e305f20c53d6'::uuid then 'Elizabeth Greene'
    when '43ce42a1-ce82-48f0-80e1-e1a08a4deb0e'::uuid then 'Amiko Martin'
    when '85977dc2-9346-46d8-9253-a712e31f3b4d'::uuid then 'David Nazaire'
    when '15b0004e-d94d-4888-9666-3a2d44a74ec5'::uuid then 'Doreen Hawkins'
    when 'fdddfa3f-7d32-41c6-8baf-7219297bd6b3'::uuid then 'Dr. Carlina A. Wilkes'
    when '3905b25f-fe5c-46d5-b81c-c181f685dd00'::uuid then 'Jozanna George'
    when '40369be7-abfe-4453-8c6a-b9da70ccf0a2'::uuid then 'KSingh'
    when 'f5ec6224-ad75-4924-9258-2454a01a8e7d'::uuid then 'Shawndra Quinn, RN'
    else name
  end,
  updated_at = now()
where phone_system_id = '341f59a3-b1d6-4360-8463-0ce0402f86fe';

-- A nonzero published tuition must never also be labeled free.
update public.programs
set is_free = false, updated_at = now()
where coalesce(tuition, total_cost, price, 0) > 0 and is_free = true;

-- Route every current application to every active/approved holder that owns its program.
insert into public.program_holder_students (
  program_holder_id,
  program_id,
  application_id,
  user_id,
  applicant_name,
  applicant_email,
  applicant_phone,
  status,
  application_status,
  notes,
  created_at,
  updated_at
)
select
  ph.id,
  a.program_id,
  a.id,
  a.user_id,
  coalesce(nullif(a.full_name, ''), nullif(a.name, ''), nullif(trim(concat_ws(' ', a.first_name, a.last_name)), ''), 'Applicant'),
  a.email,
  a.phone,
  case when lower(coalesce(a.status, '')) in ('applied','pending') then lower(a.status) else 'applicant' end,
  coalesce(nullif(a.status, ''), 'submitted'),
  'Automatically routed from active Program Holder program ownership.',
  coalesce(a.created_at, now()),
  now()
from public.program_holders ph
join public.program_holder_programs php
  on php.program_holder_id = ph.id and php.status = 'active'
join public.applications a
  on a.program_id = php.program_id
where lower(coalesce(ph.status, '')) in ('active','approved')
  and ph.user_id is not null
  and lower(coalesce(a.status, '')) not in ('denied','rejected','withdrawn','cancelled')
on conflict (program_holder_id, application_id) where application_id is not null do nothing;

-- Ensure every eligible active holder has an active official mailbox and membership.
select public.communication_email_provision_user(ph.user_id)
from public.program_holders ph
where ph.user_id is not null
  and lower(coalesce(ph.status, '')) in ('active','approved');
