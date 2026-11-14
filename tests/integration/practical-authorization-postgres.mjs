import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { PGlite } = await import(process.env.ELEVATE_PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const learner = '11111111-1111-4111-8111-111111111111',
  instructor = '22222222-2222-4222-8222-222222222222',
  other = '33333333-3333-4333-8333-333333333333';
const course = '44444444-4444-4444-8444-444444444444',
  lesson = '55555555-5555-4555-8555-555555555555';
const submission = '66666666-6666-4666-8666-666666666666';
let checks = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  checks++;
};
async function actor(id) {
  await db.exec('reset role');
  await db.query("select set_config('test.user',$1,false)", [id]);
  await db.exec('set role authenticated');
}
async function owner(sql) {
  await db.exec('reset role');
  await db.exec(sql);
}
async function denied(sql) {
  await assert.rejects(db.exec(sql));
  checks++;
}
const insert = `insert into course_practical_submissions(id,learner_id,course_id,lesson_id,interaction_id,competency_keys,evidence,learner_attestation,status) values ('${submission}','${learner}','${course}','${lesson}','practice',ARRAY['safe-work'],'[{"url":"evidence"}]',true,'submitted')`;
try {
  await db.exec(`create role authenticated; create role anon; create schema auth;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.user',true),'')::uuid$$;
grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
create table profiles(id uuid primary key, role text, is_active boolean default true, suspended boolean default false);
create table instructor_assignments(instructor_id uuid,course_id uuid,active boolean);
create table courses(id uuid primary key,status text,is_active boolean);
create table course_lessons(id uuid primary key,course_id uuid,is_published boolean,practical_required boolean);
create table program_enrollments(user_id uuid, student_id uuid,course_id uuid,status text,enrollment_state text,access_granted_at timestamptz,revoked_at timestamptz,suspended_at timestamptz,cancelled_at timestamptz);
create table access_gate(allowed boolean); insert into access_gate values(true);
create function can_access_lesson(uuid,uuid) returns boolean language sql as $$select allowed from access_gate$$;
create table course_practical_submissions(id uuid primary key, learner_id uuid,course_id uuid,lesson_id uuid,interaction_id text,competency_keys text[],evidence jsonb,learner_attestation boolean,status text,submitted_at timestamptz default now(),updated_at timestamptz default now());
create table course_practical_reviews(id uuid,submission_id uuid,reviewer_id uuid,decision text);
create table learning_action_events(id uuid,learner_id uuid,course_id uuid,lesson_id uuid,action text,source_type text,source_id uuid,payload jsonb);
insert into profiles(id,role) values('${learner}','student'),('${instructor}','instructor'),('${other}','instructor');
insert into instructor_assignments values('${instructor}','${course}',true);
insert into courses values('${course}','published',true);insert into course_lessons values('${lesson}','${course}',true,true);
insert into program_enrollments(user_id,course_id,status,access_granted_at) values('${learner}','${course}','active',now());
alter table instructor_assignments enable row level security;
create policy instructor_own on instructor_assignments for select to authenticated using(instructor_id=auth.uid());
alter table course_practical_submissions enable row level security; alter table course_practical_reviews enable row level security; alter table learning_action_events enable row level security;
create policy "learners read own practical submissions" on course_practical_submissions for select to authenticated using(learner_id=auth.uid());
create policy "authorized reviewers read practical submissions" on course_practical_submissions for select to authenticated using(exists(select 1 from profiles where id=auth.uid() and role='instructor'));
create policy "learners create own practical submissions" on course_practical_submissions for insert to authenticated with check(learner_id=auth.uid() and status='submitted');
create policy "learners resubmit own practical submissions" on course_practical_submissions for update to authenticated using(learner_id=auth.uid()) with check(learner_id=auth.uid());
create policy "authorized reviewers create reviews" on course_practical_reviews for insert to authenticated with check(reviewer_id=auth.uid());
create policy "participants read practical reviews" on course_practical_reviews for select to authenticated using(reviewer_id=auth.uid() or exists(select 1 from course_practical_submissions s where s.id=submission_id and s.learner_id=auth.uid()));
create policy "learners read own learning actions" on learning_action_events for select to authenticated using(learner_id=auth.uid());
grant select on profiles,courses,course_lessons,program_enrollments,access_gate to authenticated;
`);
  await db.exec(
    await readFile(
      new URL('../../scripts/manual/harden-practical-authorization.sql', import.meta.url),
      'utf8',
    ),
  );
  await actor(learner);
  await db.exec(insert);
  checks++;
  equal((await db.query('select count(*)::int n from course_practical_submissions')).rows[0].n, 1);
  await actor(other);
  equal((await db.query('select count(*)::int n from course_practical_submissions')).rows[0].n, 0);
  await actor(instructor);
  equal((await db.query('select count(*)::int n from course_practical_submissions')).rows[0].n, 1);
  await denied(
    `insert into course_practical_reviews values(gen_random_uuid(),'${submission}','${instructor}','approved')`,
  );
  await owner('grant insert on course_practical_reviews to authenticated');
  await actor(other);
  await denied(
    `insert into course_practical_reviews values(gen_random_uuid(),'${submission}','${other}','approved')`,
  );
  await actor(instructor);
  await db.exec(
    `insert into course_practical_reviews values(gen_random_uuid(),'${submission}','${instructor}','approved')`,
  );
  checks++;
  await owner('revoke insert on course_practical_reviews from authenticated');
  await actor(learner);
  await denied(
    `update course_practical_submissions set interaction_id='different' where id='${submission}'`,
  );
  await denied(
    `update course_practical_submissions set status='approved' where id='${submission}'`,
  );
  await db.exec(
    `update course_practical_submissions set submitted_at='2000-01-01' where id='${submission}'`,
  );
  equal(
    (
      await db.query(
        "select submitted_at > '2026-01-01'::timestamptz as stamped from course_practical_submissions",
      )
    ).rows[0].stamped,
    true,
  );
  const event = `insert into learning_action_events values(gen_random_uuid(),'${learner}','${course}','${lesson}','request_expert_review','practical_submission','${submission}','{"competencyKeys":["safe-work"]}')`;
  await db.exec(event);
  checks++;
  await denied(event.replace('request_expert_review', 'unlock_next'));
  await denied(event.replace('["safe-work"]', '["wrong-key"]'));
  await owner(`delete from course_practical_submissions`);
  for (const [change, undo] of [
    ['access_granted_at=null', 'access_granted_at=now()'],
    ['revoked_at=now()', 'revoked_at=null'],
    ['suspended_at=now()', 'suspended_at=null'],
    ['cancelled_at=now()', 'cancelled_at=null'],
    ["enrollment_state='suspended'", 'enrollment_state=null'],
    ["status='withdrawn'", "status='active'"],
  ]) {
    await owner(`update program_enrollments set ${change}`);
    await actor(learner);
    await denied(insert);
    await owner(`update program_enrollments set ${undo}`);
  }
  for (const [table, change, undo] of [
    ['profiles', `suspended=true where id='${learner}'`, `suspended=false where id='${learner}'`],
    ['profiles', `is_active=false where id='${learner}'`, `is_active=true where id='${learner}'`],
    ['courses', 'is_active=false', 'is_active=true'],
    ['course_lessons', 'is_published=false', 'is_published=true'],
    ['access_gate', 'allowed=false', 'allowed=true'],
  ]) {
    await owner(`update ${table} set ${change}`);
    await actor(learner);
    await denied(insert);
    await owner(`update ${table} set ${undo}`);
  }
  await actor(learner);
  await db.exec(insert);
  checks++;
  await owner(`update profiles set suspended=true where id='${learner}'`);
  await actor(learner);
  equal((await db.query('select count(*)::int n from course_practical_submissions')).rows[0].n, 0);
  equal((await db.query('select count(*)::int n from learning_action_events')).rows[0].n, 0);
  console.log(`Practical authorization PostgreSQL: ${checks} checks passed; production unchanged.`);
} finally {
  await db.close();
}
