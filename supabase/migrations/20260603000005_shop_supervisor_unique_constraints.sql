-- Unique constraints required for idempotent upserts during shop approval.
--
-- shops: prevent duplicate shop rows on re-approval of the same application.
-- shop_supervisors: prevent duplicate supervisor rows per shop/email pair.
--   Also adds email column (missing from original schema) so the approval
--   route can use email as the pre-claim identity anchor.

ALTER TABLE public.shop_supervisors
  ADD COLUMN IF NOT EXISTS email text;

-- Unique: one supervisor record per shop+email pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_shop_supervisors_shop_email
  ON public.shop_supervisors (shop_id, email)
  WHERE email IS NOT NULL;

-- Unique: one shop per name+city+state combination
-- Prevents duplicate shops on re-approval without requiring a shop_id FK
-- on the application table.
CREATE UNIQUE INDEX IF NOT EXISTS idx_shops_name_city_state
  ON public.shops (name, city, state)
  WHERE city IS NOT NULL AND state IS NOT NULL;

COMMENT ON COLUMN public.shop_supervisors.email IS 'Contact email — used as identity anchor before user_id is claimed via onboarding link';
