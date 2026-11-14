-- All publication writes share the PostgREST RPC transaction. No rendering or
-- provider requests occur while locks are held. Only the existing server role
-- can call this entry point; it does not bypass RLS through SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public.merge_ultimate_release_questions(p_old jsonb, p_new jsonb)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_result jsonb := coalesce(nullif(p_old,'null'::jsonb), '[]'::jsonb); v_question jsonb;
BEGIN
  IF jsonb_typeof(v_result) <> 'array' OR jsonb_typeof(coalesce(nullif(p_new,'null'::jsonb),'[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'ULTIMATE_CANONICAL_ASSESSMENT_INVALID';
  END IF;
  FOR v_question IN SELECT value FROM jsonb_array_elements(coalesce(nullif(p_new,'null'::jsonb),'[]'::jsonb)) LOOP
    IF nullif(v_question->>'id','') IS NULL OR NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(coalesce(nullif(p_old,'null'::jsonb),'[]'::jsonb)) old_question
      WHERE old_question->>'id' = v_question->>'id'
    ) THEN v_result := v_result || jsonb_build_array(v_question); END IF;
  END LOOP;
  RETURN v_result;
END $$;
REVOKE ALL ON FUNCTION public.merge_ultimate_release_questions(jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.merge_ultimate_release_questions(jsonb,jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.commit_ultimate_release(
  p_package jsonb, p_rows jsonb, p_actor uuid, p_rolled_back_from uuid DEFAULT NULL, p_fence jsonb DEFAULT NULL
) RETURNS SETOF public.ultimate_release_versions
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_course_id uuid := (p_package->>'courseId')::uuid;
  v_build_id uuid := (p_package->>'buildId')::uuid;
  v_build public.ultimate_course_builds%ROWTYPE;
  v_job public.ultimate_build_jobs%ROWTYPE;
  v_lesson public.course_lessons%ROWTYPE;
  v_row public.course_lessons%ROWTYPE;
  v_media public.video_jobs%ROWTYPE;
  v_existing_media public.video_jobs%ROWTYPE;
  v_release public.ultimate_release_versions%ROWTYPE;
  v_historical public.ultimate_release_versions%ROWTYPE;
  v_prepared jsonb; v_source jsonb; v_artifacts jsonb;
  v_experience jsonb; v_content jsonb;
  v_module uuid; v_media_id uuid; v_version integer;
  v_now timestamptz := now(); v_count integer; v_expected integer;
BEGIN
  PERFORM set_config('lock_timeout','5s',true);
  IF p_actor IS NULL OR v_course_id IS NULL OR v_build_id IS NULL OR
     p_package->>'contractVersion' IS DISTINCT FROM 'ultimate-lesson-2026-10-05.1' OR
     jsonb_typeof(p_package->'lessons') IS DISTINCT FROM 'array' OR
     jsonb_typeof(p_rows) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'ULTIMATE_RELEASE_CONTRACT_REQUIRED';
  END IF;
  v_expected := jsonb_array_length(p_package->'lessons');
  IF v_expected = 0 OR jsonb_array_length(p_rows) <> v_expected OR
     (SELECT count(DISTINCT value->>'sourceLessonBuildId') FROM jsonb_array_elements(p_package->'lessons')) <> v_expected OR
     (SELECT count(DISTINCT value->>'competencyId') FROM jsonb_array_elements(p_package->'lessons')) <> v_expected OR
     (SELECT count(DISTINCT value->>'sourceLessonBuildId') FROM jsonb_array_elements(p_rows)) <> v_expected THEN
    RAISE EXCEPTION 'ULTIMATE_ALL_COMPETENCIES_REQUIRED';
  END IF;
  -- Course first, then its build, canonical lessons and media rows. This order
  -- serializes version allocation and publication of the same course.
  PERFORM 1 FROM public.courses WHERE id=v_course_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ULTIMATE_COURSE_NOT_FOUND'; END IF;
  IF p_rolled_back_from IS NULL THEN
    SELECT * INTO v_build FROM public.ultimate_course_builds WHERE id=v_build_id FOR UPDATE;
    IF NOT FOUND OR v_build.course_id <> v_course_id THEN
      RAISE EXCEPTION 'ULTIMATE_BUILD_NOT_RELEASE_READY';
    END IF;
  END IF;
  IF p_fence IS NOT NULL THEN
    SELECT * INTO v_job FROM public.ultimate_build_jobs
      WHERE id=(p_fence->>'jobId')::uuid AND build_id=v_build_id FOR UPDATE;
    IF NOT FOUND OR v_job.status <> 'running' OR
       v_job.lease_owner IS DISTINCT FROM p_fence->>'workerId' OR
       v_job.execution_generation IS DISTINCT FROM (p_fence->>'generation')::integer OR
       v_job.lease_expires_at IS NULL OR v_job.lease_expires_at<=clock_timestamp() THEN
      RAISE EXCEPTION 'ULTIMATE_JOB_LEASE_LOST';
    END IF;
  END IF;
  SELECT * INTO v_release FROM public.ultimate_release_versions
    WHERE course_id=v_course_id AND build_id=v_build_id AND status='released'
      AND package=p_package AND rolled_back_from IS NOT DISTINCT FROM p_rolled_back_from
    ORDER BY version DESC LIMIT 1;
  IF FOUND THEN RETURN NEXT v_release; RETURN; END IF;

  IF p_rolled_back_from IS NULL THEN
    IF v_build.status <> 'built' OR
       v_build.profile IS DISTINCT FROM p_package->'profile' THEN
      RAISE EXCEPTION 'ULTIMATE_BUILD_NOT_RELEASE_READY';
    END IF;
    IF coalesce(jsonb_array_length(v_build.profile->'competencies'),0) <> v_expected OR
       (SELECT count(*) FROM public.ultimate_lesson_builds WHERE build_id=v_build_id) <> v_expected THEN
      RAISE EXCEPTION 'ULTIMATE_ALL_COMPETENCIES_REQUIRED';
    END IF;
  ELSE
    SELECT * INTO v_historical FROM public.ultimate_release_versions
      WHERE id=p_rolled_back_from AND course_id=v_course_id;
    IF NOT FOUND OR (v_historical.package || jsonb_build_object(
      'buildId',v_historical.build_id,'courseId',v_course_id)) IS DISTINCT FROM p_package THEN
      RAISE EXCEPTION 'ULTIMATE_RELEASE_NOT_FOUND';
    END IF;
  END IF;

  -- Validate all source and canonical identities before making the first write.
  FOR v_source IN SELECT value FROM jsonb_array_elements(p_package->'lessons') LOOP
    SELECT value INTO v_prepared FROM jsonb_array_elements(p_rows)
      WHERE value->>'sourceLessonBuildId'=v_source->>'sourceLessonBuildId';
    IF NOT FOUND OR v_prepared->>'competencyId' IS DISTINCT FROM v_source->>'competencyId' OR
       v_prepared->>'canonicalLessonId' IS DISTINCT FROM v_source->>'canonicalLessonId' OR
       v_prepared->'media'->>'video_url' IS DISTINCT FROM v_source->>'videoUrl' OR
       v_prepared->'row'->>'video_url' IS DISTINCT FROM v_source->>'videoUrl' OR
       coalesce(v_source->>'videoUrl','')='' THEN
      RAISE EXCEPTION 'ULTIMATE_RELEASE_FILM_MISMATCH';
    END IF;
    IF p_rolled_back_from IS NULL THEN
      SELECT artifacts INTO v_artifacts FROM public.ultimate_lesson_builds
        WHERE id=(v_source->>'sourceLessonBuildId')::uuid AND build_id=v_build_id
          AND competency_id=v_source->>'competencyId' AND status='built' FOR UPDATE;
      IF NOT FOUND OR v_artifacts IS DISTINCT FROM v_source->'contractArtifacts' OR
         v_artifacts #>> '{finished_media_qa,mediaQA,pass}' IS DISTINCT FROM 'true' THEN
        RAISE EXCEPTION 'ULTIMATE_LESSONS_NOT_RELEASE_READY';
      END IF;
    END IF;
    IF (SELECT count(*) FROM public.course_lessons WHERE course_id=v_course_id AND (
        CASE WHEN nullif(v_source->>'canonicalLessonId','') IS NOT NULL
          THEN id=(v_source->>'canonicalLessonId')::uuid ELSE slug=v_source->>'slug' END)) > 1 THEN
      RAISE EXCEPTION 'ULTIMATE_CANONICAL_LESSON_AMBIGUOUS';
    END IF;
    SELECT * INTO v_lesson FROM public.course_lessons
      WHERE course_id=v_course_id AND (
        CASE WHEN nullif(v_source->>'canonicalLessonId','') IS NOT NULL
          THEN id=(v_source->>'canonicalLessonId')::uuid ELSE slug=v_source->>'slug' END
      ) FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'ULTIMATE_CANONICAL_DRAFT_REQUIRED'; END IF;
    IF v_lesson.module_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.course_modules WHERE id=v_lesson.module_id AND course_id=v_course_id
    ) THEN RAISE EXCEPTION 'ULTIMATE_CANONICAL_MODULE_COURSE_MISMATCH'; END IF;
  END LOOP;

  IF (SELECT count(*) FROM public.course_modules WHERE course_id=v_course_id AND slug='ultimate-core') > 1 THEN
    RAISE EXCEPTION 'ULTIMATE_CANONICAL_MODULE_AMBIGUOUS';
  END IF;
  SELECT id INTO v_module FROM public.course_modules
    WHERE course_id=v_course_id AND slug='ultimate-core' LIMIT 1;
  IF v_module IS NULL THEN
    SELECT module_id INTO v_module FROM public.course_lessons
      WHERE course_id=v_course_id AND module_id IS NOT NULL AND id IN (
        SELECT (value->>'canonicalLessonId')::uuid FROM jsonb_array_elements(p_package->'lessons')
        WHERE nullif(value->>'canonicalLessonId','') IS NOT NULL
      ) ORDER BY order_index,id LIMIT 1;
  END IF;
  IF v_module IS NULL THEN
    INSERT INTO public.course_modules(course_id,title,slug,order_index,is_required,is_published,is_draft,created_by)
    SELECT v_course_id,p_package->>'title','ultimate-core',coalesce(max(order_index),0)+1,true,true,false,p_actor
      FROM public.course_modules WHERE course_id=v_course_id RETURNING id INTO v_module;
  END IF;
  UPDATE public.course_modules SET is_published=true,is_draft=false WHERE id=v_module AND course_id=v_course_id;

  FOR v_prepared IN SELECT value FROM jsonb_array_elements(p_rows)
    ORDER BY (value->'row'->>'order_index')::integer, value->>'sourceLessonBuildId' LOOP
    SELECT * INTO v_lesson FROM public.course_lessons WHERE course_id=v_course_id AND (
      CASE WHEN nullif(v_prepared->>'canonicalLessonId','') IS NOT NULL
        THEN id=(v_prepared->>'canonicalLessonId')::uuid ELSE slug=v_prepared->>'slug' END
    ) FOR UPDATE;
    SELECT * INTO v_row FROM jsonb_populate_record(NULL::public.course_lessons,v_prepared->'row');
    SELECT * INTO v_media FROM jsonb_populate_record(NULL::public.video_jobs,v_prepared->'media');
    IF (SELECT count(*) FROM public.video_jobs WHERE course_id=v_course_id AND lesson_id=v_lesson.id
      AND asset_kind='lesson' AND asset_key IS NULL) > 1 THEN
      RAISE EXCEPTION 'ULTIMATE_PRIMARY_MEDIA_JOB_AMBIGUOUS';
    END IF;
    SELECT * INTO v_existing_media FROM public.video_jobs
      WHERE course_id=v_course_id AND lesson_id=v_lesson.id AND asset_kind='lesson' AND asset_key IS NULL FOR UPDATE;
    IF FOUND AND (v_existing_media.status='rendering' OR v_existing_media.lease_expires_at>v_now) THEN
      RAISE EXCEPTION 'ULTIMATE_PRIMARY_MEDIA_JOB_ACTIVE';
    END IF;
    IF v_existing_media.id IS NOT NULL AND v_existing_media.lease_token IS NOT NULL THEN
      RAISE EXCEPTION 'ULTIMATE_PRIMARY_MEDIA_JOB_CHANGED';
    END IF;
    IF v_existing_media.id IS NULL THEN
      INSERT INTO public.video_jobs(course_id,lesson_id,lesson_title,asset_kind,asset_key,status,provider,
        video_url,script,scene_data,duration_seconds,scene_count,completed_at,review_status,reviewed_by,
        reviewed_at,review_notes,quality_evidence)
      VALUES(v_course_id,v_lesson.id,v_media.lesson_title,'lesson',NULL,'complete',v_media.provider,
        v_media.video_url,v_media.script,v_media.scene_data,v_media.duration_seconds,v_media.scene_count,
        v_now,'approved',p_actor,v_now,v_media.review_notes,v_media.quality_evidence) RETURNING id INTO v_media_id;
    ELSE
      UPDATE public.video_jobs SET lesson_title=v_media.lesson_title,status='complete',provider=v_media.provider,
        video_url=v_media.video_url,script=v_media.script,
        scene_data=CASE WHEN v_prepared->'media' ? 'scene_data' THEN v_media.scene_data ELSE scene_data END,
        duration_seconds=v_media.duration_seconds,scene_count=v_media.scene_count,completed_at=v_now,
        review_status='approved',reviewed_by=p_actor,reviewed_at=v_now,
        review_notes=v_media.review_notes,quality_evidence=v_media.quality_evidence
      WHERE id=v_existing_media.id RETURNING id INTO v_media_id;
    END IF;
    IF jsonb_typeof(v_lesson.content_json) NOT IN ('object','null') OR
       jsonb_typeof(v_lesson.content_json->'experience') NOT IN ('object','null') OR
       jsonb_typeof(v_row.content_json->'experience') IS DISTINCT FROM 'object' THEN
      RAISE EXCEPTION 'ULTIMATE_CANONICAL_EXPERIENCE_INVALID';
    END IF;
    v_experience := coalesce(nullif(v_lesson.content_json->'experience','null'::jsonb),'{}'::jsonb) || (v_row.content_json->'experience');
    v_experience := v_experience || jsonb_build_object(
      'knowledgeChecks',public.merge_ultimate_release_questions(v_lesson.content_json #> '{experience,knowledgeChecks}',v_row.content_json #> '{experience,knowledgeChecks}'),
      'reassessment',public.merge_ultimate_release_questions(v_lesson.content_json #> '{experience,reassessment}',v_row.content_json #> '{experience,reassessment}')
    );
    v_content := coalesce(nullif(v_lesson.content_json,'null'::jsonb),'{}'::jsonb) || v_row.content_json || jsonb_build_object('experience',v_experience);
    UPDATE public.course_modules SET is_published=true,is_draft=false
      WHERE id=coalesce(v_lesson.module_id,v_module) AND course_id=v_course_id;
    UPDATE public.course_lessons SET module_id=coalesce(v_lesson.module_id,v_module),title=v_row.title,
      order_index=v_row.order_index,lesson_type=v_row.lesson_type,is_required=true,status='published',
      is_published=true,generation_status='completed',ai_generated=true,approved=true,
      learning_objectives=v_row.learning_objectives,video_url=v_row.video_url,script_text=v_row.script_text,
      scene_data=CASE WHEN v_prepared->'row' ? 'scene_data' THEN v_row.scene_data ELSE scene_data END,
      practical_required=v_row.practical_required,content_json=v_content,published_at=v_now,
      published_by=p_actor,updated_at=v_now,video_job_id=v_media_id,video_status='complete',
      media_origin='generated',media_quality_status='approved',media_quality_evidence=v_media.quality_evidence
    WHERE id=v_lesson.id AND course_id=v_course_id;
    IF NOT EXISTS (SELECT 1 FROM public.course_lessons WHERE id=v_lesson.id AND course_id=v_course_id
      AND video_url=v_row.video_url AND status='published'
      AND content_json->>'contractVersion'=p_package->>'contractVersion') THEN
      RAISE EXCEPTION 'ULTIMATE_CANONICAL_PUBLICATION_READBACK_FAILED';
    END IF;
    -- The next loop must not reuse the preceding row when no media row exists.
    v_existing_media := NULL;
  END LOOP;

  SELECT coalesce(max(version),0)+1 INTO v_version FROM public.ultimate_release_versions WHERE course_id=v_course_id;
  UPDATE public.ultimate_release_versions SET status='superseded' WHERE course_id=v_course_id AND status='released';
  INSERT INTO public.ultimate_release_versions(build_id,course_id,version,package,status,released_by,rolled_back_from)
    VALUES(v_build_id,v_course_id,v_version,p_package,'released',p_actor,p_rolled_back_from) RETURNING * INTO v_release;
  UPDATE public.courses SET status='published',is_active=true,review_status='approved',
    generation_status='published',generation_progress=100,published_at=v_now,published_by=p_actor,
    version=v_version,total_lessons=v_expected,updated_at=v_now WHERE id=v_course_id;
  IF p_rolled_back_from IS NULL THEN
    UPDATE public.ultimate_course_builds SET status='published',updated_at=v_now WHERE id=v_build_id AND course_id=v_course_id;
  END IF;
  IF p_fence IS NOT NULL AND v_job.lease_expires_at<=clock_timestamp() THEN
    RAISE EXCEPTION 'ULTIMATE_JOB_LEASE_LOST';
  END IF;
  RETURN NEXT v_release;
END $$;
REVOKE ALL ON FUNCTION public.commit_ultimate_release(jsonb,jsonb,uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commit_ultimate_release(jsonb,jsonb,uuid,uuid,jsonb) TO service_role;

-- Queue creation and its aggregate status update are one transaction too.
CREATE OR REPLACE FUNCTION public.enqueue_ultimate_build_job(
  p_build uuid,p_payload jsonb DEFAULT '{}'::jsonb,p_monitor jsonb DEFAULT NULL
) RETURNS SETOF public.ultimate_build_jobs
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE v_job public.ultimate_build_jobs%ROWTYPE;
BEGIN
  PERFORM set_config('lock_timeout','5s',true);
  PERFORM 1 FROM public.ultimate_course_builds WHERE id=p_build FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ULTIMATE_BUILD_NOT_FOUND'; END IF;
  -- Do not lock an existing job after its parent: a worker can hold that row
  -- while a dependency wakeup updates the build. We only return existing work.
  SELECT * INTO v_job FROM public.ultimate_build_jobs
    WHERE build_id=p_build AND job_type='course_build' AND status IN ('queued','running')
    ORDER BY created_at DESC,id DESC LIMIT 1;
  IF FOUND THEN RETURN NEXT v_job; RETURN; END IF;
  IF p_monitor IS NULL THEN
    INSERT INTO public.ultimate_build_jobs(build_id,job_type,status,payload)
      VALUES(p_build,'course_build','queued',p_payload) RETURNING * INTO v_job;
  ELSE
    INSERT INTO public.ultimate_build_jobs(build_id,job_type,status,payload,monitor)
      VALUES(p_build,'course_build','queued',p_payload,p_monitor) RETURNING * INTO v_job;
  END IF;
  UPDATE public.ultimate_course_builds SET status='queued',updated_at=now() WHERE id=p_build;
  RETURN NEXT v_job;
END $$;
REVOKE ALL ON FUNCTION public.enqueue_ultimate_build_job(uuid,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_ultimate_build_job(uuid,jsonb,jsonb) TO service_role;
