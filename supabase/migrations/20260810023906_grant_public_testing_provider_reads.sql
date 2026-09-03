-- Public testing provider pages intentionally read active providers through
-- the existing public_read_testing_providers RLS policy. The table-level grant
-- was missing, so PostgREST returned 401 before RLS could authorize the read.

GRANT SELECT ON TABLE public.testing_providers TO anon, authenticated;
