// Reviewable, one-time DML preparation. No database credentials or live writes.
// Invoke with a verified administrator UUID; apply the emitted transaction via
// the database connector only after checking that no replacement already exists.
import {prepareRebuild} from './prepare-bookkeeping-rebuild.mjs';
const ownerId=process.argv[2];
if(!/^[a-f0-9-]{36}$/i.test(ownerId??'')) throw new Error('Verified administrator UUID required');
const r=prepareRebuild({ownerId,originalIntroduction:{id:'544f9204-40f6-4f32-b42b-aa108f1c27b6'}});
const literal=v=>"'"+JSON.stringify(v).replaceAll("'","''")+"'::jsonb";
const insert=(table,rows)=>{const keys=[...new Set(rows.flatMap(row=>Object.keys(row)))];return `insert into public.${table} (${keys.join(',')}) select ${keys.join(',')} from jsonb_populate_recordset(null::public.${table},${literal(rows)});`;};
console.log(`begin;
set local lock_timeout='5s';
do $$ begin
 if exists(select 1 from public.courses where slug='intuit-bookkeeping-professional') then raise exception 'Replacement already exists; inspect and resume it'; end if;
 if not exists(select 1 from public.profiles where id='${ownerId}' and role in ('admin','super_admin')) then raise exception 'Verified administrator required'; end if;
end $$;
${insert('courses',[r.course])}
${insert('course_modules',r.modules)}
${insert('course_lessons',r.lessons)}
update public.course_lessons set content_json=content_json || jsonb_build_object('originalIntroductionReference',(select jsonb_build_object('id',id,'title',title,'content',content,'content_json',content_json) from public.course_lessons where id='544f9204-40f6-4f32-b42b-aa108f1c27b6')) where id='${r.lessons[0].id}';
${insert('ultimate_course_builds',[r.build])}
select id,build_id,status from public.enqueue_ultimate_build_job('${r.build.id}',${literal(r.queue)},${literal(r.monitor)});
commit;
select jsonb_build_object('courseId','${r.course.id}','buildId','${r.build.id}','lessons',(select count(*) from public.course_lessons where course_id='${r.course.id}'),'modules',(select count(*) from public.course_modules where course_id='${r.course.id}'),'status',(select status from public.courses where id='${r.course.id}')) as replacement;`);
