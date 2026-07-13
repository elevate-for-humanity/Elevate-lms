-- Apprenticeship compliance model correction
--
-- Indiana barber SCHOOL = 1,500 total hours (single bucket)
-- Indiana barber APPRENTICESHIP = 2,000 OJL hours + RTI tracked separately (144/yr recommended)
--
-- OJL and RTI must NEVER be summed into a single "total hours" for apprenticeship completion.
-- This migration enforces that separation at the schema level.
--
-- APPLIED TO PRODUCTION: 2026-03-01

-- 1. Drop old CHECK, update data, add new CHECK
ALTER TABLE programs DROP CONSTRAINT programs_issuance_policy_check;
UPDATE programs SET issuance_policy = 'apprenticeship_certificate' WHERE issuance_policy = 'workforce_certificate';
ALTER TABLE programs ADD CONSTRAINT programs_issuance_policy_check 
  CHECK (issuance_policy = ANY (ARRAY['course_certificate', 'apprenticeship_certificate']));

-- 2. Rename min_ojt_hours → min_ojl_hours (OJL = On-the-Job Learning, DOL terminology)
ALTER TABLE programs RENAME COLUMN min_ojt_hours TO min_ojl_hours;

-- 3. Fix barber apprenticeship: OJL and RTI are separate buckets, not summed
UPDATE programs
SET
  min_ojl_hours = 2000,       -- DOL registered apprenticeship baseline
  min_rti_hours = 144,        -- Recommended minimum per year; align to sponsor standards
  required_hours = NULL,      -- Remove combined total — misleading for apprenticeship
  total_hours = NULL           -- Same — no single "total" for apprenticeship
WHERE slug = 'barber-apprenticeship';

-- 4. Update hour_entries source_type CHECK: ojt → ojl
ALTER TABLE hour_entries DROP CONSTRAINT hour_entries_source_type_check;
ALTER TABLE hour_entries ADD CONSTRAINT hour_entries_source_type_check 
  CHECK (source_type = ANY (ARRAY[
    'host_shop', 'in_state_barber_school', 'out_of_state_school', 
    'out_of_state_license', 'continuing_education', 
    'rti', 'ojl', 'timeclock', 'manual'
  ]));

-- 5. Add comments explaining the compliance model
COMMENT ON COLUMN programs.min_ojl_hours IS 'Minimum on-the-job learning hours (apprenticeship only). Tracked separately from RTI.';
COMMENT ON COLUMN programs.min_rti_hours IS 'Minimum related technical instruction hours (apprenticeship only). Tracked separately from OJL.';
COMMENT ON COLUMN programs.issuance_policy IS 'course_certificate = lesson/quiz completion gate. apprenticeship_certificate = separate OJL + RTI hour minimums.';
