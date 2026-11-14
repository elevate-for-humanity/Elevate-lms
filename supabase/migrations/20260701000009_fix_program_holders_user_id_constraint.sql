-- Fix duplicate unique constraints on program_holders.user_id.
--
-- Two conflicting constraints existed:
--   unique_program_holders_user_id  — unique on user_id INCLUDING nulls (wrong)
--   program_holders_user_id_unique  — unique on user_id WHERE NOT NULL (correct)
--
-- The broad constraint caused upsert(onConflict: 'user_id') to fail with an
-- ambiguous constraint error, producing a 500 on program holder applications.
-- Drop the incorrect one and keep the partial index.
--
-- APPLIED: 2026-05-19 via exec_sql RPC

ALTER TABLE public.program_holders DROP CONSTRAINT IF EXISTS unique_program_holders_user_id;
