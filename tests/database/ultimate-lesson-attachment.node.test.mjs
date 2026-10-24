import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';

test('completed lesson attachment against isolated PostgreSQL',async t=>{
 let db;
 if(process.env.ATTACHMENT_TEST_PGLITE_MODULE){
  const {PGlite}=await import(process.env.ATTACHMENT_TEST_PGLITE_MODULE);db=new PGlite();
 }else{
  const address=new URL(process.env.ATTACHMENT_TEST_DATABASE_URL || 'invalid:');
  assert.ok(['postgres:','postgresql:'].includes(address.protocol));
  assert.ok(['127.0.0.1','localhost','[::1]'].includes(address.hostname));
  assert.equal(address.pathname,'/postgres');
  const {default:pg}=await import('pg');
  const admin=new pg.Client({connectionString:address.href});await admin.connect();
  try{await admin.query('create database elevate_attachment_regression');}finally{await admin.end();}
  address.pathname='/elevate_attachment_regression';
  db=new pg.Client({connectionString:address.href});await db.connect();
 }
 const exec=sql=>db.exec ? db.exec(sql) : db.query(sql);
 try{
  await exec(`
   do $$ begin create role anon; exception when duplicate_object then null; end $$;
   do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
   do $$ begin create role service_role; exception when duplicate_object then null; end $$;
   create schema auth;
   create function auth.role() returns text language sql as $$ select current_setting('request.jwt.claim.role',true) $$;
   create table ultimate_build_jobs(id uuid primary key,build_id uuid,status text,lease_owner text,execution_generation bigint,lease_expires_at timestamptz);
   create table ultimate_course_builds(id uuid primary key,course_id uuid,profile jsonb);
   create table ultimate_lesson_builds(id uuid primary key,build_id uuid,competency_id text,status text,artifacts jsonb);
   create table course_lessons(id uuid primary key,course_id uuid,status text,is_published boolean,approved boolean,
    video_url text,video_status text,video_error text,duration_seconds integer,script_text text,scene_data jsonb,
    content_json jsonb,updated_at timestamptz);
   set request.jwt.claim.role='service_role';
  `);
  await exec(await readFile(new URL('../../supabase/migrations/20261024202258_attach_completed_ultimate_lesson_media.sql',import.meta.url),'utf8'));
  const build=randomUUID(),course=randomUUID(),lesson=randomUUID(),canonical=randomUUID(),job=randomUUID();
  const artifacts={lesson_film_render:{render:{success:true,videoUrl:'https://media.example/saved.mp4',captionsUrl:'https://media.example/saved.vtt',transcriptUrl:'https://media.example/saved.txt',duration:372.2,sceneData:{scenes:[]}}},natural_narration:{narration:{segments:[{audioUrl:'https://media.example/voice.wav'}]}},finished_media_qa:{mediaQA:{pass:true}},narration_qa:{narrationQA:{pass:true}},instructor_script:{script:{script:'Preserved narration'}}};
  const profile={ownerPaused:false,canonicalLessonIds:{competency:canonical}};
  await db.query('insert into ultimate_course_builds values($1,$2,$3)',[build,course,profile]);
  await db.query("insert into ultimate_lesson_builds values($1,$2,'competency','built',$3)",[lesson,build,artifacts]);
  await db.query("insert into course_lessons(id,course_id,status,is_published,approved,content_json) values($1,$2,'draft',false,false,$3)",[canonical,course,{existingAssessment:{id:'keep'}}]);
  await db.query("insert into ultimate_build_jobs values($1,$2,'running','worker',3,now()+interval '1 hour')",[job,build]);
  const call=(overrides={})=>db.query('select ultimate_attach_lesson_media($1,$2,$3,$4,$5) result',[lesson,artifacts,job,'worker',3].map((v,i)=>Object.hasOwn(overrides,i)?overrides[i]:v));
  const snapshot=async()=> (await db.query('select * from course_lessons where id=$1',[canonical])).rows[0];
  await t.test('attaches film, captions, transcript and narration without publishing or dropping assessments',async()=>{
   const result=(await call()).rows[0].result;
   assert.equal(result.lessonId,canonical);assert.equal(result.sourceLessonBuildId,lesson);
   const row=await snapshot();
   assert.equal(row.video_url,`/api/courses/${course}/lessons/${canonical}/playback`);
   assert.equal(row.video_status,'complete');assert.equal(row.duration_seconds,373);
   assert.deepEqual(row.content_json.film,{videoUrl:artifacts.lesson_film_render.render.videoUrl,playbackUrl:row.video_url,captionsUrl:'https://media.example/saved.vtt',transcriptUrl:'https://media.example/saved.txt'});
   assert.deepEqual(row.content_json.savedNarration,artifacts.natural_narration.narration);
   assert.deepEqual(row.content_json.existingAssessment,{id:'keep'});
   assert.equal(row.status,'draft');assert.equal(row.is_published,false);assert.equal(row.approved,false);
  });
  await t.test('retry attaches the same object without changing lesson identity',async()=>{
   const before=await snapshot();await call();const after=await snapshot();
   assert.equal(after.id,before.id);assert.equal(after.video_url,before.video_url);
  });
  await t.test('readback detects trigger interference and rolls the attachment back',async()=>{
   const before=await snapshot();
   await exec(`create function break_attachment() returns trigger language plpgsql as $$ begin new.video_url=null; return new; end $$;
    create trigger break_attachment before update on course_lessons for each row execute function break_attachment();`);
   await assert.rejects(call(),/READBACK_FAILED/);
   assert.equal((await snapshot()).video_url,before.video_url);
   await exec('drop trigger break_attachment on course_lessons; drop function break_attachment();');
  });
  await t.test('stale generation, wrong worker, changed artifacts and expired lease fail closed',async()=>{
   for(const args of [{4:2},{3:'other'},{1:{...artifacts,changed:true}}])await assert.rejects(call(args));
   await db.query("update ultimate_build_jobs set lease_expires_at=now()-interval '1 minute' where id=$1",[job]);
   await assert.rejects(call(),/LEASE_LOST/);
   await db.query("update ultimate_build_jobs set lease_expires_at=now()+interval '1 hour' where id=$1",[job]);
  });
  await t.test('a wrong mapping cannot attach to another course',async()=>{
   await db.query('update ultimate_course_builds set profile=$1 where id=$2',[{...profile,canonicalLessonIds:{competency:randomUUID()}},build]);
   await assert.rejects(call(),/CANONICAL_LESSON_REQUIRED/);
   await db.query('update ultimate_course_builds set profile=$1 where id=$2',[profile,build]);
  });
  await t.test('published owner-approved media is never overwritten',async()=>{
   await db.query("update course_lessons set is_published=true,approved=true,status='published',video_url='/approved' where id=$1",[canonical]);
   assert.equal((await call()).rows[0].result.preservedPublished,true);
   assert.equal((await snapshot()).video_url,'/approved');
   await db.query("update course_lessons set is_published=false,approved=false,status='draft' where id=$1",[canonical]);
  });
  await t.test('pause blocks workers; recovery requires paused and idle build',async()=>{
   await assert.rejects(call({2:null,3:null,4:null}),/PAUSED_IDLE_BUILD/);
   await db.query('update ultimate_course_builds set profile=$1 where id=$2',[{...profile,ownerPaused:true},build]);
   await assert.rejects(call(),/OWNER_PAUSED/);
   await assert.rejects(call({2:null,3:null,4:null}),/PAUSED_IDLE_BUILD/);
   await db.query("update ultimate_build_jobs set status='failed' where id=$1",[job]);
   assert.equal((await call({2:null,3:null,4:null})).rows[0].result.publicationPending,true);
  });
  await t.test('failed media QA cannot be attached even in paused recovery',async()=>{
   const broken={...artifacts,finished_media_qa:{mediaQA:{pass:false}}};
   await db.query('update ultimate_lesson_builds set artifacts=$1 where id=$2',[broken,lesson]);
   await assert.rejects(call({1:broken,2:null,3:null,4:null}),/VERIFIED_MEDIA_REQUIRED/);
   await db.query('update ultimate_lesson_builds set artifacts=$1 where id=$2',[artifacts,lesson]);
  });
  await t.test('attachment RPC is inaccessible to public application roles',async()=>{
   const signature='public.ultimate_attach_lesson_media(uuid,jsonb,uuid,text,bigint)';
   for(const role of ['anon','authenticated']){
    const {rows}=await db.query('select has_function_privilege($1,$2,\'execute\') permitted',[role,signature]);
    assert.equal(rows[0].permitted,false);
   }
   await exec("set request.jwt.claim.role='anon'");
   await assert.rejects(call({2:null,3:null,4:null}),/SERVICE_ROLE_REQUIRED/);
  });
 }finally{if(db.end)await db.end();else await db.close();}
});
