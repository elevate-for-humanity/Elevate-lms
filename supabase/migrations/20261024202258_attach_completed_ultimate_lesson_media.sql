-- Attach accepted media to its canonical draft before the worker advances.
-- Publication and owner approval remain separate; no renderer is queued here.
CREATE OR REPLACE FUNCTION public.ultimate_attach_lesson_media(
 p_lesson uuid, p_artifacts jsonb, p_job uuid DEFAULT NULL,
 p_worker text DEFAULT NULL, p_generation bigint DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $fn$
DECLARE
 j public.ultimate_build_jobs%ROWTYPE;
 l public.ultimate_lesson_builds%ROWTYPE;
 b public.ultimate_course_builds%ROWTYPE;
 c public.course_lessons%ROWTYPE;
 canonical uuid;
 film jsonb;
 playback text;
 narration jsonb;
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
 playback := '/api/courses/'||b.course_id::text||'/lessons/'||c.id::text||'/playback';
 UPDATE public.course_lessons SET
  video_url=playback,
  video_status='complete', video_error=NULL,
  duration_seconds=ceil((film->>'duration')::numeric)::integer,
  script_text=coalesce(l.artifacts->'instructor_script'->'script'->>'script',script_text),
  scene_data=film->'sceneData',
  content_json=coalesce(content_json,'{}'::jsonb)||jsonb_build_object(
   'film',jsonb_build_object('videoUrl',film->>'videoUrl','playbackUrl',playback,
    'captionsUrl',film->>'captionsUrl','transcriptUrl',film->>'transcriptUrl'),
   'mediaAttachment',jsonb_build_object('buildId',b.id,'sourceLessonBuildId',l.id,
    'attachedAt',now(),'publicationPending',true),
   'savedNarration',narration),
  updated_at=now()
 WHERE id=c.id AND course_id=b.course_id;
 SELECT * INTO c FROM public.course_lessons WHERE id=canonical AND course_id=b.course_id;
 IF c.video_url IS DISTINCT FROM playback
  OR c.content_json->'film'->>'videoUrl' IS DISTINCT FROM film->>'videoUrl'
  OR c.content_json->'mediaAttachment'->>'sourceLessonBuildId' IS DISTINCT FROM l.id::text
  OR c.content_json->'film'->>'captionsUrl' IS DISTINCT FROM film->>'captionsUrl'
  OR c.content_json->'film'->>'transcriptUrl' IS DISTINCT FROM film->>'transcriptUrl'
  OR c.content_json->'savedNarration' IS DISTINCT FROM narration
  OR c.video_status IS DISTINCT FROM 'complete' THEN
  RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_READBACK_FAILED';
 END IF;
 RETURN jsonb_build_object('lessonId',c.id,'videoUrl',c.video_url,'sourceLessonBuildId',l.id,
  'preservedPublished',false,'publicationPending',true);
END
$fn$;
REVOKE ALL ON FUNCTION public.ultimate_attach_lesson_media(uuid,jsonb,uuid,text,bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ultimate_attach_lesson_media(uuid,jsonb,uuid,text,bigint) TO service_role;
