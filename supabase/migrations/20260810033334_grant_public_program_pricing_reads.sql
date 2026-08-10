-- program_pricing already has a public SELECT policy limited to active rows.
-- Add the table-level grants PostgREST requires before RLS policy evaluation.

GRANT SELECT ON TABLE public.program_pricing TO anon, authenticated;
