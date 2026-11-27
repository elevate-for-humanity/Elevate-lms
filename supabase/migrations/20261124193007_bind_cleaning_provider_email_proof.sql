-- Provider mailbox proof must bind the email and the server-owned PKCE flow.
-- A signed magiclink AMR alone survives email changes and is insufficient.
-- These tables have no direct API grants. Only the service-only RPCs below
-- may create, claim, complete, or read proof; no Auth schema is modified.
BEGIN;

CREATE TABLE public.cleaning_provider_email_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id uuid NOT NULL REFERENCES public.user_websites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_session_id uuid NOT NULL,
  email text NOT NULL CHECK (email = lower(btrim(email)) AND length(email) BETWEEN 3 AND 320),
  state_hash text NOT NULL UNIQUE CHECK (state_hash ~ '^[0-9a-f]{64}$'),
  browser_hash text NOT NULL CHECK (browser_hash ~ '^[0-9a-f]{64}$'),
  code_verifier text CHECK (code_verifier ~ '^[A-Za-z0-9._~-]{43,128}$'),
  created_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  claimed_at timestamptz,
  claim_hash text CHECK (claim_hash ~ '^[0-9a-f]{64}$'),
  completed_at timestamptz,
  cancelled_at timestamptz,
  CONSTRAINT cleaning_provider_challenge_lifetime CHECK (
    expires_at > created_at AND expires_at <= created_at + interval '10 minutes'
  ),
  CONSTRAINT cleaning_provider_challenge_claim CHECK (
    (claimed_at IS NULL) = (claim_hash IS NULL)
    AND (claimed_at IS NULL OR claimed_at >= created_at)
  ),
  CONSTRAINT cleaning_provider_challenge_secret CHECK (
    (code_verifier IS NOT NULL) = (claimed_at IS NULL AND cancelled_at IS NULL)
  ),
  CONSTRAINT cleaning_provider_challenge_completion CHECK (
    completed_at IS NULL OR
      (claimed_at IS NOT NULL AND completed_at >= claimed_at AND cancelled_at IS NULL)
  ),
  CONSTRAINT cleaning_provider_challenge_cancellation CHECK (
    cancelled_at IS NULL OR (cancelled_at >= created_at AND claimed_at IS NULL)
  )
);

CREATE INDEX cleaning_provider_email_challenges_owner_expiry
  ON public.cleaning_provider_email_challenges(website_id, user_id, expires_at);

CREATE TABLE public.cleaning_provider_email_proofs (
  website_id uuid NOT NULL REFERENCES public.user_websites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES auth.sessions(id) ON DELETE CASCADE,
  email text NOT NULL CHECK (email = lower(btrim(email)) AND length(email) BETWEEN 3 AND 320),
  challenge_id uuid REFERENCES public.cleaning_provider_email_challenges(id) ON DELETE SET NULL,
  verified_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (website_id, user_id, session_id),
  CONSTRAINT cleaning_provider_proof_lifetime CHECK (
    expires_at > verified_at AND expires_at <= verified_at + interval '30 days'
  )
);

ALTER TABLE public.cleaning_provider_email_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_provider_email_proofs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cleaning_provider_email_challenges,
  public.cleaning_provider_email_proofs FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.cleaning_provider_proof_begin(
  p_website_id uuid, p_user_id uuid, p_session_id uuid, p_email text,
  p_state_hash text, p_browser_hash text, p_verifier text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_id uuid;
BEGIN
  IF p_website_id IS NULL OR p_user_id IS NULL OR p_session_id IS NULL
    OR p_email IS NULL OR p_email <> lower(btrim(p_email))
    OR length(p_email) NOT BETWEEN 3 AND 320
    OR p_state_hash IS NULL OR p_state_hash !~ '^[0-9a-f]{64}$'
    OR p_browser_hash IS NULL OR p_browser_hash !~ '^[0-9a-f]{64}$'
    OR p_verifier IS NULL OR p_verifier !~ '^[A-Za-z0-9._~-]{43,128}$'
  THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Invalid provider verification request';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.users u JOIN auth.sessions s ON s.user_id = u.id
    WHERE u.id = p_user_id AND s.id = p_session_id
      AND lower(btrim(u.email)) = p_email AND u.email_confirmed_at IS NOT NULL
      AND NOT u.is_anonymous AND u.deleted_at IS NULL
      AND (u.banned_until IS NULL OR u.banned_until <= v_now)
      AND (s.not_after IS NULL OR s.not_after > v_now)
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Provider verification identity required';
  END IF;

  -- Remove only this user's expired challenges. Their proofs keep their own
  -- immutable email/session binding when the old challenge is removed.
  DELETE FROM public.cleaning_provider_email_challenges
    WHERE website_id = p_website_id AND user_id = p_user_id AND expires_at <= v_now;

  INSERT INTO public.cleaning_provider_email_challenges (
    website_id, user_id, original_session_id, email, state_hash, browser_hash,
    code_verifier, created_at, expires_at
  ) VALUES (
    p_website_id, p_user_id, p_session_id, p_email, p_state_hash, p_browser_hash,
    p_verifier, v_now, v_now + interval '10 minutes'
  ) RETURNING id INTO v_id;
  RETURN jsonb_build_object('challenge_id', v_id, 'expires_at', v_now + interval '10 minutes');
END;
$$;

CREATE FUNCTION public.cleaning_provider_proof_claim(
  p_website_id uuid, p_user_id uuid, p_session_id uuid, p_email text,
  p_state_hash text, p_browser_hash text, p_claim_hash text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $$
DECLARE
  v_challenge public.cleaning_provider_email_challenges%ROWTYPE;
  v_now timestamptz;
BEGIN
  IF p_claim_hash IS NULL OR p_claim_hash !~ '^[0-9a-f]{64}$' THEN
    RETURN NULL;
  END IF;
  SELECT * INTO v_challenge FROM public.cleaning_provider_email_challenges
    WHERE website_id = p_website_id AND user_id = p_user_id
      AND original_session_id = p_session_id AND email = p_email
      AND state_hash = p_state_hash AND browser_hash = p_browser_hash
    FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  -- Evaluate time after acquiring the lock; a waiting callback cannot claim
  -- a challenge that expired while another transaction held its row.
  v_now := clock_timestamp();
  IF v_challenge.claimed_at IS NOT NULL OR v_challenge.cancelled_at IS NOT NULL
    OR v_challenge.expires_at <= v_now THEN RETURN NULL; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM auth.users u JOIN auth.sessions s ON s.user_id = u.id
    WHERE u.id = p_user_id AND s.id = p_session_id
      AND lower(btrim(u.email)) = p_email AND u.email_confirmed_at IS NOT NULL
      AND NOT u.is_anonymous AND u.deleted_at IS NULL
      AND (u.banned_until IS NULL OR u.banned_until <= v_now)
      AND (s.not_after IS NULL OR s.not_after > v_now)
  ) THEN RETURN NULL; END IF;

  UPDATE public.cleaning_provider_email_challenges
    SET claimed_at = v_now, claim_hash = p_claim_hash, code_verifier = NULL
    WHERE id = v_challenge.id;
  RETURN jsonb_build_object(
    'challenge_id', v_challenge.id, 'user_id', v_challenge.user_id,
    'email', v_challenge.email, 'session_id', v_challenge.original_session_id,
    'verifier', v_challenge.code_verifier, 'expires_at', v_challenge.expires_at
  );
END;
$$;

CREATE FUNCTION public.cleaning_provider_proof_complete(
  p_challenge_id uuid, p_claim_hash text, p_user_id uuid,
  p_session_id uuid, p_email text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $$
DECLARE
  v_challenge public.cleaning_provider_email_challenges%ROWTYPE;
  v_now timestamptz;
BEGIN
  SELECT * INTO v_challenge FROM public.cleaning_provider_email_challenges
    WHERE id = p_challenge_id AND claim_hash = p_claim_hash
      AND user_id = p_user_id AND email = p_email FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  v_now := clock_timestamp();
  IF v_challenge.claimed_at IS NULL OR v_challenge.completed_at IS NOT NULL
    OR v_challenge.cancelled_at IS NOT NULL OR v_challenge.expires_at <= v_now
    OR v_challenge.claimed_at + interval '2 minutes' <= v_now
    OR p_session_id IS NULL OR p_session_id = v_challenge.original_session_id
  THEN RETURN false; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM auth.users u JOIN auth.sessions s ON s.user_id = u.id
    WHERE u.id = p_user_id AND s.id = p_session_id
      AND lower(btrim(u.email)) = p_email AND u.email_confirmed_at IS NOT NULL
      AND NOT u.is_anonymous AND u.deleted_at IS NULL
      AND (u.banned_until IS NULL OR u.banned_until <= v_now)
      AND (s.not_after IS NULL OR s.not_after > v_now)
      AND EXISTS (SELECT 1 FROM auth.mfa_amr_claims a
        WHERE a.session_id = s.id AND a.authentication_method = 'magiclink')
  ) THEN RETURN false; END IF;

  INSERT INTO public.cleaning_provider_email_proofs (
    website_id, user_id, session_id, email, challenge_id, verified_at, expires_at
  ) VALUES (
    v_challenge.website_id, p_user_id, p_session_id, p_email,
    v_challenge.id, v_now, v_now + interval '30 days'
  ) ON CONFLICT (website_id, user_id, session_id) DO NOTHING;
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE public.cleaning_provider_email_challenges
    SET completed_at = v_now, code_verifier = NULL WHERE id = v_challenge.id;
  RETURN true;
END;
$$;

CREATE FUNCTION public.cleaning_provider_proof_valid(
  p_website_id uuid, p_user_id uuid, p_session_id uuid, p_email text
) RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.cleaning_provider_email_proofs p
      JOIN auth.users u ON u.id = p.user_id
      JOIN auth.sessions s ON s.id = p.session_id AND s.user_id = u.id
    WHERE p.website_id = p_website_id AND p.user_id = p_user_id
      AND p.session_id = p_session_id AND p.email = p_email
      AND p.expires_at > clock_timestamp()
      AND lower(btrim(u.email)) = p.email AND u.email_confirmed_at IS NOT NULL
      AND NOT u.is_anonymous AND u.deleted_at IS NULL
      AND (u.banned_until IS NULL OR u.banned_until <= clock_timestamp())
      AND (s.not_after IS NULL OR s.not_after > clock_timestamp())
  );
$$;

CREATE FUNCTION public.cleaning_provider_proof_cancel(
  p_website_id uuid, p_user_id uuid, p_state_hash text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $$
BEGIN
  UPDATE public.cleaning_provider_email_challenges
    SET cancelled_at = clock_timestamp(), code_verifier = NULL
    WHERE website_id = p_website_id AND user_id = p_user_id AND state_hash = p_state_hash
      AND claimed_at IS NULL AND completed_at IS NULL AND cancelled_at IS NULL;
  RETURN FOUND;
END;
$$;

ALTER TABLE public.cleaning_provider_email_challenges OWNER TO postgres;
ALTER TABLE public.cleaning_provider_email_proofs OWNER TO postgres;
ALTER FUNCTION public.cleaning_provider_proof_begin(uuid,uuid,uuid,text,text,text,text) OWNER TO postgres;
ALTER FUNCTION public.cleaning_provider_proof_claim(uuid,uuid,uuid,text,text,text,text) OWNER TO postgres;
ALTER FUNCTION public.cleaning_provider_proof_complete(uuid,text,uuid,uuid,text) OWNER TO postgres;
ALTER FUNCTION public.cleaning_provider_proof_valid(uuid,uuid,uuid,text) OWNER TO postgres;
ALTER FUNCTION public.cleaning_provider_proof_cancel(uuid,uuid,text) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.cleaning_provider_proof_begin(uuid,uuid,uuid,text,text,text,text),
  public.cleaning_provider_proof_claim(uuid,uuid,uuid,text,text,text,text),
  public.cleaning_provider_proof_complete(uuid,text,uuid,uuid,text),
  public.cleaning_provider_proof_valid(uuid,uuid,uuid,text),
  public.cleaning_provider_proof_cancel(uuid,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleaning_provider_proof_begin(uuid,uuid,uuid,text,text,text,text),
  public.cleaning_provider_proof_claim(uuid,uuid,uuid,text,text,text,text),
  public.cleaning_provider_proof_complete(uuid,text,uuid,uuid,text),
  public.cleaning_provider_proof_valid(uuid,uuid,uuid,text),
  public.cleaning_provider_proof_cancel(uuid,uuid,text) TO service_role;

COMMENT ON TABLE public.cleaning_provider_email_challenges IS
  'Service-only single-use provider PKCE state. Never expose verifier or nonce hashes to browser clients.';
COMMENT ON TABLE public.cleaning_provider_email_proofs IS
  'Provider mailbox proof bound to one website, Auth user, Auth session and exact normalized email.';
COMMENT ON FUNCTION public.cleaning_provider_proof_complete(uuid,text,uuid,uuid,text) IS
  'Call only after server-owned PKCE exchange with the claimed verifier and verified matching identity. AMR alone is insufficient.';

COMMIT;
