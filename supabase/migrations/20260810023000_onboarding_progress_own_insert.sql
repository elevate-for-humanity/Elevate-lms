-- Allow an authenticated learner to create the first row of their own
-- onboarding_progress record. Existing SELECT/UPDATE policies already scope
-- learner access to auth.uid() = user_id. Anonymous callers cannot satisfy
-- this check because auth.uid() is NULL.

DROP POLICY IF EXISTS "Users can insert own onboarding" ON public.onboarding_progress;

CREATE POLICY "Users can insert own onboarding"
ON public.onboarding_progress
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
