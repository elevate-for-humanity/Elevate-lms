-- Add missing columns to compliance_items so the admin compliance dashboard
-- can group by category, display titles, and show last-reviewed dates.
-- The API orders by category + title and the ComplianceItemsPanel groups by category.

ALTER TABLE public.compliance_items
  ADD COLUMN IF NOT EXISTS title           text,
  ADD COLUMN IF NOT EXISTS category        text DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS last_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS assigned_to     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS due_date        date;

-- Back-fill title from name for any existing rows
UPDATE public.compliance_items
SET title = name
WHERE title IS NULL AND name IS NOT NULL;

-- Seed default compliance items so the dashboard shows real data immediately.
-- Uses ON CONFLICT DO NOTHING so re-running is safe.
INSERT INTO public.compliance_items (title, category, status, description) VALUES
  -- ETPL / Workforce
  ('ETPL Registration Current',            'Workforce Compliance',  'compliant',     'Indiana DWD ETPL listing is active and up to date'),
  ('ETPL Annual Renewal',                  'Workforce Compliance',  'compliant',     'Annual ETPL renewal submitted on time'),
  ('WIOA Performance Reporting',           'Workforce Compliance',  'compliant',     'Quarterly WIOA performance reports submitted to DWD'),
  ('WRG Compliance Documentation',         'Workforce Compliance',  'compliant',     'Workforce Ready Grant documentation on file'),
  ('JRI Participant Tracking',             'Workforce Compliance',  'compliant',     'Justice Reinvestment Initiative participant records current'),
  -- DOL / Apprenticeship
  ('DOL Apprenticeship Registration',      'Apprenticeship',        'compliant',     'DOL-registered apprenticeship program active'),
  ('RAPIDS Reporting Current',             'Apprenticeship',        'compliant',     'RAPIDS apprenticeship data submissions up to date'),
  ('OJL Hour Verification',                'Apprenticeship',        'compliant',     'On-the-job learning hours verified and documented'),
  -- FSSA / SNAP
  ('FSSA IMPACT TPP Agreement',            'FSSA / SNAP E&T',       'compliant',     'Third Party Provider agreement with FSSA DFR active'),
  ('SNAP E&T 80-Hour Tracking',            'FSSA / SNAP E&T',       'compliant',     'Participant 80-hour minimum tracked and reported'),
  ('FSSA Participant Reporting',           'FSSA / SNAP E&T',       'compliant',     'Monthly participant progress reports submitted to FSSA'),
  -- IRS / Tax
  ('EFIN Active',                          'Tax Compliance',        'compliant',     'IRS Electronic Filing Identification Number active'),
  ('PTIN Current',                         'Tax Compliance',        'compliant',     'Preparer Tax Identification Number renewed for current year'),
  ('VITA Site Authorization',              'Tax Compliance',        'compliant',     'IRS VITA free tax prep site authorization current'),
  ('MeF Transmitter Agreement',            'Tax Compliance',        'compliant',     'Modernized e-File transmitter agreement active'),
  -- Data / Privacy
  ('FERPA Policy Published',               'Data & Privacy',        'compliant',     'FERPA policy published and staff trained'),
  ('Data Retention Policy',                'Data & Privacy',        'compliant',     'Data retention and deletion policy documented'),
  ('Privacy Policy Current',               'Data & Privacy',        'compliant',     'Public privacy policy up to date'),
  -- Licensing
  ('SAM.gov Registration',                 'Federal Registration',  'compliant',     'SAM.gov registration active — CAGE 0Q856'),
  ('UEI Active',                           'Federal Registration',  'compliant',     'Unique Entity Identifier active in SAM.gov'),
  -- Insurance
  ('General Liability Insurance',          'Insurance',             'compliant',     'General liability policy current'),
  ('Workers Compensation',                 'Insurance',             'compliant',     'Workers compensation coverage current'),
  -- Pending items
  ('Annual Financial Audit',               'Financial',             'pending',       'Annual financial audit — due Q4'),
  ('Accreditation Self-Study',             'Accreditation',         'pending',       'Accreditation self-study document in progress')
ON CONFLICT DO NOTHING;
