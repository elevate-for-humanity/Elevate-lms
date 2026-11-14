-- Website Builder tables already enforce owner-scoped row-level security.
-- Restore the authenticated Data API privileges required for those policies to
-- evaluate. Without these grants, valid owners receive "permission denied"
-- before Postgres can apply the RLS ownership predicates.

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.user_websites
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.website_revisions
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.website_domains
TO authenticated;
