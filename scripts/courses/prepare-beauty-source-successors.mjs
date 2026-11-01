/** Emits a reviewable scoped DML repair. Does not connect or print credentials.
 * Apply only through the authorized main-project database connection. */
import {defaultCourseMonitor} from '../../lib/ultimate-course-builder/worker/default-course-monitor.mjs';
import {registeredBeautyLessons,BEAUTY_SOURCE_VERSION} from '../../lib/curriculum/registered-beauty/index.mjs';
const quote=value=>`'${JSON.stringify(value).replaceAll("'","''")}'::jsonb`;
const repairs=[['b79b0d56-e27d-4218-81a5-5de1f3376e8d','8f3472fe-8fe9-4e16-bc31-d502e3de3c7a','esthetician',20],['370f51b9-08cd-469e-b4c3-69534156ce7c','377cd34a-b402-40ab-8ff9-2fcfd394b96d','manicurist',19]];
console.log(`DO $repair$
DECLARE old_build public.ultimate_course_builds%ROWTYPE; successor uuid; item jsonb; rows_changed integer; profile_next jsonb; source_rows jsonb;
BEGIN
 PERFORM set_config('lock_timeout','5s',true);`);
for(const [old,course,occupation,count] of repairs){
 const lessons=registeredBeautyLessons(occupation);
 console.log(`
 SELECT * INTO STRICT old_build FROM public.ultimate_course_builds WHERE id='${old}' AND course_id='${course}' FOR UPDATE;
 IF old_build.status IN ('published','built','archived') THEN RAISE EXCEPTION 'BEAUTY_FINISHED_REVISION_REVIEW_REQUIRED:${occupation}'; END IF;
 PERFORM 1 FROM public.ultimate_build_jobs WHERE build_id=old_build.id FOR UPDATE;
 IF EXISTS (SELECT 1 FROM public.ultimate_build_jobs WHERE build_id=old_build.id AND (status='running' OR lease_expires_at>now())) THEN RAISE EXCEPTION 'BEAUTY_REPAIR_ACTIVE_LEASE:${occupation}'; END IF;
 IF jsonb_array_length(old_build.profile->'competencies')<>${count} THEN RAISE EXCEPTION 'BEAUTY_COMPETENCY_COUNT_CHANGED:${occupation}'; END IF;
 IF EXISTS(SELECT 1 FROM public.ultimate_course_builds WHERE course_id=old_build.course_id AND profile->'sourceMappingAudit'->>'version'='${BEAUTY_SOURCE_VERSION}') THEN RAISE EXCEPTION 'BEAUTY_SUCCESSOR_ALREADY_EXISTS:${occupation}'; END IF;
 source_rows:=${quote(lessons.map(l=>l.source))};
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(old_build.profile->'competencies') c WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(source_rows) s WHERE s->>'id'=c->>'id')) THEN RAISE EXCEPTION 'BEAUTY_SOURCE_MAPPING_INCOMPLETE:${occupation}'; END IF;
 -- Pause the old revision; do not mutate its frozen autopilot pool or historical errors.
 UPDATE public.ultimate_course_builds SET profile=profile||jsonb_build_object('ownerPaused',true,'sourceSuccessorRequestedAt',now()),updated_at=now() WHERE id=old_build.id;
 profile_next:=old_build.profile||jsonb_build_object('ownerPaused',false,'instructionalSources',source_rows,'sourceMappingAudit',jsonb_build_object('version','${BEAUTY_SOURCE_VERSION}','predecessorBuildId',old_build.id,'reason','Original per-competency teaching replaces unmatched generic source identifiers','createdAt',now()));
 profile_next:=jsonb_set(profile_next,'{competencies}',(SELECT jsonb_agg(c||jsonb_build_object('title',split_part(split_part(s->>'text',chr(10),1),'Lesson: ',2)) ORDER BY ord) FROM jsonb_array_elements(old_build.profile->'competencies') WITH ORDINALITY AS x(c,ord) JOIN jsonb_array_elements(source_rows) s ON s->>'id'=c->>'id'));
 profile_next:=jsonb_set(profile_next,'{sourceDocuments}',coalesce(profile_next->'sourceDocuments','[]'::jsonb)||'["lib/curriculum/registered-beauty/index.mjs"]'::jsonb);
 -- Preserve every standard requirement, presentation setting and published lesson.
 -- Seed only empty unpublished canonical rows; existing content causes an abort.
 FOR item IN SELECT jsonb_build_object('id',s->>'id','title',split_part(split_part(s->>'text',chr(10),1),'Lesson: ',2),'content',substring(s->>'text' from position('Authorized course content: ' in s->>'text')+length('Authorized course content: '))::jsonb) FROM jsonb_array_elements(source_rows) s LOOP
  IF EXISTS(SELECT 1 FROM public.course_lessons WHERE course_id=old_build.course_id AND content_json->>'competencyId'=item->>'id' AND (status='published' OR is_published OR content NOT IN ('""'::jsonb,'{}'::jsonb,'null'::jsonb))) THEN RAISE EXCEPTION 'BEAUTY_EXISTING_CONTENT_REVIEW_REQUIRED:%',item->>'id'; END IF;
  UPDATE public.course_lessons SET title=item->>'title',content=item->'content',updated_at=now()
   WHERE course_id=old_build.course_id AND content_json->>'competencyId'=item->>'id' AND status='draft' AND NOT coalesce(is_published,false) AND (content IS NULL OR content IN ('""'::jsonb,'{}'::jsonb,'null'::jsonb));
 END LOOP;
 INSERT INTO public.ultimate_course_builds(course_id,profile,status,current_step,findings) VALUES(old_build.course_id,profile_next,'initializing','standards_lock','[]'::jsonb) RETURNING id INTO successor;
 -- Existing queue RPC owns canonical enqueue semantics; no attempt budget is reset.
 PERFORM public.enqueue_ultimate_build_job(successor,jsonb_build_object('sourceRepairVersion','${BEAUTY_SOURCE_VERSION}'),${quote(defaultCourseMonitor())});
`);
}
console.log('END $repair$;');
