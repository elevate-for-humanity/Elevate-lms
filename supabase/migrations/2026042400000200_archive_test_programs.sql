-- Archive test/junk program entries that appeared on the public /programs page.
-- These were created by automated generators and were never real programs.
-- Sets is_active = false and status = 'archived' so they are excluded from
-- the programs page query (which filters: is_active = true AND status != 'archived').

UPDATE public.programs
SET
  is_active = false,
  status    = 'archived',
  updated_at = now()
WHERE
  -- Match known test entry titles
  title ILIKE '%generator acceptance test%'
  OR title ILIKE '%publish path validation test%'
  OR title ILIKE '%acceptance test%'
  OR title ILIKE '%validation test%'
  -- Catch any other obvious test slugs
  OR slug  ILIKE '%test%'
  OR slug  ILIKE '%demo%'
  OR slug  ILIKE '%sample%'
  OR slug  ILIKE '%placeholder%'
  OR slug  ILIKE '%example%';

-- Verify: show what was archived
SELECT id, slug, title, is_active, status
FROM public.programs
WHERE status = 'archived'
  AND updated_at > now() - interval '5 seconds'
ORDER BY title;
