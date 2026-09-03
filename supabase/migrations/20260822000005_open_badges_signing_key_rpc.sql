-- Service-only accessor for the Ed25519 signing key stored in Supabase Vault.
-- The secret itself is provisioned directly into Vault and is never committed.

CREATE OR REPLACE FUNCTION public.get_open_badges_signing_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  secret_value TEXT;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service role required';
  END IF;

  SELECT decrypted_secret
    INTO secret_value
  FROM vault.decrypted_secrets
  WHERE name = 'open_badges_ed25519_secret_multibase'
  ORDER BY created_at DESC
  LIMIT 1;

  IF secret_value IS NULL THEN
    RAISE EXCEPTION 'Open Badges signing key is not configured';
  END IF;

  RETURN secret_value;
END;
$$;

REVOKE ALL ON FUNCTION public.get_open_badges_signing_key() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_open_badges_signing_key() FROM anon;
REVOKE ALL ON FUNCTION public.get_open_badges_signing_key() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_open_badges_signing_key() TO service_role;
