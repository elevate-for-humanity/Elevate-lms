-- Remove historical permissive forum policies that defeat tenant-aware RLS.
DROP POLICY IF EXISTS public_view ON public.forum_topics;
DROP POLICY IF EXISTS users_create ON public.forum_topics;
DROP POLICY IF EXISTS public_view ON public.forum_replies;
DROP POLICY IF EXISTS users_create ON public.forum_replies;
DROP POLICY IF EXISTS users_own ON public.forum_upvotes;

-- Reassert explicit authenticated grants only for learner forum operations.
REVOKE ALL ON public.forum_topics FROM anon;
REVOKE ALL ON public.forum_replies FROM anon;
REVOKE ALL ON public.forum_upvotes FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_topics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_replies TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.forum_upvotes TO authenticated;
