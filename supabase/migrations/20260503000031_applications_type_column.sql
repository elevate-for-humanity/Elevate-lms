-- Add type column to applications table.
-- Distinguishes student applications from other submission types.
-- Default 'student' matches all existing rows.

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'student';
