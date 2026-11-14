-- Run only after the ICBP film production has completed. Fail closed while any
-- instructional film, verified publication, or original final is missing.
-- Does not reopen the public program or move an existing learner's records.
begin;
set local lock_timeout='5s';
do $$
declare c public.courses%rowtype; b public.ultimate_course_builds%rowtype; f public.course_lessons%rowtype; expected integer;
begin
 select * into strict c from public.courses where slug='intuit-bookkeeping-professional' for update;
 if c.metadata->>'sourceVersion'<>'icbp-elevate-rebuild-2026-10-31-v1' then raise exception 'Unexpected replacement version'; end if;
 select * into strict b from public.ultimate_course_builds where course_id=c.id and profile->>'sourcePolicy'='frozen-reference-v1';
 expected:=jsonb_array_length(b.profile->'competencies');
 if expected<>17 or b.status<>'published' then raise exception 'Instructional production is not fully released'; end if;
 if (select count(*) from jsonb_each_text(b.profile->'canonicalLessonIds') mapping join public.course_lessons l on l.id=mapping.value::uuid and l.course_id=c.id where l.status='published' and l.is_published and l.video_status='complete' and l.media_quality_status='approved' and l.video_url is not null and l.content_json->>'contractVersion' is not null and l.content_json->>'buildId'=b.id::text)<>expected then raise exception 'Verified instructional publication is incomplete'; end if;
 select * into strict f from public.course_lessons where id=(c.metadata->>'finalAssessmentLessonId')::uuid and course_id=c.id and slug='icbp-cumulative-final' for update;
 if f.lesson_type not in ('quiz','exam') or jsonb_array_length(f.quiz_questions)<>25 or f.order_index<>18 or f.passing_score<>80 then raise exception 'Original cumulative final is invalid'; end if;
 if exists(select 1 from jsonb_array_elements(f.quiz_questions) q where jsonb_typeof(q->'options')<>'array' or jsonb_array_length(q->'options')<>4 or (q->>'correctAnswer')::integer not between 0 and 3 or coalesce(q->>'explanation','')='') then raise exception 'Final question validation failed'; end if;
 update public.course_lessons set status='published',is_published=true,generation_status='completed',published_at=coalesce(published_at,now()),published_by=c.created_by,updated_at=now() where id=f.id;
 update public.course_modules set is_published=true,is_draft=false,updated_at=now() where id=f.module_id and course_id=c.id;
 update public.courses set total_lessons=18,metadata=metadata||jsonb_build_object('cumulativeFinalPublishedAt',now(),'publicReopeningPending',true),updated_at=now() where id=c.id;
end $$;
commit;
