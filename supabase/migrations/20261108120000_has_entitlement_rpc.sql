-- Provide the has_entitlement RPC that lib/store-entitlements.ts calls.
--
-- Purchases are recorded on public.user_entitlements (written by
-- lib/billing/fulfillment.ts and lib/store/finalize-cart-purchase.ts). The RPC
-- resolves an entitlement key against that canonical table, and also honours
-- legacy public.store_entitlements rows so older records keep working.
--
-- Without this function hasEntitlement() fails closed (returns false for every
-- caller), silently denying access to customers who paid.

-- store_entitlements was created without the columns the legacy readers use.
ALTER TABLE public.store_entitlements ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.store_entitlements ADD COLUMN IF NOT EXISTS entitlement_code text;
ALTER TABLE public.store_entitlements ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.store_entitlements ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE public.store_entitlements ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

-- Keep entitlement_code and entitlement_key in step for legacy readers.
UPDATE public.store_entitlements
   SET entitlement_code = entitlement_key
 WHERE entitlement_code IS NULL AND entitlement_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.has_entitlement(
  p_user_id uuid,
  p_entitlement_key text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_entitlements e
    WHERE e.user_id = p_user_id
      AND e.status = 'active'
      AND e.revoked_at IS NULL
      AND (
        e.entitlement_type = p_entitlement_key
        OR e.product_id::text = p_entitlement_key
        OR lower(e.name) = lower(p_entitlement_key)
      )
  )
  OR EXISTS (
    SELECT 1 FROM public.store_entitlements s
    WHERE s.user_id = p_user_id
      AND coalesce(s.entitlement_key, s.entitlement_code) = p_entitlement_key
      AND coalesce(s.status, 'active') = 'active'
      AND coalesce(s.is_active, true) = true
      AND s.revoked_at IS NULL
      AND (s.expires_at IS NULL OR s.expires_at > now())
  );
$function$;

REVOKE ALL ON FUNCTION public.has_entitlement(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_entitlement(uuid, text) TO service_role;

COMMENT ON FUNCTION public.has_entitlement(uuid, text) IS
  'True when the user holds an active, unrevoked, unexpired entitlement matching the key on user_entitlements or legacy store_entitlements.';
