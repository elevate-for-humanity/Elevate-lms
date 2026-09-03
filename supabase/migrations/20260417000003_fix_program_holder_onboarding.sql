-- Fix program holder onboarding flows
-- 1. Add user_id + program_holder_id to mou_signatures so signatures are linkable
-- 2. Ensure program_holder_acknowledgements has all required columns

-- mou_signatures: add user_id and program_holder_id if missing
ALTER TABLE public.mou_signatures
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS program_holder_id uuid REFERENCES public.program_holders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_mou_signatures_user_id ON public.mou_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_mou_signatures_program_holder_id ON public.mou_signatures(program_holder_id);

-- program_holder_acknowledgements: ensure all columns exist
ALTER TABLE public.program_holder_acknowledgements
  ADD COLUMN IF NOT EXISTS document_type text,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS user_agent text;

CREATE INDEX IF NOT EXISTS idx_pha_user_id ON public.program_holder_acknowledgements(user_id);

-- RLS: program holders can insert/read their own rows
ALTER TABLE public.mou_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_holder_acknowledgements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "program_holders_insert_mou" ON public.mou_signatures;
CREATE POLICY "program_holders_insert_mou" ON public.mou_signatures
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "program_holders_read_own_mou" ON public.mou_signatures;
CREATE POLICY "program_holders_read_own_mou" ON public.mou_signatures
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_all_mou" ON public.mou_signatures;
CREATE POLICY "admin_all_mou" ON public.mou_signatures
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff')
    )
  );

DROP POLICY IF EXISTS "program_holders_insert_ack" ON public.program_holder_acknowledgements;
CREATE POLICY "program_holders_insert_ack" ON public.program_holder_acknowledgements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "program_holders_read_own_ack" ON public.program_holder_acknowledgements;
CREATE POLICY "program_holders_read_own_ack" ON public.program_holder_acknowledgements
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_all_ack" ON public.program_holder_acknowledgements;
CREATE POLICY "admin_all_ack" ON public.program_holder_acknowledgements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff')
    )
  );
