-- Align legacy public.programs claim flags with the repository's verified
-- public source-of-truth registries.
--
-- Federal Registered Apprenticeship / RAPIDS:
--   lib/compliance/rapids-config.ts currently verifies Barber only.
--
-- Public WIOA/ETPL labels:
--   lib/programs/funding-registry.ts currently permits only CDL, HVAC,
--   Business Administration, and Financial Literacy.
--
-- These legacy boolean columns must not contradict those registries because
-- older admin/public components may still inspect them.

UPDATE public.programs
SET dol_registered = (slug = 'barber-apprenticeship')
WHERE dol_registered IS DISTINCT FROM (slug = 'barber-apprenticeship');

UPDATE public.programs
SET wioa_approved = (slug IN (
  'cdl-training',
  'hvac-technician',
  'business-administration',
  'financial-literacy'
))
WHERE wioa_approved IS DISTINCT FROM (slug IN (
  'cdl-training',
  'hvac-technician',
  'business-administration',
  'financial-literacy'
));

UPDATE public.programs
SET etpl_listed = (slug IN (
  'cdl-training',
  'hvac-technician',
  'business-administration',
  'financial-literacy'
))
WHERE etpl_listed IS DISTINCT FROM (slug IN (
  'cdl-training',
  'hvac-technician',
  'business-administration',
  'financial-literacy'
));
