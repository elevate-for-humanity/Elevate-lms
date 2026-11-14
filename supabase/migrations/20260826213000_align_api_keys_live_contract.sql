-- Keep migration-derived schema audits aligned with the production api_keys
-- contract. Production already exposes is_active; this makes clean rebuilds
-- and CI's migration fallback deterministic.
ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

UPDATE public.api_keys
SET is_active = (status = 'active')
WHERE status IS NOT NULL;
