-- Backfill partners.programs for all 18 existing rows.
--
-- Context: partners.programs is a JSONB array used by /api/partners?program=X
-- to filter which partners appear in program enrollment UIs.
-- All 18 rows currently have programs = NULL, making every program filter return 0 results.
--
-- These 18 partners are NOT barbershops. They are funding agencies, credential
-- bodies, clinical sites, and OJT employers for other programs.
-- None should receive BARBER. Barbershop partners must be inserted separately
-- via barber_shop_seed.sql.
--
-- Program slug conventions used in /api/partners filter calls:
--   BARBER, HVAC, CNA, PHLEBOTOMY, MA, CDL, ELECTRICAL, WELDING
--   WIOA, JRI, NEXTLEVEL, DOL  (funding/workforce — not enrollment filters)
--   ALL  (compliance partners relevant to every program)
--
-- Safe to re-run: UPDATE is idempotent.

-- Funding / workforce agencies
UPDATE public.partners SET programs = '["WIOA","JRI","NEXTLEVEL","DOL","BARBER","HVAC","CNA","CDL","PHLEBOTOMY","MA"]'::jsonb
WHERE id = 'b6884b7c-dfa3-4f69-aa9d-55da228e4fb3'; -- U.S. Department of Labor

UPDATE public.partners SET programs = '["JRI","NEXTLEVEL","WIOA"]'::jsonb
WHERE id = '3ba53468-6ed5-4a5f-95d6-e94b5f34c7b4'; -- Indiana DWD

UPDATE public.partners SET programs = '["WIOA","JRI"]'::jsonb
WHERE id = 'bca97390-339c-404a-8c1b-915cea8435d7'; -- WorkOne Indy

UPDATE public.partners SET programs = '["NEXTLEVEL"]'::jsonb
WHERE id = '8672666b-7452-4f18-a0cc-8799ad8d0765'; -- Next Level Jobs

UPDATE public.partners SET programs = '["WIOA","JRI"]'::jsonb
WHERE id = '4e3eec45-3d00-4cab-a823-7d9c9a337915'; -- EmployIndy

-- Credential / compliance partners
UPDATE public.partners SET programs = '["HVAC","ELECTRICAL","WELDING","CDL"]'::jsonb
WHERE id = 'e4f852f9-6c6a-421b-ada6-dd2148c90bae'; -- OSHA

UPDATE public.partners SET programs = '["CNA","PHLEBOTOMY","MA"]'::jsonb
WHERE id = '13594c62-fbf5-4dd4-b6d3-e0a127704487'; -- American Heart Association

UPDATE public.partners SET programs = '["CNA","PHLEBOTOMY","MA"]'::jsonb
WHERE id = 'e2d87453-d268-43c6-8836-b23d271ec59d'; -- National Healthcareer Association

UPDATE public.partners SET programs = '["ALL"]'::jsonb
WHERE id = 'c14e0c32-bfd9-4c47-9bd3-1ff0488c6479'; -- National Drug Screening

UPDATE public.partners SET programs = '["ALL"]'::jsonb
WHERE id = '9482bc30-dd72-470c-a5c7-6f988478abf7'; -- MyDrugTestTraining

-- Clinical placement sites (CNA, phlebotomy, MA)
UPDATE public.partners SET programs = '["CNA","PHLEBOTOMY","MA"]'::jsonb
WHERE id = '0bb818d5-3092-4e37-b3f8-9c2c92b66516'; -- Community Health Network

UPDATE public.partners SET programs = '["CNA","PHLEBOTOMY","MA"]'::jsonb
WHERE id = 'bebeffd4-086e-4f07-8422-b22e9e59bd31'; -- Eskenazi Health

UPDATE public.partners SET programs = '["CNA","PHLEBOTOMY","MA"]'::jsonb
WHERE id = 'f07b2c6d-fce4-4206-8593-166e8abd06d1'; -- IU Health

UPDATE public.partners SET programs = '["CNA","PHLEBOTOMY","MA"]'::jsonb
WHERE id = '558d55c1-fac5-4a85-8c10-8c1811883e33'; -- Franciscan Health

UPDATE public.partners SET programs = '["CNA","PHLEBOTOMY","MA"]'::jsonb
WHERE id = '429cee40-eac9-4c33-9ead-6416cea2c57f'; -- Ascension St. Vincent

-- HVAC OJT employers
UPDATE public.partners SET programs = '["HVAC"]'::jsonb
WHERE id = '6b8cfea7-2caf-49b7-ac9d-aba18ba92cbf'; -- Carrier Corporation

UPDATE public.partners SET programs = '["HVAC"]'::jsonb
WHERE id = '5e5b37fe-d56a-4af5-8d37-bddc2a4141f2'; -- Johnson Controls

UPDATE public.partners SET programs = '["HVAC"]'::jsonb
WHERE id = 'a1d6baef-ed70-4f72-b896-051cbbd220f5'; -- Service Experts

-- Verify: all 18 rows now have programs set
SELECT id, name, programs
FROM public.partners
ORDER BY name;
