-- Admin Modules reads/writes these fields, but the live modules table was
-- missing both columns. Keep the active modules domain intact and restore the
-- contract expected by the Admin management surface.

ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS duration_hours numeric,
  ADD COLUMN IF NOT EXISTS is_required boolean NOT NULL DEFAULT true;
