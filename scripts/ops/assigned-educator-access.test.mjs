import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const teacher = '00000000-0000-4000-8000-000000000001';
const learner = '00000000-0000-4000-8000-000000000002';
const course = '00000000-0000-4000-8000-000000000003';
const lesson = '00000000-0000-4000-8000-000000000004';
const initial = readFileSync('supabase/migrations/20261118212718_assigned_educator_materials_read_and_holder_course_mapping.sql', 'utf8');
const followup = readFileSync('supabase/migrations/20261118220143_assigned_educator_server_reads_and_pacing.sql', 'utf8');
async function fixture(existingPolicy) {
  const db = new PGlite();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth; CREATE SCHEMA rpc_private;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claims',true)::jsonb->>'sub','')::uuid $$;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$ SELECT current_setting('request.jwt.claims',true)::jsonb->>'role' $$;
    CREATE TABLE profiles(id uuid,role text,is_active boolean,suspended boolean);
    CREATE TABLE courses(id uuid,program_id uuid,status text,is_active boolean);
    CREATE TABLE training_courses(id uuid,program_id uuid,credential_id uuid);
    CREATE TABLE instructor_assignments(instructor_id uuid,course_id uuid,active boolean);
    CREATE TABLE course_enrollments(student_id uuid,course_id uuid,status text);
    CREATE TABLE program_enrollments(user_id uuid,student_id uuid,program_id uuid,revoked_at timestamptz,status text);
    CREATE TABLE course_lessons(id uuid,course_id uuid,module_id uuid,title text,order_index int,lesson_type text,duration_minutes int,is_published boolean,status text);
    CREATE TABLE course_pacing_plans(course_id uuid,enabled boolean,total_weeks int,release_published_lessons boolean);
    CREATE TABLE course_lesson_release_weeks(course_id uuid,lesson_id uuid,release_week int);
    CREATE TABLE course_learner_release_weeks(course_id uuid,lesson_id uuid,user_id uuid,total_weeks int,release_week int);
    CREATE FUNCTION rpc_private.can_access_lesson(uuid,uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
    CREATE FUNCTION rpc_private.paced_lesson_access(uuid,uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
    CREATE FUNCTION rpc_private.course_pacing_start(uuid,uuid) RETURNS timestamptz LANGUAGE sql AS $$ SELECT null::timestamptz $$;
    CREATE FUNCTION rpc_private.theory_access_status(uuid,uuid,timestamptz) RETURNS jsonb LANGUAGE sql AS $$ SELECT '{"allowed":false}'::jsonb $$;
    CREATE POLICY paced_lesson_select ON course_lessons AS RESTRICTIVE FOR SELECT USING(false);
    ${existingPolicy ? 'CREATE POLICY holder_lesson_enrollment_required ON course_lessons AS RESTRICTIVE FOR SELECT USING(false);' : ''}
    INSERT INTO profiles VALUES ('${teacher}','program_holder',true,false),('${learner}','student',true,false);
    INSERT INTO courses VALUES ('${course}',null,'published',true);
    INSERT INTO instructor_assignments VALUES ('${teacher}','${course}',true);
    INSERT INTO course_lessons VALUES ('${lesson}','${course}',null,'Future published lesson',1,'lesson',5,true,'published');
    INSERT INTO course_pacing_plans VALUES ('${course}',true,8,true);
    INSERT INTO course_lesson_release_weeks VALUES ('${course}','${lesson}',8);
  `);
  await db.exec(initial);
  await db.exec(followup);
  return db;
}
async function claims(db, sub, role = 'authenticated') {
  await db.query(`SELECT set_config('request.jwt.claims',$1,false)`, [JSON.stringify({ sub, role })]);
}
for (const existing of [false,true]) test(`assignment access with ${existing ? 'existing' : 'untracked'} restrictive policy`, async () => {
  const db = await fixture(existing);
  try {
    await claims(db, teacher);
    assert.equal((await db.query('SELECT public.can_access_lesson($1,$2) allowed',[teacher,lesson])).rows[0].allowed,true);
    const pacing = (await db.query('SELECT public.get_my_course_pacing($1) p',[course])).rows[0].p;
    assert.equal(pacing.educatorPreview,true);
    assert.equal(pacing.lessons[0].available,true);
    assert.equal(pacing.theoryWindow.enforced,false);
    await claims(db, undefined,'service_role');
    assert.equal((await db.query('SELECT public.can_access_lesson($1,$2) allowed',[teacher,lesson])).rows[0].allowed,true);
    await claims(db, learner);
    assert.equal((await db.query('SELECT public.can_access_lesson($1,$2) allowed',[teacher,lesson])).rows[0].allowed,false);
    assert.equal((await db.query('SELECT public.can_access_lesson($1,$2) allowed',[learner,lesson])).rows[0].allowed,false);
    await claims(db, teacher);
    await db.exec('UPDATE instructor_assignments SET active=false');
    assert.equal((await db.query('SELECT public.can_access_lesson($1,$2) allowed',[teacher,lesson])).rows[0].allowed,false);
    await db.exec('UPDATE instructor_assignments SET active=true; UPDATE course_lessons SET is_published=false');
    assert.equal((await db.query('SELECT public.can_access_lesson($1,$2) allowed',[teacher,lesson])).rows[0].allowed,false);
    const policy = (await db.query("SELECT polpermissive FROM pg_policy WHERE polname='holder_lesson_enrollment_required'")).rows[0];
    assert.equal(policy.polpermissive,false);
  } finally { await db.close(); }
});
