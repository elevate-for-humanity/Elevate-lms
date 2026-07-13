-- Grant anon read access to program detail tables.
-- These tables had no SELECT grant for the anon role, causing 401s on all
-- public program pages that use createPublicClient().

GRANT SELECT ON public.program_media    TO anon;
GRANT SELECT ON public.program_ctas     TO anon;
GRANT SELECT ON public.program_tracks   TO anon;
GRANT SELECT ON public.program_modules  TO anon;
GRANT SELECT ON public.program_lessons  TO anon;
