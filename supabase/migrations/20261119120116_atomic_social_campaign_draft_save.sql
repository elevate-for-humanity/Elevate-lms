-- The guarded Admin route supplies a stable save UUID and deterministic content.
-- SECURITY INVOKER preserves database role authority. Only the trusted server
-- role can call this operation; no browser role receives new write access.
CREATE OR REPLACE FUNCTION public.save_social_campaign_draft(p_campaign jsonb, p_posts jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_id uuid := (p_campaign->>'id')::uuid;
  v_campaign public.social_campaigns%ROWTYPE;
  v_count integer;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Trusted server role required' USING ERRCODE = '42501';
  END IF;
  IF v_id IS NULL OR coalesce(p_campaign->>'name', '') = ''
     OR coalesce(p_campaign->>'status', '') NOT IN ('draft', 'active', 'paused')
     OR coalesce(p_campaign->'metadata'->>'saveFingerprint', '') !~ '^[a-f0-9]{64}$'
     OR coalesce(p_campaign->'metadata'->>'saveActorId', '') = '' THEN
    RAISE EXCEPTION 'Invalid campaign save payload' USING ERRCODE = '22023';
  END IF;
  IF p_posts IS NOT NULL AND jsonb_typeof(p_posts) <> 'array' THEN
    RAISE EXCEPTION 'Invalid campaign posts payload' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(p_posts) > 180 THEN
    RAISE EXCEPTION 'Too many campaign posts' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_posts) AS post
    WHERE post->>'status' IS DISTINCT FROM 'pending_approval'
       OR post->>'approval_state' IS DISTINCT FROM 'pending'
       OR post->>'approved_at' IS NOT NULL
       OR post->>'approved_by' IS NOT NULL
       OR post->>'scheduled_at' IS NOT NULL
       OR post->>'next_attempt_at' IS NOT NULL
       OR post->'generation_payload'->>'campaignId' IS DISTINCT FROM v_id::text
       OR coalesce(post->>'idempotency_key', '') NOT LIKE 'campaign:' || v_id::text || ':%'
  ) THEN
    RAISE EXCEPTION 'Campaign posts must remain unapproved and unscheduled' USING ERRCODE = '22023';
  END IF;

  -- Serialize matching requests so concurrent retries return the same plan.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_id::text, 0));
  SELECT * INTO v_campaign FROM public.social_campaigns WHERE id = v_id;
  IF FOUND THEN
    IF v_campaign.metadata->>'saveFingerprint' IS DISTINCT FROM p_campaign->'metadata'->>'saveFingerprint'
       OR v_campaign.metadata->>'saveActorId' IS DISTINCT FROM p_campaign->'metadata'->>'saveActorId' THEN
      RAISE EXCEPTION 'Campaign request ID was reused with different content' USING ERRCODE = '22023';
    END IF;
    SELECT count(*) INTO v_count FROM public.social_media_posts
      WHERE generation_payload->>'campaignId' = v_id::text;
    RETURN jsonb_build_object('campaign', to_jsonb(v_campaign), 'draftCount', v_count, 'replayed', true);
  END IF;

  -- A SQL NULL posts argument only resolves an existing committed request.
  -- It cannot create an empty campaign when a save is still pending.
  IF p_posts IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.social_campaigns (id, name, platform, status, start_date, end_date, metadata)
  VALUES (v_id, p_campaign->>'name', p_campaign->>'platform', p_campaign->>'status',
    (p_campaign->>'start_date')::timestamptz, (p_campaign->>'end_date')::timestamptz,
    p_campaign->'metadata')
  RETURNING * INTO v_campaign;

  INSERT INTO public.social_media_posts (
    title, content, caption, status, approval_state, source_type, source_id,
    link_url, media_url, thumbnail_url, content_version, generation_payload,
    platform, destination_type, post_type, idempotency_key
  )
  SELECT post.title, post.content, post.caption, post.status, post.approval_state,
    post.source_type, post.source_id, post.link_url, post.media_url, post.thumbnail_url,
    post.content_version, post.generation_payload, post.platform, post.destination_type,
    post.post_type, post.idempotency_key
  FROM jsonb_to_recordset(p_posts) AS post(
    title text, content text, caption text, status text, approval_state text,
    source_type text, source_id uuid, link_url text, media_url text, thumbnail_url text,
    content_version text, generation_payload jsonb, platform text, destination_type text,
    post_type text, idempotency_key text
  )
  ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;

  SELECT count(*) INTO v_count FROM public.social_media_posts
    WHERE generation_payload->>'campaignId' = v_id::text;
  RETURN jsonb_build_object('campaign', to_jsonb(v_campaign), 'draftCount', v_count, 'replayed', false);
END;
$$;

REVOKE ALL ON FUNCTION public.save_social_campaign_draft(jsonb, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_social_campaign_draft(jsonb, jsonb) TO service_role;
