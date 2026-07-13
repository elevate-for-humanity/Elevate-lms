-- Seed known org data into the primary sos_organizations row.
-- Source: lib/grants/org-profile.ts + verified SAM.gov records.
-- Ensures contract/grant prefill resolves without manual admin save.

UPDATE public.sos_organizations
SET
  legal_name                 = '2Exclusive LLC-S',
  dba_name                   = 'Elevate for Humanity Technical and Career Institute',
  uei                        = 'VX2GK5S8SZH8',
  sam_status                 = 'active',
  sam_expiration             = '2026-06-29',
  address_line_1             = '8888 Keystone Crossing, Suite 1300',
  city                       = 'Indianapolis',
  state                      = 'IN',
  zip                        = '46240',
  phone                      = '(317) 314-3757',
  general_email              = 'elevate4humanityedu@gmail.com',
  website                    = 'https://www.elevateforhumanity.org',
  authorized_signatory_name  = 'Elizabeth Greene',
  authorized_signatory_title = 'Founder & Chief Executive Officer',
  updated_at                 = NOW()
WHERE id = 'e1e10000-0000-0000-0000-000000000001';

-- Insert approved facts (CAGE, EIN, signatory, etc.) scoped to this org.
-- These have no column on sos_organizations so they live in the facts table.
DO $$
DECLARE
  org_id UUID := 'e1e10000-0000-0000-0000-000000000001';
  facts  JSONB := '[
    {"key": "cage_code",               "val": "0QH19"},
    {"key": "ein",                     "val": "Available upon request"},
    {"key": "authorized_signer",       "val": "Elizabeth Greene"},
    {"key": "authorized_signer_title", "val": "Founder & Chief Executive Officer"},
    {"key": "executive_director",      "val": "Dr. Carlina Wilkes"},
    {"key": "dol_sponsor",             "val": "DOL Registered Apprenticeship Sponsor (RAPIDS: 2025-IN-132301)"},
    {"key": "etpl_status",             "val": "ETPL listed provider"},
    {"key": "funding_approvals",       "val": "WRG, WIOA, and JRI approved"}
  ]';
  f JSONB;
BEGIN
  FOR f IN SELECT * FROM jsonb_array_elements(facts)
  LOOP
    DELETE FROM public.sos_organization_facts
      WHERE organization_id = org_id AND fact_key = f->>'key';
    INSERT INTO public.sos_organization_facts
      (organization_id, fact_key, fact_value_json, source_type, status)
    VALUES
      (org_id, f->>'key', to_jsonb(f->>'val'), 'manual_entry', 'approved');
  END LOOP;
END $$;

-- Additional facts seeded 2026-05-18 (applied directly via client)
-- target_population, geographic_area, years_operating
-- These allow GrantApplicationForm to resolve from DB instead of static ORG_PROFILE constants.
