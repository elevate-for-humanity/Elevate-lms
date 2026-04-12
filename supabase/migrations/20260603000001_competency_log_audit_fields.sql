-- Add audit-grade fields to competency_log so every verification can be
-- reconstructed: who verified, which supervisor row, which shop, and which
-- auth path was used. Required for DOL/state board compliance review.

ALTER TABLE public.competency_log
  ADD COLUMN IF NOT EXISTS verifier_user_id        uuid,
  ADD COLUMN IF NOT EXISTS verifier_supervisor_id  uuid,   -- shop_supervisors.id if path 1
  ADD COLUMN IF NOT EXISTS verified_shop_id        uuid,   -- shops.id at time of verification
  ADD COLUMN IF NOT EXISTS verification_auth_path  text;   -- 'shop_supervisors' | 'email_fallback'

-- Index for audit queries: "show all verifications by supervisor X"
CREATE INDEX IF NOT EXISTS idx_competency_log_verifier_user
  ON public.competency_log (verifier_user_id)
  WHERE verifier_user_id IS NOT NULL;

-- Index for shop-scoped audit: "show all verifications at shop Y"
CREATE INDEX IF NOT EXISTS idx_competency_log_verified_shop
  ON public.competency_log (verified_shop_id)
  WHERE verified_shop_id IS NOT NULL;

COMMENT ON COLUMN public.competency_log.verifier_user_id       IS 'auth.users id of the supervisor who verified this entry';
COMMENT ON COLUMN public.competency_log.verifier_supervisor_id IS 'shop_supervisors.id if verified via registered supervisor path; null if email fallback';
COMMENT ON COLUMN public.competency_log.verified_shop_id       IS 'shops.id at the time of verification — immutable audit anchor';
COMMENT ON COLUMN public.competency_log.verification_auth_path IS 'shop_supervisors (primary) or email_fallback (temporary). email_fallback to be removed after supervisor registration migration.';
