-- Safety net: prevent application inserts from failing when zip is omitted
-- (some legacy/public intake paths may not provide zip consistently)

UPDATE public.applications
SET zip = '00000'
WHERE zip IS NULL OR btrim(zip) = '';

ALTER TABLE public.applications
ALTER COLUMN zip SET DEFAULT '00000';
