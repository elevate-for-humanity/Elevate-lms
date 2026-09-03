-- Align table privileges with existing RLS policies.
-- Anonymous users may only SELECT rows allowed by the public active-job policy.
-- Authenticated employers/admins receive CRUD privileges, still constrained by RLS.

GRANT SELECT ON TABLE public.job_postings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.job_postings TO authenticated;
