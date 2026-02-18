-- Cache pg_timezone_names into a real table.
-- The pg_timezone_names view is expensive (~417ms, 1.2M rows scanned, 0% cache hit).
-- This table is static — Postgres timezone list rarely changes between major versions.

CREATE TABLE IF NOT EXISTS public.timezone_names (
  name text PRIMARY KEY
);

INSERT INTO public.timezone_names (name)
SELECT name FROM pg_timezone_names
ON CONFLICT DO nothing;

-- Allow anon/authenticated to read (for timezone pickers in the UI)
ALTER TABLE public.timezone_names ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read timezones"
  ON public.timezone_names FOR SELECT
  USING (true);

COMMENT ON TABLE public.timezone_names IS 'Cached copy of pg_timezone_names. Refresh after major Postgres upgrades.';
