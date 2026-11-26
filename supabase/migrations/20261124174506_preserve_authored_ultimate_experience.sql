-- Preserve explicitly source-bound authored lessons before accepted media is attached.
-- This forward migration retains the installed release contract, worker fences,
-- published-lesson protection, media QA checks and public-role restrictions.
-- It performs no course/student data update and does not approve a draft.
CREATE SCHEMA IF NOT EXISTS rpc_private;
-- Existing authenticated RLS helpers also use this schema. Preserve its ACL;
-- restrict EXECUTE on this new server-only helper below.
GRANT USAGE ON SCHEMA rpc_private TO service_role;

CREATE OR REPLACE FUNCTION rpc_private.ultimate_authored_preservation(
 p_lesson jsonb, p_profile jsonb, p_competency text, p_artifacts jsonb,
 p_expected_experience jsonb DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = '' AS $preservation$
DECLARE
 v_marker text := nullif(p_lesson#>>'{content_json,authoredLessonId}','');
 v_requirement jsonb := p_profile->'authoredLessonRequirements'->p_competency;
 v_bound jsonb := p_profile->'authoredLessonPreservation'->p_competency;
 v_accepted jsonb := p_artifacts#>'{assessment_alignment,authoredPreservation}';
 v_snapshot jsonb;
 v_current jsonb;
 v_source jsonb;
 v_sources jsonb := p_profile->'instructionalSources';
BEGIN
 -- Removing a marker cannot discard an already captured preservation contract.
 IF v_marker IS NULL AND v_bound IS NULL AND v_requirement IS NULL THEN RETURN NULL; END IF;
 IF v_marker IS NULL OR jsonb_typeof(v_requirement) IS DISTINCT FROM 'object'
  OR v_requirement->>'lessonId' IS DISTINCT FROM p_lesson->>'id'
  OR v_requirement->>'authoredLessonId' IS DISTINCT FROM v_marker
  OR jsonb_typeof(v_bound) IS DISTINCT FROM 'object'
  OR v_bound->>'version' IS DISTINCT FROM 'authored-experience-v1'
  OR v_bound->>'lessonId' IS DISTINCT FROM p_lesson->>'id'
  OR v_bound->>'authoredLessonId' IS DISTINCT FROM v_marker
  OR jsonb_typeof(v_accepted) IS DISTINCT FROM 'object'
  OR (v_accepted - ARRAY['experience','experienceHash','learnerBlueprint','learnerBlueprintHash']) IS DISTINCT FROM v_bound
  OR coalesce(v_bound->>'sourceId','')=''
  OR coalesce(v_bound->>'sourceHash','') !~ '^[0-9a-f]{64}$'
  OR coalesce(v_bound->>'snapshotHash','') !~ '^[0-9a-f]{64}$'
  OR coalesce(v_accepted->>'experienceHash','') !~ '^[0-9a-f]{64}$'
  OR coalesce(v_accepted->>'learnerBlueprintHash','') !~ '^[0-9a-f]{64}$'
  OR jsonb_typeof(v_accepted->'experience') IS DISTINCT FROM 'object'
  OR jsonb_typeof(v_accepted->'learnerBlueprint') IS DISTINCT FROM 'object' THEN
  RAISE EXCEPTION 'ULTIMATE_AUTHORED_PRESERVATION_REQUIRED';
 END IF;
 IF jsonb_typeof(v_sources) IS DISTINCT FROM 'array' THEN
  RAISE EXCEPTION 'ULTIMATE_AUTHORED_SOURCE_CHANGED';
 END IF;
 IF (SELECT count(*) FROM jsonb_array_elements(v_sources) s WHERE s->>'id'=v_bound->>'sourceId') <> 1 THEN
  RAISE EXCEPTION 'ULTIMATE_AUTHORED_SOURCE_CHANGED';
 END IF;
 SELECT s INTO v_source FROM jsonb_array_elements(v_sources) s WHERE s->>'id'=v_bound->>'sourceId';
 IF jsonb_typeof(v_source->'text') IS DISTINCT FROM 'string'
  OR encode(sha256(convert_to(v_source->>'text','UTF8')),'hex') IS DISTINCT FROM v_bound->>'sourceHash' THEN
  RAISE EXCEPTION 'ULTIMATE_AUTHORED_SOURCE_CHANGED';
 END IF;
 v_snapshot := v_bound->'snapshot';
 IF jsonb_typeof(v_snapshot) IS DISTINCT FROM 'object'
  OR NOT (v_snapshot ?& ARRAY['experience','workbook','activityPlan','quizQuestions','content','renderedHtml','learningObjectives','durationMinutes','passingScore'])
  OR jsonb_typeof(v_snapshot->'experience') IS DISTINCT FROM 'object'
  OR jsonb_typeof(v_snapshot->'quizQuestions') IS DISTINCT FROM 'array'
  OR jsonb_typeof(v_snapshot->'learningObjectives') IS DISTINCT FROM 'array' THEN
  RAISE EXCEPTION 'ULTIMATE_AUTHORED_SNAPSHOT_INVALID';
 END IF;
 -- The TypeScript contract hashes sorted canonical JSON before QA. Compare the
 -- accepted profile exactly here rather than incorrectly hashing jsonb::text.
 -- Every authored experience value must remain exact, including ordered arrays.
 IF EXISTS (SELECT 1 FROM jsonb_each(v_snapshot->'experience') e
  WHERE e.value IS DISTINCT FROM v_accepted->'experience'->e.key) THEN
  RAISE EXCEPTION 'ULTIMATE_AUTHORED_EXPERIENCE_CHANGED';
 END IF;
 v_current := jsonb_build_object(
  'experience',coalesce(p_lesson#>'{content_json,experience}','null'::jsonb),
  'workbook',coalesce(p_lesson#>'{content_json,workbook}','null'::jsonb),
  'activityPlan',coalesce(p_lesson#>'{content_json,activityPlan}','null'::jsonb),
  'quizQuestions',coalesce(nullif(p_lesson->'quiz_questions','null'::jsonb),'[]'::jsonb),
  'content',coalesce(p_lesson->'content','null'::jsonb),
  'renderedHtml',coalesce(p_lesson->'rendered_html','null'::jsonb),
  'learningObjectives',coalesce(nullif(p_lesson->'learning_objectives','null'::jsonb),'[]'::jsonb),
  'durationMinutes',coalesce(p_lesson->'duration_minutes','null'::jsonb),
  'passingScore',coalesce(p_lesson->'passing_score','null'::jsonb));
 IF (v_current - 'experience') IS DISTINCT FROM (v_snapshot - 'experience')
  OR ((v_current->'experience') IS DISTINCT FROM (v_snapshot->'experience')
   AND (v_current->'experience') IS DISTINCT FROM (v_accepted->'experience')) THEN
  RAISE EXCEPTION 'ULTIMATE_AUTHORED_SNAPSHOT_CHANGED';
 END IF;
 IF p_expected_experience IS NOT NULL AND p_expected_experience IS DISTINCT FROM v_accepted->'experience' THEN
  RAISE EXCEPTION 'ULTIMATE_AUTHORED_PUBLICATION_CHANGED';
 END IF;
 RETURN v_accepted;
END $preservation$;
REVOKE ALL ON FUNCTION rpc_private.ultimate_authored_preservation(jsonb,jsonb,text,jsonb,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_private.ultimate_authored_preservation(jsonb,jsonb,text,jsonb,jsonb) TO service_role;
COMMENT ON FUNCTION rpc_private.ultimate_authored_preservation(jsonb,jsonb,text,jsonb,jsonb) IS
 'Validates accepted source-bound authored content before media attachment and atomic publication; never approves media or grants learner access.';

CREATE OR REPLACE FUNCTION public.ultimate_attach_lesson_media(p_lesson uuid, p_artifacts jsonb, p_job uuid DEFAULT NULL::uuid, p_worker text DEFAULT NULL::text, p_generation bigint DEFAULT NULL::bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 j public.ultimate_build_jobs%ROWTYPE;
 l public.ultimate_lesson_builds%ROWTYPE;
 b public.ultimate_course_builds%ROWTYPE;
 c public.course_lessons%ROWTYPE;
 canonical uuid;
 film jsonb;
 playback text;
 narration jsonb;
 assessment jsonb;
 questions jsonb;
 merged_questions jsonb;
 checks jsonb;
 reassessment jsonb;
 authored jsonb;
 expected_experience jsonb;
 expected_passing_score integer;
BEGIN
 IF coalesce(auth.role(),'') <> 'service_role' THEN
  RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_SERVICE_ROLE_REQUIRED' USING ERRCODE='42501';
 END IF;
 IF p_job IS NOT NULL THEN
  SELECT * INTO j FROM public.ultimate_build_jobs WHERE id=p_job FOR UPDATE;
  IF NOT FOUND OR j.status <> 'running' OR j.lease_owner IS DISTINCT FROM p_worker
   OR j.execution_generation IS DISTINCT FROM p_generation
   OR j.lease_expires_at IS NULL OR j.lease_expires_at <= clock_timestamp() THEN
   RAISE EXCEPTION 'ULTIMATE_JOB_LEASE_LOST' USING ERRCODE='42501';
  END IF;
 END IF;
 SELECT * INTO l FROM public.ultimate_lesson_builds WHERE id=p_lesson;
 IF NOT FOUND THEN RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_LESSON_REQUIRED'; END IF;
 IF p_job IS NOT NULL THEN PERFORM public.ultimate_assert_autopilot_scope(p_job,p_lesson,l.competency_id,true); END IF;
 SELECT * INTO b FROM public.ultimate_course_builds WHERE id=l.build_id FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_BUILD_REQUIRED'; END IF;
 IF p_job IS NOT NULL THEN
  IF j.build_id IS DISTINCT FROM b.id THEN RAISE EXCEPTION 'ULTIMATE_FENCE_BUILD_MISMATCH'; END IF;
  IF b.profile->>'ownerPaused'='true' THEN RAISE EXCEPTION 'OWNER_PAUSED_REFERENCE_BUILD'; END IF;
 ELSE
  -- Administrative recovery only on a paused, idle build. This cannot resume
  -- generation, change a pause, approve a lesson, or publish a course.
  IF b.profile->>'ownerPaused' IS DISTINCT FROM 'true' OR EXISTS (
   SELECT 1 FROM public.ultimate_build_jobs WHERE build_id=b.id AND status='running'
    AND lease_expires_at > clock_timestamp()
  ) THEN RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_RECOVERY_REQUIRES_PAUSED_IDLE_BUILD'; END IF;
 END IF;
 SELECT * INTO l FROM public.ultimate_lesson_builds WHERE id=p_lesson FOR UPDATE;
 IF l.status IS DISTINCT FROM 'built' OR l.artifacts IS DISTINCT FROM p_artifacts THEN
  RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_ACCEPTED_ARTIFACT_CHANGED';
 END IF;
 film := l.artifacts->'lesson_film_render'->'render';
 narration := l.artifacts->'natural_narration'->'narration';
 IF film->>'success' IS DISTINCT FROM 'true'
  OR nullif(film->>'videoUrl','') IS NULL
  OR nullif(film->>'captionsUrl','') IS NULL
  OR nullif(film->>'transcriptUrl','') IS NULL
  OR l.artifacts->'finished_media_qa'->'mediaQA'->>'pass' IS DISTINCT FROM 'true'
  OR l.artifacts->'narration_qa'->'narrationQA'->>'pass' IS DISTINCT FROM 'true'
  OR jsonb_typeof(narration->'segments') IS DISTINCT FROM 'array'
  OR jsonb_array_length(narration->'segments')=0 THEN
  RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_VERIFIED_MEDIA_REQUIRED';
 END IF;
 canonical := nullif(b.profile->'canonicalLessonIds'->>l.competency_id,'')::uuid;
 IF canonical IS NULL THEN RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_CANONICAL_MAPPING_REQUIRED'; END IF;
 SELECT * INTO c FROM public.course_lessons WHERE id=canonical AND course_id=b.course_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_CANONICAL_LESSON_REQUIRED'; END IF;
 -- Never replace a published or owner-approved film through draft attachment.
 IF c.is_published IS TRUE OR c.approved IS TRUE OR c.status='published' THEN
  IF nullif(c.video_url,'') IS NULL THEN RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_PUBLISHED_MEDIA_MISSING'; END IF;
  RETURN jsonb_build_object('lessonId',c.id,'videoUrl',c.video_url,'preservedPublished',true);
 END IF;
 authored := rpc_private.ultimate_authored_preservation(to_jsonb(c),b.profile,l.competency_id,l.artifacts);
 -- Media-only drafts hid the quiz until the full course release. Use the same
 -- accepted checkpoint, preserving existing question IDs and draft status.
 assessment := l.artifacts#>'{assessment_alignment,assessment}';
 IF jsonb_typeof(assessment->'questions') IS DISTINCT FROM 'array'
  OR jsonb_array_length(assessment->'questions')=0
  OR jsonb_typeof(assessment->'reassessment') IS DISTINCT FROM 'array'
  OR jsonb_array_length(assessment->'reassessment')=0
  OR coalesce(assessment->>'passingScore','') !~ '^[0-9]+$' THEN
  RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_ASSESSMENT_REQUIRED';
 END IF;
 IF (assessment->>'passingScore')::integer NOT BETWEEN 1 AND 100 THEN
  RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_ASSESSMENT_REQUIRED';
 END IF;
 IF EXISTS (SELECT 1 FROM jsonb_array_elements((assessment->'questions')||(assessment->'reassessment')) q
  WHERE nullif(btrim(q->>'id'),'') IS NULL OR nullif(btrim(q->>'prompt'),'') IS NULL
   OR jsonb_typeof(q->'choices') IS DISTINCT FROM 'array'
   OR nullif(btrim(q->>'explanation'),'') IS NULL
   OR nullif(btrim(q->>'remediation'),'') IS NULL
   OR coalesce(q->>'answerIndex','') !~ '^[0-9]+$') THEN
  RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_ASSESSMENT_REQUIRED';
 END IF;
 IF EXISTS (SELECT 1 FROM jsonb_array_elements((assessment->'questions')||(assessment->'reassessment')) q
  WHERE jsonb_array_length(q->'choices')<2
   OR (q->>'answerIndex')::integer >= jsonb_array_length(q->'choices')) THEN
  RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_ASSESSMENT_REQUIRED';
 END IF;
 SELECT jsonb_agg(q || jsonb_build_object(
  'id','ultimate:'||l.id::text||':'||(q->>'id'),
  'question',q->>'prompt','options',q->'choices','correctAnswer',(q->>'answerIndex')::integer))
 INTO questions FROM jsonb_array_elements(assessment->'questions') q;
 SELECT jsonb_agg(q || jsonb_build_object('question',q->>'prompt','options',q->'choices','correct',(q->>'answerIndex')::integer))
 INTO checks FROM jsonb_array_elements(assessment->'questions') q;
 SELECT jsonb_agg(q || jsonb_build_object('question',q->>'prompt','options',q->'choices','correct',(q->>'answerIndex')::integer))
 INTO reassessment FROM jsonb_array_elements(assessment->'reassessment') q;
 SELECT coalesce(jsonb_agg(q),'[]'::jsonb) INTO merged_questions
 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(c.quiz_questions)='array' THEN c.quiz_questions ELSE '[]'::jsonb END) q
 WHERE NOT EXISTS (SELECT 1 FROM jsonb_array_elements(questions) n WHERE n->>'id'=q->>'id');
 merged_questions := merged_questions || questions;
 expected_passing_score := (assessment->>'passingScore')::integer;
 expected_experience := coalesce(c.content_json->'experience','{}'::jsonb)||jsonb_build_object(
  'knowledgeChecks',checks,'reassessment',reassessment,
  'learningActivities',l.artifacts->'active_teaching'->'activities');
 IF authored IS NOT NULL THEN
  -- The authored learner projection was fixed and hashed before media QA.
  -- Generated assessments remain available in their genuine artifact and the
  -- separate assessment field; they do not replace the reviewed authored quiz.
  merged_questions := c.quiz_questions;
  expected_passing_score := c.passing_score;
  expected_experience := authored->'experience';
 END IF;
 playback := '/api/courses/'||b.course_id::text||'/lessons/'||c.id::text||'/playback';
 UPDATE public.course_lessons SET
  video_url=playback,
  video_status='complete', video_error=NULL,
  quiz_questions=merged_questions, passing_score=expected_passing_score,
  duration_seconds=ceil((film->>'duration')::numeric)::integer,
  script_text=coalesce(l.artifacts->'instructor_script'->'script'->>'script',script_text),
  scene_data=film->'sceneData',
  content_json=coalesce(content_json,'{}'::jsonb)||jsonb_build_object(
   'film',jsonb_build_object('videoUrl',film->>'videoUrl','playbackUrl',playback,
    'captionsUrl',film->>'captionsUrl','transcriptUrl',film->>'transcriptUrl'),
   'mediaAttachment',jsonb_build_object('buildId',b.id,'sourceLessonBuildId',l.id,
    'attachedAt',now(),'publicationPending',true),
   'savedNarration',narration,
   'assessment',assessment,
   'experience',expected_experience),
  updated_at=now()
 WHERE id=c.id AND course_id=b.course_id;
 SELECT * INTO c FROM public.course_lessons WHERE id=canonical AND course_id=b.course_id;
 IF c.video_url IS DISTINCT FROM playback
  OR c.content_json->'film'->>'videoUrl' IS DISTINCT FROM film->>'videoUrl'
  OR c.content_json->'mediaAttachment'->>'sourceLessonBuildId' IS DISTINCT FROM l.id::text
  OR c.content_json->'film'->>'captionsUrl' IS DISTINCT FROM film->>'captionsUrl'
  OR c.content_json->'film'->>'transcriptUrl' IS DISTINCT FROM film->>'transcriptUrl'
  OR c.content_json->'savedNarration' IS DISTINCT FROM narration
  OR c.video_status IS DISTINCT FROM 'complete'
  OR c.quiz_questions IS DISTINCT FROM merged_questions
  OR c.passing_score IS DISTINCT FROM expected_passing_score
  OR c.content_json->'assessment' IS DISTINCT FROM assessment
  OR c.content_json->'experience' IS DISTINCT FROM expected_experience THEN
  RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_READBACK_FAILED';
 END IF;
 PERFORM rpc_private.ultimate_authored_preservation(to_jsonb(c),b.profile,l.competency_id,l.artifacts,expected_experience);
 RETURN jsonb_build_object('lessonId',c.id,'videoUrl',c.video_url,'sourceLessonBuildId',l.id,
  'preservedPublished',false,'publicationPending',true);
END
$function$;

CREATE OR REPLACE FUNCTION public.commit_ultimate_publication_core(p_package jsonb, p_rows jsonb, p_actor uuid, p_rolled_back_from uuid DEFAULT NULL::uuid, p_fence jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
  v_experience jsonb; v_content jsonb; v_authored jsonb;
  v_module uuid; v_media_id uuid; v_version integer;
  v_now timestamptz := now(); v_count integer; v_expected integer;
  v_partial boolean := coalesce(p_package->>'releaseScope','course')='lesson';
  v_write_count integer; v_preserved boolean; v_partial_ids jsonb := '[]'::jsonb;
BEGIN
  PERFORM set_config('lock_timeout','5s',true);
  IF p_actor IS NULL OR v_course_id IS NULL OR v_build_id IS NULL OR
     p_package->>'contractVersion' IS DISTINCT FROM 'ultimate-lesson-2026-10-29.1' OR
     jsonb_typeof(p_package->'lessons') IS DISTINCT FROM 'array' OR
     jsonb_typeof(p_rows) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'ULTIMATE_RELEASE_CONTRACT_REQUIRED';
  END IF;
  IF coalesce(p_package->>'releaseScope','course') NOT IN ('course','lesson') OR
     (v_partial AND p_rolled_back_from IS NOT NULL) THEN
    RAISE EXCEPTION 'ULTIMATE_RELEASE_SCOPE_INVALID';
  END IF;
  v_expected := jsonb_array_length(p_package->'lessons');
  SELECT count(*) INTO v_write_count FROM jsonb_array_elements(p_package->'lessons')
    WHERE value->>'preservedPublished' IS DISTINCT FROM 'true';
  IF v_expected = 0 OR (v_partial AND (v_expected<>1 OR v_write_count<>1)) OR
     jsonb_array_length(p_rows) <> v_write_count OR
     (SELECT count(DISTINCT value->>'sourceLessonBuildId') FROM jsonb_array_elements(p_package->'lessons')
       WHERE value->>'preservedPublished' IS DISTINCT FROM 'true') <> v_write_count OR
     (SELECT count(DISTINCT value->>'competencyId') FROM jsonb_array_elements(p_package->'lessons')) <> v_expected OR
     (SELECT count(DISTINCT value->>'sourceLessonBuildId') FROM jsonb_array_elements(p_rows)) <> v_write_count THEN
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
  IF p_fence IS NOT NULL AND v_job.payload->'autopilot' IS NOT NULL THEN
    IF NOT v_partial THEN RAISE EXCEPTION 'ULTIMATE_AUTOPILOT_COURSE_RELEASE_REQUIRES_COORDINATOR'; END IF;
    PERFORM public.ultimate_assert_autopilot_scope(v_job.id,
      (p_package->'lessons'->0->>'sourceLessonBuildId')::uuid,p_package->'lessons'->0->>'competencyId',true);
  END IF;
  IF NOT v_partial THEN
  SELECT * INTO v_release FROM public.ultimate_release_versions
    WHERE course_id=v_course_id AND build_id=v_build_id AND status='released'
      AND package=p_package AND rolled_back_from IS NOT DISTINCT FROM p_rolled_back_from
    ORDER BY version DESC LIMIT 1;
  IF FOUND THEN RETURN to_jsonb(v_release); END IF;
  END IF;

  IF p_rolled_back_from IS NULL THEN
    IF (NOT v_partial AND v_build.status <> 'built') OR
       (v_partial AND (v_build.status IN ('archived','cancelled') OR
         v_build.profile->>'publishCompletedLessons' IS DISTINCT FROM 'true')) OR
       v_build.profile IS DISTINCT FROM p_package->'profile' THEN
      RAISE EXCEPTION 'ULTIMATE_BUILD_NOT_RELEASE_READY';
    END IF;
    IF NOT v_partial AND coalesce(jsonb_array_length(v_build.profile->'competencies'),0) <> v_expected THEN
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
    v_preserved := v_source->>'preservedPublished'='true';
    IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p_package->'profile'->'competencies') c
      WHERE c->>'id'=v_source->>'competencyId') OR
      (p_package->'profile'->'canonicalLessonIds'->> (v_source->>'competencyId') IS NOT NULL AND
       p_package->'profile'->'canonicalLessonIds'->> (v_source->>'competencyId')
         IS DISTINCT FROM v_source->>'canonicalLessonId') THEN
      RAISE EXCEPTION 'ULTIMATE_CANONICAL_LESSON_MAPPING_REQUIRED';
    END IF;
    IF v_preserved THEN
      IF p_package->'profile'->>'publishCompletedLessons' IS DISTINCT FROM 'true' OR
        coalesce(v_source->>'canonicalLessonId','')='' OR
        NOT (coalesce(p_package->'profile'->'preservedPublishedLessonIds','[]'::jsonb) ? (v_source->>'canonicalLessonId')) THEN
        RAISE EXCEPTION 'ULTIMATE_PRESERVED_PUBLICATION_MAPPING_REQUIRED';
      END IF;
    ELSE
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
    v_partial_ids := v_partial_ids || to_jsonb(v_lesson.id);
    IF v_preserved AND (v_lesson.status::text IS DISTINCT FROM 'published' OR
       v_lesson.is_published IS DISTINCT FROM true OR v_lesson.video_status IS DISTINCT FROM 'complete' OR
       v_lesson.video_url IS DISTINCT FROM v_source->>'videoUrl' OR coalesce(v_lesson.video_url,'')='') THEN
      RAISE EXCEPTION 'ULTIMATE_PRESERVED_PUBLICATION_CHANGED';
    END IF;
    IF v_partial AND (v_lesson.is_published=true OR v_lesson.status::text='published') THEN
      IF v_lesson.video_status IS DISTINCT FROM 'complete' OR coalesce(v_lesson.video_url,'')='' THEN
        RAISE EXCEPTION 'ULTIMATE_PRESERVED_PUBLICATION_CHANGED';
      END IF;
      IF p_fence IS NOT NULL AND v_job.lease_expires_at<=clock_timestamp() THEN
        RAISE EXCEPTION 'ULTIMATE_JOB_LEASE_LOST';
      END IF;
      RETURN jsonb_build_object('scope','lesson','lessonIds',v_partial_ids,
        'committedAt',v_now,'preservedExisting',true);
    END IF;
    IF NOT coalesce(v_preserved,false) THEN
      PERFORM rpc_private.ultimate_authored_preservation(to_jsonb(v_lesson),p_package->'profile',
        v_source->>'competencyId',v_source->'contractArtifacts',v_prepared#>'{row,content_json,experience}');
    END IF;
    IF v_lesson.module_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.course_modules WHERE id=v_lesson.module_id AND course_id=v_course_id
    ) THEN RAISE EXCEPTION 'ULTIMATE_CANONICAL_MODULE_COURSE_MISMATCH'; END IF;
  END LOOP;

  IF (SELECT count(DISTINCT value) FROM jsonb_array_elements_text(v_partial_ids)) <> v_expected THEN
    RAISE EXCEPTION 'ULTIMATE_CANONICAL_LESSON_DUPLICATE';
  END IF;

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
    SELECT value INTO v_source FROM jsonb_array_elements(p_package->'lessons')
      WHERE value->>'sourceLessonBuildId'=v_prepared->>'sourceLessonBuildId';
    v_authored := rpc_private.ultimate_authored_preservation(to_jsonb(v_lesson),p_package->'profile',
      v_source->>'competencyId',v_source->'contractArtifacts',v_prepared#>'{row,content_json,experience}');
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
    IF v_authored IS NOT NULL THEN
      v_experience := v_authored->'experience';
    ELSE
    v_experience := coalesce(nullif(v_lesson.content_json->'experience','null'::jsonb),'{}'::jsonb) || (v_row.content_json->'experience');
    v_experience := v_experience || jsonb_build_object(
      'knowledgeChecks',public.merge_ultimate_release_questions(v_lesson.content_json #> '{experience,knowledgeChecks}',v_row.content_json #> '{experience,knowledgeChecks}'),
      'reassessment',public.merge_ultimate_release_questions(v_lesson.content_json #> '{experience,reassessment}',v_row.content_json #> '{experience,reassessment}')
    );
    IF (coalesce(v_lesson.practical_required,false) OR coalesce(v_row.practical_required,false)) AND
       coalesce(jsonb_typeof(v_experience->'practicalTask'),'null')='null' AND
       v_lesson.content_json #> '{experience,practicalTask}' IS NOT NULL THEN
      v_experience := v_experience || jsonb_build_object('practicalTask',v_lesson.content_json #> '{experience,practicalTask}');
    END IF;
    END IF;
    v_content := coalesce(nullif(v_lesson.content_json,'null'::jsonb),'{}'::jsonb) || v_row.content_json ||
      jsonb_build_object('experience',v_experience,'mediaAttachment',
        CASE WHEN jsonb_typeof(v_lesson.content_json->'mediaAttachment')='object'
          THEN v_lesson.content_json->'mediaAttachment' ELSE '{}'::jsonb END ||
        jsonb_build_object('publicationPending',false,'publishedAt',v_now,
          'sourceLessonBuildId',v_prepared->>'sourceLessonBuildId'));
    IF v_authored IS NOT NULL THEN
      -- Retain presence as well as values of authored workbook/plan/identity.
      v_content := (v_content - ARRAY['workbook','activityPlan','authoredLessonId']) ||
        coalesce((SELECT jsonb_object_agg(e.key,e.value) FROM jsonb_each(v_lesson.content_json) e
          WHERE e.key IN ('workbook','activityPlan','authoredLessonId')),'{}'::jsonb);
    END IF;
    UPDATE public.course_modules SET is_published=true,is_draft=false
      WHERE id=coalesce(v_lesson.module_id,v_module) AND course_id=v_course_id;
    UPDATE public.course_lessons SET module_id=coalesce(v_lesson.module_id,v_module),title=v_row.title,
      order_index=coalesce(v_lesson.order_index,v_row.order_index),lesson_type=coalesce(v_lesson.lesson_type,v_row.lesson_type),is_required=true,status='published',
      is_published=true,generation_status='completed',ai_generated=true,approved=true,
      learning_objectives=CASE WHEN v_authored IS NOT NULL THEN v_lesson.learning_objectives ELSE v_row.learning_objectives END,video_url=v_row.video_url,script_text=v_row.script_text,
      scene_data=CASE WHEN v_prepared->'row' ? 'scene_data' THEN v_row.scene_data ELSE scene_data END,
      practical_required=coalesce(v_lesson.practical_required,false) OR coalesce(v_row.practical_required,false),content_json=v_content,published_at=v_now,
      published_by=p_actor,updated_at=v_now,video_job_id=v_media_id,video_status='complete',
      media_origin='generated',media_quality_status='approved',media_quality_evidence=v_media.quality_evidence
    WHERE id=v_lesson.id AND course_id=v_course_id;
    IF NOT EXISTS (SELECT 1 FROM public.course_lessons WHERE id=v_lesson.id AND course_id=v_course_id
      AND video_url=v_row.video_url AND status='published'
      AND content_json->>'contractVersion'=p_package->>'contractVersion') THEN
      RAISE EXCEPTION 'ULTIMATE_CANONICAL_PUBLICATION_READBACK_FAILED';
    END IF;
    IF v_authored IS NOT NULL THEN
      SELECT * INTO v_lesson FROM public.course_lessons WHERE id=v_lesson.id AND course_id=v_course_id;
      PERFORM rpc_private.ultimate_authored_preservation(to_jsonb(v_lesson),p_package->'profile',
        v_source->>'competencyId',v_source->'contractArtifacts',v_experience);
    END IF;
    -- The next loop must not reuse the preceding row when no media row exists.
    v_existing_media := NULL;
  END LOOP;

  IF v_partial THEN
    IF p_fence IS NOT NULL AND v_job.lease_expires_at<=clock_timestamp() THEN
      RAISE EXCEPTION 'ULTIMATE_JOB_LEASE_LOST';
    END IF;
    RETURN jsonb_build_object('scope','lesson','lessonIds',v_partial_ids,'committedAt',v_now);
  END IF;

  SELECT coalesce(max(version),0)+1 INTO v_version FROM public.ultimate_release_versions WHERE course_id=v_course_id;
  UPDATE public.ultimate_release_versions SET status='superseded' WHERE course_id=v_course_id AND status='released';
  INSERT INTO public.ultimate_release_versions(build_id,course_id,version,package,status,released_by,rolled_back_from)
    VALUES(v_build_id,v_course_id,v_version,p_package,'released',p_actor,p_rolled_back_from) RETURNING * INTO v_release;
  UPDATE public.courses SET status='published',is_active=true,review_status='approved',
    generation_status='published',generation_progress=100,published_at=v_now,published_by=p_actor,
    version=v_version,total_lessons=(SELECT count(*) FROM public.course_lessons counted WHERE counted.course_id=v_course_id AND counted.status='published' AND counted.is_published=true AND coalesce(counted.is_required,true)),updated_at=v_now WHERE id=v_course_id;
  IF p_rolled_back_from IS NULL THEN
    UPDATE public.ultimate_course_builds SET status='published',updated_at=v_now WHERE id=v_build_id AND course_id=v_course_id;
  END IF;
  IF p_fence IS NOT NULL AND v_job.lease_expires_at<=clock_timestamp() THEN
    RAISE EXCEPTION 'ULTIMATE_JOB_LEASE_LOST';
  END IF;
  RETURN to_jsonb(v_release);
END $function$;

-- CREATE OR REPLACE retains the current ACL; restate the narrow server boundary
-- explicitly so a fresh migration install is just as restrictive.
REVOKE ALL ON FUNCTION public.ultimate_attach_lesson_media(uuid,jsonb,uuid,text,bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ultimate_attach_lesson_media(uuid,jsonb,uuid,text,bigint) TO service_role;
REVOKE ALL ON FUNCTION public.commit_ultimate_publication_core(jsonb,jsonb,uuid,uuid,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.commit_ultimate_publication_core(jsonb,jsonb,uuid,uuid,jsonb) TO service_role;
