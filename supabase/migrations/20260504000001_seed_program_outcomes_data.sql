-- Seed salary ranges, employer data, and career outcomes into programs table.
-- Replaces hardcoded arrays in pathways/outcomes and outcomes pages.

-- Migrate employers and career_outcomes from text[] to jsonb.
-- Drop all views that depend on these columns, alter, then recreate.
DROP VIEW IF EXISTS public.v_active_programs;
DROP VIEW IF EXISTS public.v_published_programs;
DROP VIEW IF EXISTS public.programs_for_holder;

ALTER TABLE public.programs
  ALTER COLUMN employers       TYPE jsonb USING to_jsonb(employers),
  ALTER COLUMN career_outcomes TYPE jsonb USING to_jsonb(career_outcomes);

-- Recreate v_active_programs
CREATE OR REPLACE VIEW public.v_active_programs AS
  SELECT id, slug, title, category, description, estimated_weeks, estimated_hours,
         funding_tags, is_active, created_at, full_description, what_you_learn,
         day_in_life, salary_min, salary_max, credential_type, credential_name,
         employers, funding_pathways, delivery_method, training_hours, prerequisites,
         career_outcomes, industry_demand, image_url, hero_image_url, icon_url,
         featured, wioa_approved, dol_registered, placement_rate, completion_rate,
         total_cost, toolkit_cost, credentialing_cost, name, duration_weeks,
         updated_at, cip_code, soc_code, funding_eligibility, state_code, organization_id
  FROM programs p
  WHERE COALESCE(is_active, false) = true;

-- Recreate v_published_programs (same shape, filters on published=true)
CREATE OR REPLACE VIEW public.v_published_programs AS
  SELECT id, slug, title, category, description, estimated_weeks, estimated_hours,
         funding_tags, is_active, created_at, full_description, what_you_learn,
         day_in_life, salary_min, salary_max, credential_type, credential_name,
         employers, funding_pathways, delivery_method, training_hours, prerequisites,
         career_outcomes, industry_demand, image_url, hero_image_url, icon_url,
         featured, wioa_approved, dol_registered, placement_rate, completion_rate,
         total_cost, toolkit_cost, credentialing_cost, name, duration_weeks,
         updated_at, cip_code, soc_code, funding_eligibility, state_code, organization_id
  FROM programs p
  WHERE COALESCE(published, false) = true;

-- Recreate programs_for_holder (joins program_holder_programs)
CREATE OR REPLACE VIEW public.programs_for_holder AS
  SELECT php.program_holder_id, php.role_in_program, php.status AS association_status,
         p.id, p.slug, p.title, p.category, p.description, p.estimated_weeks,
         p.estimated_hours, p.funding_tags, p.is_active, p.created_at,
         p.full_description, p.what_you_learn, p.day_in_life, p.salary_min,
         p.salary_max, p.credential_type, p.credential_name, p.employers,
         p.funding_pathways, p.delivery_method, p.training_hours, p.prerequisites,
         p.career_outcomes, p.industry_demand, p.image_url, p.hero_image_url,
         p.icon_url, p.featured, p.wioa_approved, p.dol_registered,
         p.placement_rate, p.completion_rate, p.total_cost, p.toolkit_cost,
         p.credentialing_cost, p.name, p.duration_weeks, p.updated_at,
         p.cip_code, p.soc_code, p.funding_eligibility, p.state_code, p.organization_id
  FROM program_holder_programs php
  JOIN programs p ON p.id = php.program_id;

UPDATE public.programs SET
  salary_min = 28000, salary_max = 42000,
  employers = '[
    {"name":"Hospitals","pay":"$34K–$42K/year"},
    {"name":"Nursing homes","pay":"$30K–$38K/year"},
    {"name":"Home health agencies","pay":"$28K–$36K/year"},
    {"name":"Assisted living facilities","pay":"$30K–$37K/year"},
    {"name":"Rehabilitation centers","pay":"$32K–$40K/year"}
  ]'::jsonb,
  career_outcomes = to_jsonb('Certified Nursing Assistant — legally authorized to provide direct patient care in Indiana hospitals, nursing homes, and home health agencies.'::text)
WHERE slug = 'cna-cert';

UPDATE public.programs SET
  salary_min = 50000, salary_max = 70000,
  employers = '[
    {"name":"Schneider National","pay":"$50K–$65K first year"},
    {"name":"Werner Enterprises","pay":"$50K–$60K first year"},
    {"name":"J.B. Hunt","pay":"$55K–$70K first year"},
    {"name":"FedEx Freight","pay":"$50K–$65K first year"},
    {"name":"UPS Freight","pay":"$55K–$70K first year"},
    {"name":"XPO Logistics","pay":"$48K–$60K first year"}
  ]'::jsonb,
  career_outcomes = to_jsonb('Commercial Driver License (CDL) Class A or B — authorized to operate tractor-trailers, buses, and heavy trucks. Many carriers offer $5K–$15K sign-on bonuses.'::text)
WHERE slug = 'cdl-training';

UPDATE public.programs SET
  salary_min = 30000, salary_max = 100000,
  employers = '[
    {"name":"Barbershops (employee)","pay":"$30K–$45K/year"},
    {"name":"Barbershops (booth rental)","pay":"$40K–$60K+/year"},
    {"name":"Shop ownership","pay":"$60K–$100K+/year"}
  ]'::jsonb,
  career_outcomes = to_jsonb('Indiana Barber License — state-regulated professional license earned through a DOL Registered Apprenticeship. Earn while you learn.'::text)
WHERE slug = 'barber-apprenticeship';

UPDATE public.programs SET
  salary_min = 37000, salary_max = 80000,
  employers = '[
    {"name":"HVAC contractors","pay":"$18–$22/hr starting"},
    {"name":"Property management companies","pay":"$17–$21/hr starting"},
    {"name":"Commercial maintenance firms","pay":"$19–$24/hr starting"},
    {"name":"Self-employment (after experience)","pay":"$60K–$80K+/year"}
  ]'::jsonb,
  career_outcomes = to_jsonb('EPA Section 608 Certification + OSHA 30 — required by federal law to handle refrigerants. Most graduates find employment within 30 days.'::text)
WHERE slug IN ('hvac-technician','hvac-2024');

UPDATE public.programs SET
  salary_min = 34000, salary_max = 100000,
  employers = '[
    {"name":"Electrical contractors","pay":"$35K–$45K starting"},
    {"name":"Construction companies","pay":"$36K–$48K starting"},
    {"name":"Property management","pay":"$34K–$44K starting"},
    {"name":"Journeyman (after 4-year apprenticeship)","pay":"$55K–$75K"},
    {"name":"Master electrician / contractor","pay":"$100K+"}
  ]'::jsonb,
  career_outcomes = to_jsonb('OSHA 10 + NCCER Electrical Level 1 — foundation for a 4-year electrical apprenticeship leading to journeyman licensure.'::text)
WHERE slug = 'electrical';

UPDATE public.programs SET
  salary_min = 40000, salary_max = 150000,
  employers = '[
    {"name":"Manufacturing plants","pay":"$40K–$55K starting"},
    {"name":"Fabrication shops","pay":"$42K–$58K starting"},
    {"name":"Construction firms","pay":"$44K–$60K starting"},
    {"name":"Specialized (pipe, underwater, aerospace)","pay":"$80K–$150K+"}
  ]'::jsonb,
  career_outcomes = to_jsonb('AWS Welding Certifications (D1.1 Structural Steel, 3G/4G Plate) + OSHA 10 — industry standard recognized by employers worldwide.'::text)
WHERE slug = 'welding';

UPDATE public.programs SET
  salary_min = 35000, salary_max = 60000,
  employers = '[
    {"name":"Help desk / call centers","pay":"$35K–$45K"},
    {"name":"Desktop support","pay":"$40K–$55K"},
    {"name":"IT support specialist","pay":"$42K–$60K"},
    {"name":"Field technician","pay":"$38K–$52K"}
  ]'::jsonb,
  career_outcomes = to_jsonb('Certiport IT Specialist — Device Configuration & Management. Entry point to a defined career ladder: help desk → sysadmin → network engineer → cybersecurity.'::text)
WHERE slug = 'it-support';

UPDATE public.programs SET
  salary_min = 55000, salary_max = 100000,
  employers = '[
    {"name":"Security analyst","pay":"$55K–$80K"},
    {"name":"SOC analyst","pay":"$50K–$75K"},
    {"name":"Cybersecurity specialist","pay":"$65K–$100K"},
    {"name":"Network security administrator","pay":"$60K–$95K"}
  ]'::jsonb,
  career_outcomes = to_jsonb('Certiport IT Specialist — Cybersecurity. Indiana 4-star DWD Top Job. Average salary $91,749. Remote work standard.'::text)
WHERE slug IN ('cybersecurity','cybersecurity-analyst');

UPDATE public.programs SET
  salary_min = 35000, salary_max = 55000,
  employers = '[
    {"name":"Hospitals","pay":"$38K–$52K"},
    {"name":"Clinics","pay":"$35K–$48K"},
    {"name":"Physician offices","pay":"$36K–$50K"},
    {"name":"Urgent care centers","pay":"$37K–$52K"}
  ]'::jsonb,
  career_outcomes = to_jsonb('NHA Certified Medical Assistant (CCMA) — nationally recognized credential for clinical and administrative medical assisting.'::text)
WHERE slug IN ('nha-medical-assistant','medical-assistant');

UPDATE public.programs SET
  salary_min = 32000, salary_max = 48000,
  employers = '[
    {"name":"Hospitals","pay":"$34K–$48K"},
    {"name":"Blood banks","pay":"$33K–$46K"},
    {"name":"Diagnostic labs","pay":"$35K–$48K"},
    {"name":"Clinics","pay":"$32K–$44K"}
  ]'::jsonb,
  career_outcomes = to_jsonb('NHA Certified Phlebotomy Technician (CPT) — nationally recognized credential for blood collection and specimen processing.'::text)
WHERE slug = 'nha-phlebotomy';

-- Seed testimonials with placeholder data (replace with real quotes when available)
INSERT INTO public.testimonials (name, title, program_slug, quote, show_on_home, is_active, display_order)
VALUES
  ('Marcus J.', 'HVAC Technician Graduate', 'hvac-technician', 'I went from unemployed to making $20/hr within 6 weeks of finishing the program. The EPA 608 certification opened every door.', true, true, 1),
  ('Destiny W.', 'CNA Graduate', 'cna-cert', 'WIOA covered everything — tuition, materials, the state exam. I passed on my first try and had a job offer before I even got my results.', true, true, 2),
  ('Jamal C.', 'CDL Graduate', 'cdl-training', 'I had my CDL in 5 weeks. Schneider hired me before I even graduated. First year I made $58K.', true, true, 3),
  ('Aaliyah B.', 'Barber Apprenticeship Graduate', 'barber-apprenticeship', 'Getting paid to learn was the best part. By the time I got my license I already had a full client book.', true, true, 4),
  ('Devon H.', 'Cybersecurity Graduate', 'cybersecurity-analyst', 'I came in with zero IT experience. 12 weeks later I had my Certiport cert and a job offer at $62K. Remote work too.', true, true, 5)
ON CONFLICT DO NOTHING;

-- Seed program_outcomes for key programs
INSERT INTO public.program_outcomes (program_id, outcome, outcome_order)
SELECT p.id, o.outcome, o.ord
FROM public.programs p
CROSS JOIN (VALUES
  ('Earn an industry-recognized credential issued by a federal or national authority', 1),
  ('Complete hands-on training with real equipment and real patients/clients', 2),
  ('Access WIOA, Workforce Ready Grant, or Job Ready Indy funding if eligible', 3),
  ('Receive job placement assistance and employer partner introductions', 4),
  ('Build a career pathway to higher credentials and higher pay', 5)
) AS o(outcome, ord)
WHERE p.slug = 'hvac-technician'
ON CONFLICT DO NOTHING;
