-- CF-3: Add WIOA Title I required intake fields to applications.
-- PIRL fields: 300 (DOB), 302 (county), 401 (family size), 900 (income).
-- modality_preference is needed for hybrid apprenticeship scheduling.

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS date_of_birth       date,
  ADD COLUMN IF NOT EXISTS county_of_residence text,
  ADD COLUMN IF NOT EXISTS household_income    numeric(10,2),
  ADD COLUMN IF NOT EXISTS family_size         smallint,
  ADD COLUMN IF NOT EXISTS modality_preference text CHECK (
    modality_preference IS NULL OR
    modality_preference IN ('in_person', 'virtual', 'hybrid')
  );

COMMENT ON COLUMN public.applications.date_of_birth       IS 'WIOA PIRL field 300 — required for age eligibility determination';
COMMENT ON COLUMN public.applications.county_of_residence IS 'WIOA PIRL field 302 — required for WorkOne referral routing';
COMMENT ON COLUMN public.applications.household_income    IS 'WIOA PIRL field 900 — annual household income for Title I eligibility';
COMMENT ON COLUMN public.applications.family_size         IS 'WIOA PIRL field 401 — household size for income threshold calculation';
COMMENT ON COLUMN public.applications.modality_preference IS 'Learner preference: in_person | virtual | hybrid — used for cohort scheduling';
