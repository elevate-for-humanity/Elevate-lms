-- External Submissions OS — Seed: Elevate for Humanity org record
-- Run AFTER migrations 20260527000005 through 20260527000010.
-- All values are placeholders — update via /admin/submissions/org before use.

DO $$
DECLARE
  v_org_id  UUID := 'e1e10000-0000-0000-0000-000000000001';
  v_style_id UUID := 'e1e10000-0000-0000-0000-000000000002';
BEGIN

-- ── Organization ─────────────────────────────────────────────────────────────
INSERT INTO public.sos_organizations (
  id, legal_name, dba_name, ein, uei, sam_status,
  website, phone, general_email,
  address_line_1, city, state, zip,
  authorized_signatory_name, authorized_signatory_title
) VALUES (
  v_org_id,
  'Elevate for Humanity Inc.',
  'Elevate for Humanity',
  NULL,           -- ← enter EIN in /admin/submissions/org
  NULL,           -- ← enter UEI after SAM.gov registration
  'unknown',
  'https://www.elevateforhumanity.org',
  '(317) 314-3757',
  'info@elevateforhumanity.org',
  NULL,           -- ← enter street address
  'Indianapolis', 'IN', NULL,
  NULL,           -- ← enter authorized signatory name
  NULL            -- ← enter authorized signatory title
)
ON CONFLICT (id) DO NOTHING;

-- ── Organization Profile ─────────────────────────────────────────────────────
INSERT INTO public.sos_organization_profiles (
  organization_id,
  mission_statement,
  target_populations,
  counties_served,
  service_area_notes,
  insurance_status,
  audit_status
) VALUES (
  v_org_id,
  'Elevate for Humanity empowers individuals through workforce development, registered apprenticeships, and career training programs that create pathways to sustainable employment.',
  'Underserved adults, justice-involved individuals, youth, and career changers seeking skilled trades and professional credentials',
  ARRAY['Marion','Hamilton','Hendricks','Johnson','Boone','Madison','Hancock'],
  'Central Indiana — statewide expansion in progress',
  'unknown',   -- ← update once insurance cert is uploaded
  'unknown'    -- ← update once audit is complete
)
ON CONFLICT (organization_id) DO NOTHING;

-- ── Default Document Style ───────────────────────────────────────────────────
INSERT INTO public.sos_document_styles (
  id, organization_id, style_name,
  primary_color, secondary_color,
  font_family,
  signatory_name, signatory_title,
  is_default
) VALUES (
  v_style_id,
  v_org_id,
  'Elevate for Humanity — Standard',
  '#1e3a5f',
  '#4a90d9',
  'Inter, sans-serif',
  NULL,   -- ← set after org profile is complete
  NULL,
  TRUE
)
ON CONFLICT (id) DO NOTHING;

-- ── Seed approved facts (known public data) ──────────────────────────────────
-- Only insert facts that are publicly verifiable. All others must be entered
-- and approved manually via /admin/submissions/facts.

INSERT INTO public.sos_organization_facts
  (organization_id, fact_key, fact_value_json, source_type, source_reference, status)
VALUES
  (v_org_id, 'org.website',
   '"https://www.elevateforhumanity.org"',
   'manual_entry', 'Public website', 'approved'),

  (v_org_id, 'org.phone',
   '"(317) 314-3757"',
   'manual_entry', 'Public contact', 'approved'),

  (v_org_id, 'org.state',
   '"Indiana"',
   'manual_entry', 'State of incorporation', 'approved'),

  (v_org_id, 'org.city',
   '"Indianapolis"',
   'manual_entry', 'Primary office location', 'approved'),

  (v_org_id, 'counties_served',
   '["Marion","Hamilton","Hendricks","Johnson","Boone","Madison","Hancock"]',
   'manual_entry', 'Service area documentation', 'approved'),

  (v_org_id, 'programs.barber_apprenticeship',
   '{"name":"Barber Apprenticeship","type":"DOL Registered Apprenticeship","hours_ojl":2000,"hours_rti":144,"credential":"Indiana Barber License","status":"active"}',
   'manual_entry', 'DOL RAPIDS registration', 'approved'),

  (v_org_id, 'programs.hvac_technician',
   '{"name":"HVAC Technician","type":"Credential Training","credential":"EPA 608 Certification","status":"active"}',
   'manual_entry', 'Program catalog', 'approved'),

  -- Facts that need to be verified and approved before use:
  (v_org_id, 'org.ein',
   'null',
   'manual_entry', 'Enter EIN from IRS documents', 'draft'),

  (v_org_id, 'org.uei',
   'null',
   'manual_entry', 'Enter UEI from SAM.gov', 'draft'),

  (v_org_id, 'annual_participants_served',
   'null',
   'manual_entry', 'Enter from most recent annual report', 'draft'),

  (v_org_id, 'job_placement_rate',
   'null',
   'manual_entry', 'Enter verified placement rate with source', 'draft'),

  (v_org_id, 'completion_rate',
   'null',
   'manual_entry', 'Enter verified completion rate with source', 'draft'),

  (v_org_id, 'staff_count',
   'null',
   'manual_entry', 'Enter current FTE + PT staff count', 'draft'),

  (v_org_id, 'wioa_eligible_programs',
   'null',
   'manual_entry', 'List WIOA-eligible programs after ETPL listing confirmed', 'draft')

ON CONFLICT DO NOTHING;

RAISE NOTICE 'Elevate for Humanity seed complete. Update draft facts at /admin/submissions/facts before using in packets.';

END $$;
