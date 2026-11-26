-- JRI participants: the /jri/participants/new form posts user_id, program,
-- enrolled_at and employment_status, but jri_participants only had
-- id/status/timestamps (plus a stray text column), so participant creation
-- could never work. Add the fields the form and list page need.
-- Applied to QA first (verified 2026-11-25), then production (table empty).
ALTER TABLE public.jri_participants
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS program text,
  ADD COLUMN IF NOT EXISTS enrolled_at timestamptz,
  ADD COLUMN IF NOT EXISTS employment_status text;
