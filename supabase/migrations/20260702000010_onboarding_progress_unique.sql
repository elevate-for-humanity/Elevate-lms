-- Add UNIQUE constraint on (user_id, step) so the upsert in
-- /api/onboarding/complete-step can use onConflict: 'user_id,step'.
-- Deduplicate any existing rows first (keep the most-recently completed one).

DELETE FROM public.onboarding_progress op
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, step) id
  FROM public.onboarding_progress
  ORDER BY user_id, step, completed_at DESC NULLS LAST, created_at DESC NULLS LAST
);

ALTER TABLE public.onboarding_progress
  ADD CONSTRAINT onboarding_progress_user_step_unique UNIQUE (user_id, step);
