-- Beauty Industry Apprenticeship Programs Schema
-- Nail Technician, Esthetician, Cosmetology
-- All ETPL approved, DOL Registered

-- Indiana Hour Categories for Beauty Programs
INSERT INTO indiana_hour_categories (code, name, description, hour_type, min_hours) VALUES
  -- Nail Technician (450 hours total)
  ('NAIL_SANITATION', 'Nail Sanitation & Safety', 'Health and safety procedures for nail services', 'RTI', 45),
  ('NAIL_MANICURE', 'Manicure Services', 'Basic and advanced manicure techniques', 'OJT', 150),
  ('NAIL_PEDICURE', 'Pedicure Services', 'Basic and advanced pedicure techniques', 'OJT', 100),
  ('NAIL_ENHANCEMENTS', 'Nail Enhancements', 'Acrylics, gels, nail art', 'OJT', 130),
  ('NAIL_BUSINESS', 'Nail Business Practices', 'Salon management, client relations', 'RTI', 25),
  
  -- Esthetician (700 hours total)
  ('ESTH_SANITATION', 'Esthetician Sanitation & Safety', 'Health and safety for skincare', 'RTI', 70),
  ('ESTH_FACIAL', 'Facial Treatments', 'Basic and advanced facial techniques', 'OJT', 250),
  ('ESTH_BODY', 'Body Treatments', 'Body wraps, exfoliation, massage', 'OJT', 150),
  ('ESTH_HAIR_REMOVAL', 'Hair Removal', 'Waxing, threading, other methods', 'OJT', 100),
  ('ESTH_MAKEUP', 'Makeup Application', 'Professional makeup techniques', 'OJT', 80),
  ('ESTH_BUSINESS', 'Esthetician Business Practices', 'Spa management, client relations', 'RTI', 50),
  
  -- Cosmetology (1500 hours total)
  ('COSMO_SANITATION', 'Cosmetology Sanitation & Safety', 'Health and safety procedures', 'RTI', 75),
  ('COSMO_HAIR_CUTTING', 'Hair Cutting & Styling', 'Cutting, styling, updos', 'OJT', 400),
  ('COSMO_HAIR_COLOR', 'Hair Coloring', 'Color theory, application, correction', 'OJT', 300),
  ('COSMO_CHEMICAL', 'Chemical Services', 'Perms, relaxers, treatments', 'OJT', 200),
  ('COSMO_SKINCARE', 'Basic Skincare', 'Facials, makeup application', 'OJT', 150),
  ('COSMO_NAILS', 'Basic Nail Services', 'Manicures, pedicures', 'OJT', 100),
  ('COSMO_BUSINESS', 'Cosmetology Business Practices', 'Salon management, client relations', 'RTI', 75)
ON CONFLICT DO NOTHING;

-- Program definitions for reference
CREATE TABLE IF NOT EXISTS apprenticeship_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  state text NOT NULL DEFAULT 'IN',
  required_hours integer NOT NULL,
  program_fee numeric NOT NULL,
  vendor_name text,
  vendor_cost numeric DEFAULT 0,
  licensing_agency text,
  occupation_code text,
  is_etpl_approved boolean DEFAULT true,
  is_active boolean DEFAULT true,
  description text,
  disclaimer text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert program definitions
INSERT INTO apprenticeship_programs (slug, name, state, required_hours, program_fee, vendor_name, vendor_cost, licensing_agency, occupation_code, description, disclaimer) VALUES
  ('barber-apprenticeship', 'Registered Barber Apprenticeship', 'IN', 1500, 4980, 'milady', 386, 'Indiana Professional Licensing Agency (IPLA)', '39-5011.00', 
   'Registered Barber Apprenticeship Sponsorship, Oversight & Related Instruction (Milady Theory). This program provides federal apprenticeship sponsorship, employer coordination, compliance reporting, and related instruction.',
   'This program is not a barber school and does not issue state licensure hours. Enrollment requires concurrent or subsequent participation in a licensed barber school for state licensure eligibility.'),
  
  ('nail-technician-apprenticeship', 'Registered Nail Technician Apprenticeship', 'IN', 450, 2980, 'milady', 200, 'Indiana Professional Licensing Agency (IPLA)', '39-5092.00',
   'Registered Nail Technician Apprenticeship Sponsorship, Oversight & Related Instruction (Milady Theory). This program provides federal apprenticeship sponsorship, employer coordination, compliance reporting, and related instruction.',
   'This program is not a nail technician school and does not issue state licensure hours. Enrollment requires concurrent or subsequent participation in a licensed nail technician school for state licensure eligibility.'),
  
  ('esthetician-apprenticeship', 'Registered Esthetician Apprenticeship', 'IN', 700, 3480, 'milady', 250, 'Indiana Professional Licensing Agency (IPLA)', '39-5094.00',
   'Registered Esthetician Apprenticeship Sponsorship, Oversight & Related Instruction (Milady Theory). This program provides federal apprenticeship sponsorship, employer coordination, compliance reporting, and related instruction.',
   'This program is not an esthetician school and does not issue state licensure hours. Enrollment requires concurrent or subsequent participation in a licensed esthetician school for state licensure eligibility.'),
  
  ('cosmetology-apprenticeship', 'Registered Cosmetology Apprenticeship', 'IN', 1500, 4980, 'milady', 386, 'Indiana Professional Licensing Agency (IPLA)', '39-5012.00',
   'Registered Cosmetology Apprenticeship Sponsorship, Oversight & Related Instruction (Milady Theory). This program provides federal apprenticeship sponsorship, employer coordination, compliance reporting, and related instruction.',
   'This program is not a cosmetology school and does not issue state licensure hours. Enrollment requires concurrent or subsequent participation in a licensed cosmetology school for state licensure eligibility.')
ON CONFLICT (slug) DO UPDATE SET
  program_fee = EXCLUDED.program_fee,
  vendor_cost = EXCLUDED.vendor_cost,
  updated_at = now();

-- Enable RLS
ALTER TABLE apprenticeship_programs ENABLE ROW LEVEL SECURITY;

-- Anyone can view active programs
DROP POLICY IF EXISTS "Anyone can view active programs" ON apprenticeship_programs;
CREATE POLICY "Anyone can view active programs" ON apprenticeship_programs FOR SELECT USING (is_active = true);

GRANT SELECT ON apprenticeship_programs TO authenticated;
GRANT SELECT ON apprenticeship_programs TO anon;

SELECT 'Beauty apprenticeship programs schema complete!' as result;
