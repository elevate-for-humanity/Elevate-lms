-- Allow upsert on program_holders by user_id.
-- The setup API uses onConflict: 'user_id' which requires a unique index.
CREATE UNIQUE INDEX IF NOT EXISTS program_holders_user_id_unique
  ON public.program_holders (user_id)
  WHERE user_id IS NOT NULL;
