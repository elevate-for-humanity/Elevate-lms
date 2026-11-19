-- Run only in disposable isolated QA. All test writes are rolled back.
BEGIN;
SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);
SET LOCAL ROLE service_role;
DO $$
DECLARE
  campaign_id uuid := gen_random_uuid();
  failure_id uuid := gen_random_uuid();
  campaign jsonb;
  posts jsonb;
  result jsonb;
BEGIN
  campaign := jsonb_build_object(
    'id', campaign_id, 'name', 'QA atomic draft test', 'platform', 'facebook', 'status', 'draft',
    'metadata', jsonb_build_object('saveActorId', 'qa-actor', 'saveFingerprint', repeat('a', 64))
  );
  posts := jsonb_build_array(jsonb_build_object(
    'title', 'QA draft', 'content', 'Disposable test content', 'caption', 'Disposable test content',
    'status', 'pending_approval', 'approval_state', 'pending', 'platform', 'facebook',
    'destination_type', 'facebook_page', 'post_type', 'blog_link',
    'generation_payload', jsonb_build_object('campaignId', campaign_id),
    'idempotency_key', 'campaign:' || campaign_id || ':test:facebook_page:v1'
  ));

  result := public.save_social_campaign_draft(campaign, posts);
  IF (result->>'draftCount')::int <> 1 OR (result->>'replayed')::boolean THEN
    RAISE EXCEPTION 'Initial atomic save result failed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.social_media_posts
      WHERE generation_payload->>'campaignId' = campaign_id::text
        AND status = 'pending_approval' AND approval_state = 'pending'
        AND approved_at IS NULL AND approved_by IS NULL AND scheduled_at IS NULL) THEN
    RAISE EXCEPTION 'Draft approval/schedule boundary failed';
  END IF;
  result := public.save_social_campaign_draft(campaign, posts);
  IF (result->>'draftCount')::int <> 1 OR NOT (result->>'replayed')::boolean
      OR (SELECT count(*) FROM public.social_campaigns WHERE id = campaign_id) <> 1 THEN
    RAISE EXCEPTION 'Idempotent replay duplicated data';
  END IF;

  BEGIN
    PERFORM public.save_social_campaign_draft(
      jsonb_set(campaign, '{metadata,saveFingerprint}', to_jsonb(repeat('b', 64))), posts);
    RAISE EXCEPTION 'Changed request fingerprint was accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;

  BEGIN
    -- Invalid required post data fails after the campaign insert, proving the
    -- database transaction rolls the campaign back with its failed post rows.
    PERFORM public.save_social_campaign_draft(
      jsonb_set(campaign, '{id}', to_jsonb(failure_id)),
      jsonb_build_array(jsonb_build_object(
        'content', NULL, 'status', 'pending_approval', 'approval_state', 'pending',
        'platform', 'facebook', 'generation_payload', jsonb_build_object('campaignId', failure_id),
        'idempotency_key', 'campaign:' || failure_id || ':test:facebook_page:v1')));
    RAISE EXCEPTION 'Invalid post save unexpectedly succeeded';
  EXCEPTION WHEN not_null_violation THEN NULL;
  END;
  IF EXISTS (SELECT 1 FROM public.social_campaigns WHERE id = failure_id) THEN
    RAISE EXCEPTION 'Failed post left an orphan campaign';
  END IF;

  BEGIN
    PERFORM public.save_social_campaign_draft(
      jsonb_set(campaign, '{id}', to_jsonb(failure_id)),
      jsonb_set(jsonb_set(posts, '{0,generation_payload,campaignId}', to_jsonb(failure_id)),
        '{0,status}', '"scheduled"'::jsonb));
    RAISE EXCEPTION 'Scheduled post bypassed per-post approval';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;

  BEGIN
    -- Reproduce the previous PostgREST upsert's invalid conflict target.
    INSERT INTO public.social_media_posts(platform, content, idempotency_key)
      VALUES ('facebook', 'Disposable old-path reproduction', 'qa-old-upsert-reproduction')
      ON CONFLICT (idempotency_key) DO NOTHING;
    RAISE EXCEPTION 'Expected the original partial-index conflict inference failure';
  EXCEPTION WHEN invalid_column_reference THEN NULL;
  END;
END;
$$;
RESET ROLE;
DO $$
BEGIN
  IF has_function_privilege('anon', 'public.save_social_campaign_draft(jsonb,jsonb)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.save_social_campaign_draft(jsonb,jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Untrusted role was granted campaign-save execution';
  END IF;
  IF NOT has_function_privilege('service_role', 'public.save_social_campaign_draft(jsonb,jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Trusted server cannot execute campaign save';
  END IF;
END;
$$;
ROLLBACK;
