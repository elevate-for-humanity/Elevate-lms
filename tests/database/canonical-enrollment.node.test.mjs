import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';

const migration = new URL('../../supabase/migrations/20261018221500_canonical_lms_course_entitlements.sql', import.meta.url);

test('canonical enrollment provisioning against isolated PostgreSQL', async t => {
  const address = new URL(process.env.ENROLLMENT_TEST_DATABASE_URL || 'invalid:');
  assert.ok(['postgres:', 'postgresql:'].includes(address.protocol));
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(address.hostname));
  assert.equal(address.pathname, '/elevate_enrollment_regression');
  const db = new pg.Client({ connectionString: address.href });
  await db.connect();
  try {
    await db.query(`
      do $$ begin
        create role anon;
        create role authenticated;
        create role service_role;
      end $$;
      create table courses (id uuid primary key, program_id uuid, slug text, status text, is_active boolean);
      create table training_courses (id uuid primary key, program_id uuid, slug text, status text, is_active boolean, is_published boolean);
      create table program_courses (program_id uuid, course_id uuid, is_required boolean, order_index integer, unique(program_id,course_id));
      create table program_enrollments (
        id uuid primary key default gen_random_uuid(), user_id uuid, program_id uuid,
        status text, enrollment_state text, funding_source text default 'pending',
        funding_verified boolean default false, amount_paid_cents integer default 0,
        eligibility_status text default 'pending'
      );
      create table course_enrollments (
        id uuid primary key default gen_random_uuid(), student_id uuid, course_id uuid,
        status text, progress text, created_at timestamptz, updated_at timestamptz,
        unique(student_id,course_id)
      );
      create view lms_courses as
        select id,program_id,slug,status,is_active from courses
        union all
        select tc.id,tc.program_id,tc.slug,
          case when tc.is_published is true then 'published' else coalesce(tc.status,'draft') end,
          coalesce(tc.is_active,tc.is_published,false)
        from training_courses tc where not exists (
          select 1 from courses c where c.id=tc.id or (c.slug is not null and c.slug=tc.slug)
        );
    `);
    for (const file of ['20260806200400_sync_active_program_enrollments_to_course_access.sql', '20260826123000_sync_program_course_enrollments_on_publication.sql']) {
      await db.query(await readFile(new URL('../../supabase/migrations/' + file, import.meta.url), 'utf8'));
    }
    const course = async (table, program, { published = true, active = true, slug = randomUUID() } = {}) => {
      const id = randomUUID();
      if (table === 'training_courses') {
        await db.query('insert into training_courses values($1,$2,$3,$4,$5,$6)', [id,program,slug,'draft',active,published]);
      } else {
        assert.equal(table, 'courses');
        await db.query('insert into courses values($1,$2,$3,$4,$5)', [id,program,slug,published?'published':'draft',active]);
      }
      return id;
    };
    const enroll = async (program, state = 'active') => {
      const user = randomUUID();
      await db.query('insert into program_enrollments(user_id,program_id,status,enrollment_state) values($1,$2,$3,$3)', [user,program,state]);
      return user;
    };
    const access = async (user, id) => (await db.query('select status,progress from course_enrollments where student_id=$1 and course_id=$2', [user,id])).rows;
    const program = randomUUID();
    const training = await course('training_courses', program);
    const user = await enroll(program);
    // Reproduce the actual production failure with both historical migrations.
    assert.equal((await access(user, training)).length, 0);
    const preserved = (await db.query('select funding_source,funding_verified,amount_paid_cents,eligibility_status from program_enrollments where user_id=$1', [user])).rows;
    const sql = await readFile(migration, 'utf8');
    await db.query(sql);

    await t.test('repairs saved active enrollment through the canonical training catalog', async () => {
      assert.deepEqual(await access(user, training), [{ status:'active', progress:'0' }]);
      assert.deepEqual((await db.query('select funding_source,funding_verified,amount_paid_cents,eligibility_status from program_enrollments where user_id=$1', [user])).rows, preserved);
    });
    await t.test('both sources work for new admission; draft and inactive courses do not', async () => {
      const p = randomUUID();
      const legacy = await course('courses', p);
      const current = await course('training_courses', p);
      const draft = await course('training_courses', p, { published:false });
      const inactive = await course('training_courses', p, { active:false });
      const learner = await enroll(p);
      assert.equal((await access(learner,legacy)).length,1);
      assert.equal((await access(learner,current)).length,1);
      assert.equal((await access(learner,draft)).length,0);
      assert.equal((await access(learner,inactive)).length,0);
      const pending = await enroll(p,'pending');
      assert.equal((await access(pending,current)).length,0);
      await db.query("update program_enrollments set enrollment_state='active',status='active' where user_id=$1", [pending]);
      assert.equal((await access(pending,current)).length,1);
    });
    await t.test('publication from either source provisions existing active learners', async () => {
      const p = randomUUID();
      const learner = await enroll(p);
      const current = await course('training_courses',p,{published:false});
      const legacy = await course('courses',p,{published:false});
      await db.query('update training_courses set is_published=true where id=$1',[current]);
      await db.query("update courses set status='published' where id=$1",[legacy]);
      assert.equal((await access(learner,current)).length,1);
      assert.equal((await access(learner,legacy)).length,1);
      assert.equal((await access(randomUUID(),current)).length,0);
    });
    await t.test('explicit shared mappings survive; shadowed training rows grant no access', async () => {
      const p = randomUUID();
      const shared = await course('courses',null);
      await db.query('insert into program_courses values($1,$2,true,0)',[p,shared]);
      const slug = randomUUID();
      await course('courses',randomUUID(),{slug});
      const hidden = await course('training_courses',p,{slug});
      const learner = await enroll(p);
      assert.equal((await access(learner,shared)).length,1);
      assert.equal((await access(learner,hidden)).length,0);
    });
    await t.test('replayed admission, publication and migration preserve progress and revocation', async () => {
      await db.query("update course_enrollments set status='revoked',progress='74' where student_id=$1 and course_id=$2",[user,training]);
      await db.query('update program_enrollments set status=status where user_id=$1',[user]);
      await db.query('update training_courses set is_published=is_published where id=$1',[training]);
      await db.query(sql);
      assert.deepEqual(await access(user,training),[{status:'revoked',progress:'74'}]);
    });
    await t.test('synchronization stays unavailable as a public API', async () => {
      for (const name of ['sync_active_program_enrollment_courses','sync_published_course_program_enrollments']) {
        const {rows} = await db.query("select has_function_privilege('anon',$1,'execute') as anon,has_function_privilege('authenticated',$1,'execute') as authenticated,has_function_privilege('service_role',$1,'execute') as service",['public.'+name+'()']);
        assert.deepEqual(rows,[{anon:false,authenticated:false,service:true}]);
      }
    });
  } finally {
    await db.end();
  }
});
