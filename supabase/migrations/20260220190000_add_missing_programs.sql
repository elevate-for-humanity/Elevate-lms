-- Add programs that exist in the application form but not in the programs table.
-- Without these rows, auto-enrollment fails because program_id resolves to NULL.

INSERT INTO programs (slug, name, title, description, category, status)
VALUES
  ('beauty-career-educator', 'Beauty & Career Educator', 'Beauty & Career Educator', 'Train to become a licensed beauty educator and career instructor.', 'Barber & Beauty', 'active'),
  ('drug-alcohol-specimen-collector', 'Drug & Alcohol Specimen Collector', 'Drug & Alcohol Specimen Collector', 'DOT-compliant specimen collection certification for workplace drug testing.', 'Human Services', 'active'),
  ('electrical', 'Electrical Apprenticeship', 'Electrical Apprenticeship', 'DOL-registered electrical apprenticeship with classroom and on-the-job training.', 'Skilled Trades', 'active'),
  ('home-health-aide', 'Home Health Aide', 'Home Health Aide', 'Home health aide training for in-home patient care and daily living assistance.', 'Healthcare', 'active'),
  ('plumbing', 'Plumbing Apprenticeship', 'Plumbing Apprenticeship', 'DOL-registered plumbing apprenticeship with classroom and on-the-job training.', 'Skilled Trades', 'active'),
  ('sanitation-infection-control', 'Sanitation & Infection Control', 'Sanitation & Infection Control', 'Infection prevention and sanitation protocols for healthcare and service environments.', 'Human Services', 'active'),
  ('welding', 'Welding Certification', 'Welding Certification', 'Welding certification training covering MIG, TIG, and stick welding techniques.', 'Skilled Trades', 'active')
ON CONFLICT (slug) DO NOTHING;
