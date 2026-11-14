-- Rollback-only database regression. Synthetic test media is never committed,
-- served to a student, or represented as real inspection evidence.
BEGIN;
DO $$
DECLARE
  v_actor uuid; v_course uuid; v_module uuid; v_build uuid;
  v_first uuid; v_second uuid; v_source_a uuid; v_source_b uuid; v_job uuid; v_fence jsonb;
  v_profile jsonb; v_artifacts jsonb; v_package jsonb;
  v_rows jsonb := '[]'; v_bad_rows jsonb; v_item jsonb;
  v_lesson uuid; v_source uuid; v_key text; v_order integer := 0;
  v_release uuid; v_again uuid; v_count integer;
  v_partial_package jsonb; v_result jsonb; v_snapshot jsonb; v_type text;
BEGIN
  IF EXISTS(SELECT 1 FROM public.courses WHERE slug='qa-atomic-publication-transaction-test') THEN
    RAISE EXCEPTION 'QA publication slug already exists; refusing to change an existing course';
  END IF;
  SELECT id INTO v_actor FROM public.profiles WHERE role IN ('admin','super_admin') ORDER BY id LIMIT 1;
  IF v_actor IS NULL THEN RAISE EXCEPTION 'QA_ACTOR_REQUIRED'; END IF;
  INSERT INTO public.courses(slug,title,status,is_active,compliance_profile_key)
    VALUES('qa-atomic-publication-transaction-test','Rollback-only publication regression','draft',false,'internal_basic')
    RETURNING id INTO v_course;
  INSERT INTO public.course_modules(course_id,slug,title,order_index,is_required,is_published,is_draft,created_by)
    VALUES(v_course,'existing-module','Existing draft module',1,true,false,true,v_actor) RETURNING id INTO v_module;
  INSERT INTO public.course_lessons(course_id,module_id,slug,title,order_index,status,is_published,approved,ai_generated,content_json)
    VALUES(v_course,v_module,'qa-a','Old a',1,'draft',false,false,false,
      '{"experience":{"knowledgeChecks":[{"id":"old-check","question":"Preserved check"}],"reassessment":[]}}') RETURNING id INTO v_first;
  INSERT INTO public.course_lessons(course_id,module_id,slug,title,order_index,status,is_published,approved,ai_generated)
    VALUES(v_course,v_module,'qa-b','Old b',2,'draft',false,false,false) RETURNING id INTO v_second;
  v_profile := '{"title":"Rollback-only publication regression","competencies":[{"id":"qa-a"},{"id":"qa-b"}]}'::jsonb;
  INSERT INTO public.ultimate_course_builds(course_id,profile,status)
    VALUES(v_course,v_profile,'built') RETURNING id INTO v_build;
  INSERT INTO public.ultimate_build_jobs(build_id,status,lease_owner,lease_expires_at,execution_generation,attempts)
    VALUES(v_build,'running','qa-worker',now()+interval '5 minutes',7,1) RETURNING id INTO v_job;
  v_fence := jsonb_build_object('jobId',v_job,'workerId','qa-worker','generation',7);
  v_artifacts := '{"finished_media_qa":{"mediaQA":{"pass":true,"inspection":{"testOnly":true}}}}'::jsonb;
  INSERT INTO public.ultimate_lesson_builds(build_id,lesson_key,competency_id,status,artifacts)
    VALUES(v_build,'qa-a','qa-a','built',v_artifacts) RETURNING id INTO v_source_a;
  INSERT INTO public.ultimate_lesson_builds(build_id,lesson_key,competency_id,status,artifacts)
    VALUES(v_build,'qa-b','qa-b','built',v_artifacts) RETURNING id INTO v_source_b;
  v_package := jsonb_build_object('contractVersion','ultimate-lesson-2026-10-05.1','schemaVersion',2,
    'courseId',v_course,'buildId',v_build,'title','Rollback-only publication regression','profile',v_profile,
    'lessons',jsonb_build_array(
      jsonb_build_object('sourceLessonBuildId',v_source_a,'canonicalLessonId',v_first,'competencyId','qa-a','slug','qa-a','videoUrl','https://example.invalid/qa-a.mp4','contractArtifacts',v_artifacts),
      jsonb_build_object('sourceLessonBuildId',v_source_b,'canonicalLessonId',v_second,'competencyId','qa-b','slug','qa-b','videoUrl','https://example.invalid/qa-b.mp4','contractArtifacts',v_artifacts)));
  FOR v_item IN SELECT value FROM jsonb_array_elements(v_package->'lessons') LOOP
    v_order := v_order+1;
    v_rows := v_rows || jsonb_build_array(v_item || jsonb_build_object(
      'row',jsonb_build_object('title','QA published '||v_order,'order_index',v_order,'lesson_type','lesson',
        'learning_objectives',jsonb_build_array('Objective'),'video_url',v_item->>'videoUrl','script_text',repeat('Test script. ',30),
        'practical_required',false,'content_json',jsonb_build_object('contractVersion','ultimate-lesson-2026-10-05.1',
          'experience',jsonb_build_object('knowledgeChecks',jsonb_build_array(jsonb_build_object('id','new-check-'||v_order)), 'reassessment','[]'::jsonb))),
      'media',jsonb_build_object('lesson_title','QA test media','provider','remotion','video_url',v_item->>'videoUrl',
        'script','Rollback-only test','duration_seconds',60,'scene_count',1,'review_notes','Rollback-only test',
        'quality_evidence',jsonb_build_object('testOnly',true))));
  END LOOP;

  v_profile := v_profile || jsonb_build_object('publishCompletedLessons',true,
    'canonicalLessonIds',jsonb_build_object('qa-a',v_first,'qa-b',v_second));
  UPDATE public.ultimate_course_builds SET profile=v_profile,status='running' WHERE id=v_build;
  v_package := jsonb_set(v_package,'{profile}',v_profile);
  v_partial_package := jsonb_set(v_package,'{lessons}',jsonb_build_array(v_package->'lessons'->0));
  SELECT lesson_type INTO v_type FROM public.course_lessons WHERE id=v_first;
  UPDATE public.course_lessons SET practical_required=true,order_index=7,
    content_json=jsonb_set(content_json,'{experience,practicalTask}','{"title":"Existing practical requirement"}'::jsonb)
    WHERE id=v_first;

  BEGIN
    PERFORM public.commit_ultimate_lesson_release(v_partial_package,
      jsonb_build_array(jsonb_set(v_rows->0,'{media,duration_seconds}','"not-a-duration"'::jsonb)),v_actor,v_fence);
    RAISE EXCEPTION 'Expected partial publication failure';
  EXCEPTION WHEN invalid_text_representation THEN
    IF position('not-a-duration' IN SQLERRM)=0 THEN RAISE; END IF;
  END;
  IF (SELECT status FROM public.course_lessons WHERE id=v_first) IS DISTINCT FROM 'draft' OR
     (SELECT is_published FROM public.course_modules WHERE id=v_module) IS DISTINCT FROM false OR
     EXISTS(SELECT 1 FROM public.video_jobs WHERE course_id=v_course) THEN
    RAISE EXCEPTION 'PARTIAL_ATOMICITY_REGRESSION';
  END IF;
  BEGIN
    PERFORM public.commit_ultimate_lesson_release(v_partial_package,jsonb_build_array(v_rows->0),v_actor,
      jsonb_set(v_fence,'{generation}','6'::jsonb));
    RAISE EXCEPTION 'Expected stale partial publication rejection';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'ULTIMATE_JOB_LEASE_LOST' THEN RAISE; END IF;
  END;
  v_result := public.commit_ultimate_lesson_release(v_partial_package,jsonb_build_array(v_rows->0),v_actor,v_fence);
  IF v_result->>'scope' IS DISTINCT FROM 'lesson' OR v_result#>>'{lessonIds,0}' IS DISTINCT FROM v_first::text OR
     (SELECT status FROM public.course_lessons WHERE id=v_first) IS DISTINCT FROM 'published' OR
     (SELECT status FROM public.course_lessons WHERE id=v_second) IS DISTINCT FROM 'draft' OR
     (SELECT status::text FROM public.courses WHERE id=v_course) IS DISTINCT FROM 'draft' OR
     (SELECT status FROM public.ultimate_course_builds WHERE id=v_build) IS DISTINCT FROM 'running' OR
     EXISTS(SELECT 1 FROM public.ultimate_release_versions WHERE course_id=v_course) THEN
    RAISE EXCEPTION 'PARTIAL_PUBLICATION_SCOPE_REGRESSION';
  END IF;
  IF (SELECT lesson_type::text FROM public.course_lessons WHERE id=v_first) IS DISTINCT FROM v_type OR
     (SELECT practical_required FROM public.course_lessons WHERE id=v_first) IS DISTINCT FROM true OR
     (SELECT order_index FROM public.course_lessons WHERE id=v_first) IS DISTINCT FROM 7 OR
     (SELECT content_json#>>'{experience,practicalTask,title}' FROM public.course_lessons WHERE id=v_first)
        IS DISTINCT FROM 'Existing practical requirement' OR
     (SELECT content_json#>>'{mediaAttachment,publicationPending}' FROM public.course_lessons WHERE id=v_first)
        IS DISTINCT FROM 'false' THEN
    RAISE EXCEPTION 'CANONICAL_REQUIREMENT_PRESERVATION_REGRESSION';
  END IF;
  SELECT to_jsonb(l) INTO v_snapshot FROM public.course_lessons l WHERE id=v_first;
  v_result := public.commit_ultimate_lesson_release(v_partial_package,
    jsonb_build_array(jsonb_set(v_rows->0,'{row,title}','"Must not replace the published lesson"'::jsonb)),v_actor,v_fence);
  IF v_result->>'preservedExisting' IS DISTINCT FROM 'true' OR
     (SELECT to_jsonb(l) FROM public.course_lessons l WHERE id=v_first) IS DISTINCT FROM v_snapshot THEN
    RAISE EXCEPTION 'PARTIAL_RETRY_REPLACED_PUBLICATION';
  END IF;

  v_profile := v_profile || jsonb_build_object('preservedPublishedLessonIds',jsonb_build_array(v_first));
  UPDATE public.ultimate_course_builds SET profile=v_profile,status='built' WHERE id=v_build;
  v_package := jsonb_set(v_package,'{profile}',v_profile);
  v_package := jsonb_set(v_package,'{lessons,0}',
    ((v_package->'lessons'->0)-'sourceLessonBuildId'-'contractArtifacts') || '{"preservedPublished":true}'::jsonb);
  BEGIN
    PERFORM public.commit_ultimate_release(v_package,
      jsonb_build_array(jsonb_set(v_rows->1,'{media,duration_seconds}','"not-a-duration"'::jsonb)),v_actor,NULL,v_fence);
    RAISE EXCEPTION 'Expected final publication failure';
  EXCEPTION WHEN invalid_text_representation THEN
    IF position('not-a-duration' IN SQLERRM)=0 THEN RAISE; END IF;
  END;
  IF (SELECT to_jsonb(l) FROM public.course_lessons l WHERE id=v_first) IS DISTINCT FROM v_snapshot OR
     (SELECT status FROM public.course_lessons WHERE id=v_second) IS DISTINCT FROM 'draft' OR
     EXISTS(SELECT 1 FROM public.ultimate_release_versions WHERE course_id=v_course) THEN
    RAISE EXCEPTION 'PRESERVED_FINAL_ATOMICITY_REGRESSION';
  END IF;
  SELECT id INTO v_release FROM public.commit_ultimate_release(v_package,jsonb_build_array(v_rows->1),v_actor,NULL,v_fence);
  IF (SELECT to_jsonb(l) FROM public.course_lessons l WHERE id=v_first) IS DISTINCT FROM v_snapshot OR
     (SELECT status FROM public.course_lessons WHERE id=v_second) IS DISTINCT FROM 'published' OR
     (SELECT status::text FROM public.courses WHERE id=v_course) IS DISTINCT FROM 'published' OR
     (SELECT status FROM public.ultimate_course_builds WHERE id=v_build) IS DISTINCT FROM 'published' OR
     (SELECT count(*) FROM public.ultimate_release_versions WHERE course_id=v_course) <> 1 THEN
    RAISE EXCEPTION 'PRESERVED_FINAL_PUBLICATION_REGRESSION';
  END IF;
  SELECT id INTO v_again FROM public.commit_ultimate_release(v_package,jsonb_build_array(v_rows->1),v_actor);
  IF v_again IS DISTINCT FROM v_release THEN RAISE EXCEPTION 'PRESERVED_FINAL_IDEMPOTENCY_REGRESSION'; END IF;
  SELECT jsonb_agg(to_jsonb(l) ORDER BY l.id) INTO v_bad_rows
    FROM public.course_lessons l WHERE course_id=v_course;
  v_profile := v_profile || jsonb_build_object('preservedPublishedLessonIds',jsonb_build_array(v_first,v_second));
  UPDATE public.ultimate_course_builds SET profile=v_profile,status='built' WHERE id=v_build;
  v_package := jsonb_set(v_package,'{profile}',v_profile);
  v_package := jsonb_set(v_package,'{lessons,1}',
    ((v_package->'lessons'->1)-'sourceLessonBuildId'-'contractArtifacts') || '{"preservedPublished":true}'::jsonb);
  SELECT id INTO v_again FROM public.commit_ultimate_release(v_package,'[]'::jsonb,v_actor,NULL,v_fence);
  IF (SELECT jsonb_agg(to_jsonb(l) ORDER BY l.id) FROM public.course_lessons l WHERE course_id=v_course)
       IS DISTINCT FROM v_bad_rows OR
     (SELECT count(*) FROM public.ultimate_release_versions WHERE course_id=v_course) <> 2 THEN
    RAISE EXCEPTION 'ALL_PRESERVED_PUBLICATION_REGRESSION';
  END IF;

  IF has_function_privilege('anon','public.commit_ultimate_lesson_release(jsonb,jsonb,uuid,jsonb)','EXECUTE') OR
     has_function_privilege('authenticated','public.commit_ultimate_publication_core(jsonb,jsonb,uuid,uuid,jsonb)','EXECUTE') THEN
    RAISE EXCEPTION 'PARTIAL_AUTHORIZATION_REGRESSION';
  END IF;
END $$;
ROLLBACK;
SELECT NOT EXISTS(SELECT 1 FROM public.courses WHERE slug='qa-atomic-publication-transaction-test') AS test_fixtures_removed;
