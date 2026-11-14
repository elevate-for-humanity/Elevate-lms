-- legal_documents already has an explicit public_read SELECT RLS policy.
-- Grant table-level SELECT so PostgREST can reach that policy instead of
-- returning 401 before policy evaluation.

GRANT SELECT ON TABLE public.legal_documents TO anon, authenticated;
