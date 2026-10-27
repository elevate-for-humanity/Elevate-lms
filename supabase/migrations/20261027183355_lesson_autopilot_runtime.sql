CREATE TABLE public.ultimate_autopilot_runtime (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 image_sha text NOT NULL CHECK(image_sha ~ '^[a-f0-9]{40}$'),
 image_digest text NOT NULL CHECK(image_digest ~ '^sha256:[a-f0-9]{64}$'),
 roles jsonb NOT NULL,
 verified_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ultimate_autopilot_runtime ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ultimate_autopilot_runtime FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.ultimate_autopilot_runtime TO service_role;
CREATE OR REPLACE FUNCTION public.register_ultimate_autopilot_runtime(p_image_sha text,p_image_digest text,p_roles jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE item jsonb;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'ULTIMATE_FENCE_SERVICE_ROLE_REQUIRED'; END IF;
 IF p_image_sha !~ '^[a-f0-9]{40}$' OR p_image_digest !~ '^sha256:[a-f0-9]{64}$' OR
   jsonb_typeof(p_roles) IS DISTINCT FROM 'array' OR jsonb_array_length(p_roles)<>3 OR
   (SELECT count(DISTINCT value->>'role') FROM jsonb_array_elements(p_roles))<>3
 THEN RAISE EXCEPTION 'ULTIMATE_AUTOPILOT_RUNTIME_READBACK_REQUIRED'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_roles) LOOP
  IF item->>'role' NOT IN ('instruction','media','quality') OR item->>'name' IS DISTINCT FROM 'elevate-course-'||(item->>'role') OR
    item->>'image' IS DISTINCT FROM 'us-central1-docker.pkg.dev/elegant-racer-299721/elevate/ultimate-worker@'||p_image_digest
  THEN RAISE EXCEPTION 'ULTIMATE_AUTOPILOT_RUNTIME_READBACK_REQUIRED'; END IF;
 END LOOP;
 INSERT INTO public.ultimate_autopilot_runtime(singleton,image_sha,image_digest,roles)
 VALUES(true,p_image_sha,p_image_digest,p_roles)
 ON CONFLICT(singleton) DO UPDATE SET image_sha=EXCLUDED.image_sha,image_digest=EXCLUDED.image_digest,roles=EXCLUDED.roles,verified_at=now();
 RETURN true;
END $$;
-- Schema readiness is distinct from actual deployed worker capability.
DO $$
DECLARE signature text; definition text;
BEGIN
 FOREACH signature IN ARRAY ARRAY['public.request_ultimate_autopilot_pool(uuid,uuid)','public.seed_ultimate_lesson_autopilots(uuid,text,bigint,jsonb,text)'] LOOP
  SELECT pg_get_functiondef(signature::regprocedure) INTO definition;
  IF definition IS NULL OR position('IF auth.role()' IN definition)=0 THEN RAISE EXCEPTION 'ULTIMATE_AUTOPILOT_FUNCTION_BOUNDARY_CHANGED'; END IF;
  definition:=replace(definition,'IF auth.role()',
   'IF NOT EXISTS(SELECT 1 FROM public.ultimate_autopilot_runtime) THEN RAISE EXCEPTION ''ULTIMATE_AUTOPILOT_RUNTIME_NOT_DEPLOYED''; END IF; IF auth.role()');
  EXECUTE definition;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.register_ultimate_autopilot_runtime(text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.register_ultimate_autopilot_runtime(text,text,jsonb) TO service_role;
