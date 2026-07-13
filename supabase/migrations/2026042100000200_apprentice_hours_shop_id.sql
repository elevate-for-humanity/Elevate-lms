-- Add shop_id to apprentice_hours so shop owners can filter/approve their apprentices' hours
ALTER TABLE public.apprentice_hours
  ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.shops(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_apprentice_hours_shop_id
  ON public.apprentice_hours (shop_id);
