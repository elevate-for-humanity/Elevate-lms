-- Atomic, access-controlled publication for persisted LMS courses.
-- A transaction must never leave the course published without its canonical
-- version, modules and lessons. This does not backfill historical courses.
SET LOCAL lock_timeout = '5s';

CREATE OR REPLACE FUNCTION public.publish_course_with_version(
  p_course_id uuid, p_actor_user_id uuid DEFAULT NULL, p_label text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_course public.courses%ROWTYPE;
  v_version public.course_versions%ROWTYPE;
  v_actor uuid;
  v_role text;
  v_number integer;
  v_expected_modules integer;
  v_expected_lessons integer;
  v_modules integer;
  v_lessons integer;
BEGIN
  -- Existing publish_course role checks remain authoritative. Additionally,
  -- never allow a JWT caller to spoof the audit actor.
  IF coalesce(auth.role(),'') <> 'service_role' THEN
    v_actor := auth.uid();
    IF v_actor IS NULL OR (p_actor_user_id IS NOT NULL AND p_actor_user_id <> v_actor) THEN
      RAISE EXCEPTION 'PUBLISH_ACTOR_MISMATCH' USING ERRCODE='42501';
    END IF;
    SELECT role INTO v_role FROM public.profiles WHERE id=v_actor;
    IF v_role IS NULL OR v_role NOT IN ('admin','super_admin','program_holder') THEN
      RAISE EXCEPTION 'PUBLISH_ROLE_REQUIRED' USING ERRCODE='42501';
    END IF;
  ELSE
    v_actor := p_actor_user_id;
  END IF;
  PERFORM 1 FROM public.courses WHERE id=p_course_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PUBLISH_COURSE_NOT_FOUND'; END IF;
  SELECT count(*) INTO v_expected_modules FROM public.course_modules WHERE course_id=p_course_id;
  SELECT count(*) INTO v_expected_lessons FROM public.course_lessons WHERE course_id=p_course_id;
  IF v_expected_modules<1 OR v_expected_lessons<1 THEN
    RAISE EXCEPTION 'PUBLISH_MODULES_AND_LESSONS_REQUIRED';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.course_lessons l
    LEFT JOIN public.course_modules m ON m.id=l.module_id AND m.course_id=l.course_id
    WHERE l.course_id=p_course_id AND (m.id IS NULL OR l.order_index IS NULL)
  ) THEN
    RAISE EXCEPTION 'PUBLISH_CANONICAL_LESSON_ORDER_REQUIRED';
  END IF;

  -- This RPC enforces the existing curriculum publication checks.
  SELECT * INTO v_course FROM public.publish_course(p_course_id);
  SELECT coalesce(max(version_number),0)+1 INTO v_number
    FROM public.course_versions WHERE course_id=p_course_id;

  INSERT INTO public.course_versions
    (course_id,version_number,label,is_published,published_at,created_by)
  VALUES
    (p_course_id,v_number,coalesce(nullif(p_label,''),'v'||v_number),true,now(),v_actor)
  RETURNING * INTO v_version;

  INSERT INTO public.course_version_modules(version_id,module_id)
    SELECT v_version.id,id FROM public.course_modules
    WHERE course_id=p_course_id ORDER BY order_index,id;
  GET DIAGNOSTICS v_modules = ROW_COUNT;
  INSERT INTO public.course_version_lessons(version_id,lesson_id)
    SELECT v_version.id,id FROM public.course_lessons
    WHERE course_id=p_course_id ORDER BY order_index,id;
  GET DIAGNOSTICS v_lessons = ROW_COUNT;

  IF v_modules<>v_expected_modules OR v_lessons<>v_expected_lessons THEN
    RAISE EXCEPTION 'PUBLISH_CANONICAL_VERSION_INCOMPLETE';
  END IF;
  -- The audit receipt commits in this same transaction or publication rolls
  -- back. It is never a separate best-effort post-publication request.
  PERFORM public.log_audit_event(
    v_actor,'course',p_course_id,'course_published',
    jsonb_build_object('version_id',v_version.id,
      'version_number',v_version.version_number,'publication','atomic')
  );
  RETURN jsonb_build_object('course',to_jsonb(v_course),'version',to_jsonb(v_version));
END $$;

REVOKE ALL ON FUNCTION public.publish_course_with_version(uuid,uuid,text)
  FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.publish_course_with_version(uuid,uuid,text)
  TO service_role;
