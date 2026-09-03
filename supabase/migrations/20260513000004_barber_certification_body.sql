-- Seed certification body for Indiana Barber licensing pathway
-- Supports blueprint certificationPathway for barber-apprenticeship-v1

INSERT INTO public.certification_bodies (
  id,
  name,
  abbreviation,
  website,
  application_url,
  contact_email,
  state,
  notes
)
VALUES (
  'cb000000-0000-0000-0000-000000000006',
  'Indiana Professional Licensing Agency - State Board of Cosmetology and Barber Examiners',
  'IN-PLA-SBCBE',
  'https://www.in.gov/pla/',
  'https://www.in.gov/pla/professions/cosmetology-and-barber-board/',
  NULL,
  'IN',
  'State board authority for Indiana barber licensing examinations and licensure requirements.'
)
ON CONFLICT (name) DO UPDATE SET
  abbreviation = EXCLUDED.abbreviation,
  website = EXCLUDED.website,
  application_url = EXCLUDED.application_url,
  contact_email = EXCLUDED.contact_email,
  state = EXCLUDED.state,
  notes = EXCLUDED.notes,
  updated_at = now();
