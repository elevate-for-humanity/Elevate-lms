// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { simulationFixture } from '../fixtures/manufacturing-simulation';

const course = '11111111-1111-4111-8111-111111111111';
const copyCourse = '22222222-2222-4222-8222-222222222222';
const lesson = '33333333-3333-4333-8333-333333333333';
const legacy = '44444444-4444-4444-8444-444444444444';
const ordinary = '55555555-5555-4555-8555-555555555555';
const learner = '66666666-6666-4666-8666-666666666666';
const version = '77777777-7777-4777-8777-777777777777';
let db: PGlite;
let initialKey: string;
let snapshotLesson: any;
let migration: string;
let replayMigration: string;
const authored = () => ({ kept: 'unrelated lesson content', experience: { manufacturingSimulation: simulationFixture } });
const problem = (row: any) => row.content_json?.experience?.manufacturingSimulation;
async function row(id: string) { return (await db.query<any>('select * from course_lessons where id=$1', [id])).rows[0]; }
async function asRole(role: 'anon' | 'authenticated' | 'service_role', action: () => Promise<unknown>) {
  await db.exec(`set role ${role}`);
  try { return await action(); } finally { await db.exec('reset role'); }
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth;
    create table auth.users(id uuid primary key);
    create table public.courses(id uuid primary key);
    create table public.course_lessons(id uuid primary key default gen_random_uuid(), course_id uuid,
      content_json jsonb, content jsonb, status text default 'draft', is_published boolean default false);
    create table public.course_versions(id uuid primary key, course_id uuid, snapshot jsonb);
    create table public.interaction_progress(learner_id uuid, lesson_id uuid, answers jsonb, completed boolean);
    grant usage on schema public, auth to anon, authenticated, service_role;
    grant select, insert, update on course_lessons,course_versions to authenticated;
    grant all on courses,course_lessons,course_versions,interaction_progress to service_role;
  `);
  await db.query('insert into courses values($1),($2)', [course, copyCourse]);
  await db.query('insert into auth.users values($1)', [learner]);
  await db.query('insert into course_lessons(id,course_id,content_json,content) values($1,$2,$3,null),($4,$2,null,$5),($6,$2,null,$7)',
    [lesson, course, JSON.stringify(authored()), legacy, JSON.stringify(JSON.stringify(authored())), ordinary, JSON.stringify('<p>Ordinary HTML stays unchanged.</p>')]);
  await db.query('insert into course_versions values($1,$2,$3)', [version, course, JSON.stringify({
    course: { id: course }, modules: [], lessons: [{ id: lesson, course_id: course, content_json: authored(), content: null }],
  })]);
  await db.query('insert into interaction_progress values($1,$2,$3,true)', [learner, lesson, JSON.stringify({ forged: true })]);
  migration = await readFile(new URL('../../supabase/migrations/20261124165505_protect_manufacturing_simulation_keys.sql', import.meta.url), 'utf8');
  // Both versions were recorded by the provider when an interrupted tool wait
  // hid the first completion. Preserve the ledger rather than rewriting it.
  replayMigration = await readFile(new URL('../../supabase/migrations/20261124165523_protect_manufacturing_simulation_keys.sql', import.meta.url), 'utf8');
  await db.exec(migration);
  initialKey = problem(await row(lesson)).gradingKeyId;
  snapshotLesson = (await db.query<any>('select snapshot from course_versions where id=$1', [version])).rows[0].snapshot.lessons[0];
}, 30000);
afterAll(async () => { await db?.close(); });

describe('protected manufacturing grading in PostgreSQL', () => {
  it('extracts object, serialized content and public snapshot keys without touching unrelated content', async () => {
    const current = await row(lesson);
    expect(current.content_json.kept).toBe('unrelated lesson content');
    expect(current.content).toBeNull();
    expect(problem(current).gradingKeyId).toMatch(/^[a-f0-9-]{36}$/);
    expect(problem(current).tasks[0]).not.toHaveProperty('expected');
    expect(problem(current).tasks[0]).not.toHaveProperty('rationale');
    const old = await row(legacy);
    expect(old.content.kept).toBe('unrelated lesson content');
    expect(old.content.experience.manufacturingSimulation.tasks[0]).not.toHaveProperty('expected');
    expect(snapshotLesson.content_json.experience.manufacturingSimulation.tasks[0]).not.toHaveProperty('expected');
    expect((await row(ordinary)).content).toBe('<p>Ordinary HTML stays unchanged.</p>');
    expect((await row(ordinary)).content_json).toBeNull();
    expect((await db.query<any>('select * from interaction_progress')).rows).toHaveLength(1);
    expect((await db.query<any>('select * from manufacturing_simulation_progress')).rows).toHaveLength(0);
    expect(current.status).toBe('draft');
    expect(current.is_published).toBe(false);
  });

  it('denies learner/anonymous reads and writes to keys and accepted attempts, including direct SQL', async () => {
    for (const role of ['anon', 'authenticated'] as const) {
      for (const table of ['manufacturing_simulation_specs', 'manufacturing_simulation_progress']) {
        for (const privilege of ['select', 'insert', 'update', 'delete']) {
          const result = await db.query<any>('select has_table_privilege($1,$2,$3) as allowed', [role, table, privilege]);
          expect(result.rows[0].allowed).toBe(false);
        }
        await asRole(role, async () => {
          await expect(db.query(`select * from ${table}`)).rejects.toThrow(/permission denied/);
          await expect(db.query(`delete from ${table}`)).rejects.toThrow(/permission denied/);
        });
      }
      const result = await db.query<any>("select has_function_privilege($1,'rpc_private.store_manufacturing_simulation_spec(jsonb,uuid,uuid)','execute') as allowed", [role]);
      expect(result.rows[0].allowed).toBe(false);
    }
    await asRole('authenticated', async () => {
      const selected = (await db.query<any>('select content_json from course_lessons where id=$1', [lesson])).rows[0];
      expect(selected.content_json.experience.manufacturingSimulation.tasks[0]).not.toHaveProperty('expected');
    });
  });

  it('allows server records bound to a key while keeping grading versions immutable', async () => {
    await asRole('service_role', async () => {
      const privateSpec = (await db.query<any>('select spec from manufacturing_simulation_specs where id=$1', [initialKey])).rows[0].spec;
      expect(privateSpec).toEqual(simulationFixture);
      await expect(db.query('update manufacturing_simulation_specs set spec=spec where id=$1', [initialKey])).rejects.toThrow(/permission denied/);
      await db.query(`insert into manufacturing_simulation_progress
        (learner_id,course_id,lesson_id,spec_id,lesson_slug,interaction_id,answers,score,completed,attempts,feedback)
        values($1,$2,$3,$4,'inspection','inspection-manufacturing',$5,0,false,1,'{}')`,
      [learner, course, lesson, initialKey, JSON.stringify({ practice: 0 })]);
    });
    expect((await db.query<any>('select spec_id from manufacturing_simulation_progress')).rows[0].spec_id).toBe(initialKey);
  });

  it('preserves accepted attempts, keys, public content and existing records when provisioning is replayed', async () => {
    async function snapshot() {
      const state: Record<string, unknown> = {};
      for (const table of ['courses', 'course_lessons', 'course_versions', 'interaction_progress',
        'manufacturing_simulation_specs', 'manufacturing_simulation_progress']) {
        state[table] = (await db.query(`select * from ${table} order by 1`)).rows;
      }
      return state;
    }
    const before = await snapshot();
    expect((before.manufacturing_simulation_progress as unknown[])).toHaveLength(1);
    expect(replayMigration).toBe(migration);
    await db.exec(replayMigration);
    expect(await snapshot()).toEqual(before);
  });

  it('preserves authenticated non-manufacturing authoring without granting private helper access', async () => {
    const id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const plain = { text: 'manufacturingSimulation is an ordinary mention', experience: { quiz: [] } };
    const snapshot = { lessons: [
      { id, content_json: plain, content: JSON.stringify(plain) },
      { id: ordinary, content: '<p>Ordinary HTML stays unchanged.</p>' },
      { content_json: { experience: { manufacturingSimulation: null } } },
    ] };
    const count = (await db.query<any>('select count(*)::int as n from manufacturing_simulation_specs')).rows[0].n;
    await asRole('authenticated', async () => {
      await db.query('insert into course_lessons(id,course_id,content_json,content) values($1,$2,$3,$4)',
        [id, course, JSON.stringify(plain), JSON.stringify(JSON.stringify(plain))]);
      await db.query('update course_lessons set content_json=$1 where id=$2', [JSON.stringify({ ...plain, revised: true }), id]);
      await db.query('insert into course_versions values($1,$2,$3)', [id, course, JSON.stringify(snapshot)]);
      await db.query('update course_versions set snapshot=snapshot where id=$1', [id]);
      await expect(db.query('update course_lessons set content_json=$1 where id=$2',
        [JSON.stringify(authored()), id])).rejects.toThrow(/permission denied/);
    });
    expect((await row(id)).content_json).toEqual({ ...plain, revised: true });
    expect((await row(id)).content).toBe(JSON.stringify(plain));
    expect((await db.query<any>('select snapshot from course_versions where id=$1', [id])).rows[0].snapshot).toEqual(snapshot);
    expect((await db.query<any>('select count(*)::int as n from manufacturing_simulation_specs')).rows[0].n).toBe(count);
  });

  it('preserves JSON-null mirrors and atomically rejects malformed secondary mirrors', async () => {
    const id = '88888888-8888-4888-8888-888888888888';
    await db.query('insert into course_lessons(id,course_id,content_json,content) values($1,$2,$3,$4)', [id, course,
      JSON.stringify({ kept: 'null mirror retained', experience: { manufacturingSimulation: null } }), JSON.stringify(authored())]);
    expect((await row(id)).content_json).toEqual({ kept: 'null mirror retained', experience: { manufacturingSimulation: null } });
    const count = (await db.query<any>('select count(*)::int as n from manufacturing_simulation_specs')).rows[0].n;
    await expect(db.query('insert into course_lessons(id,course_id,content_json,content) values($1,$2,$3,$4)', [
      '99999999-9999-4999-8999-999999999999', course, JSON.stringify(authored()),
      JSON.stringify({ kept: 'must not disappear', experience: { manufacturingSimulation: { tasks: [] } } }),
    ])).rejects.toThrow(/MANUFACTURING_SPEC_INVALID/);
    expect((await db.query<any>('select count(*)::int as n from manufacturing_simulation_specs')).rows[0].n).toBe(count);
  });

  it('retains immutable versions and restores an old public snapshot after lesson deletion', async () => {
    const changed = structuredClone(simulationFixture);
    changed.brief += ' Revised authored scenario.';
    await db.query('update course_lessons set content_json=$1 where id=$2', [JSON.stringify({ experience: { manufacturingSimulation: changed } }), lesson]);
    const revisedKey = problem(await row(lesson)).gradingKeyId;
    expect(revisedKey).not.toBe(initialKey);
    expect((await db.query<any>('select spec from manufacturing_simulation_specs where id=$1', [initialKey])).rows[0].spec).toEqual(simulationFixture);
    await db.query('delete from course_lessons where id=$1', [lesson]);
    await db.query('insert into course_lessons(id,course_id,content_json,content) values($1,$2,$3,$4)', [lesson, course,
      JSON.stringify(snapshotLesson.content_json), JSON.stringify(snapshotLesson.content)]);
    expect(problem(await row(lesson)).gradingKeyId).toBe(snapshotLesson.content_json.experience.manufacturingSimulation.gradingKeyId);
    expect((await db.query<any>('select count(*)::int as n from manufacturing_simulation_specs where id=$1', [revisedKey])).rows[0].n).toBe(1);
  });

  it('rebinds public copied lessons to a new course without copying student progress', async () => {
    const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    await asRole('service_role', async () => {
      await db.query('insert into course_lessons(id,course_id,content_json) values($1,$2,$3)', [id, copyCourse, JSON.stringify(snapshotLesson.content_json)]);
    });
    const copied = problem(await row(id));
    expect(copied.gradingKeyId).not.toBe(snapshotLesson.content_json.experience.manufacturingSimulation.gradingKeyId);
    const bound = (await db.query<any>('select lesson_id,course_id,spec from manufacturing_simulation_specs where id=$1', [copied.gradingKeyId])).rows[0];
    expect(bound.lesson_id).toBe(id);
    expect(bound.course_id).toBe(copyCourse);
    expect(bound.spec).toEqual(simulationFixture);
    expect((await db.query<any>('select * from manufacturing_simulation_progress where lesson_id=$1', [id])).rows).toHaveLength(0);
  });

  it('rejects missing or forged references and protects newly inserted snapshots', async () => {
    const id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const broken = structuredClone(problem(await row(lesson)));
    delete broken.gradingKeyId;
    await expect(db.query('insert into course_lessons(id,course_id,content_json) values($1,$2,$3)', [id, course,
      JSON.stringify({ experience: { manufacturingSimulation: broken } })])).rejects.toThrow(/MANUFACTURING_ANSWER_KEY_REQUIRED/);
    broken.gradingKeyId = initialKey;
    broken.brief += ' Tampered public problem.';
    await expect(db.query('insert into course_lessons(id,course_id,content_json) values($1,$2,$3)', [id, course,
      JSON.stringify({ experience: { manufacturingSimulation: broken } })])).rejects.toThrow(/MANUFACTURING_ANSWER_KEY_MISMATCH/);
    await db.query('insert into course_versions values($1,$2,$3)', [id, course, JSON.stringify({ lessons: [
      { id: lesson, content: JSON.stringify(authored()) },
    ] })]);
    const snapshot = (await db.query<any>('select snapshot from course_versions where id=$1', [id])).rows[0].snapshot;
    expect(snapshot.lessons[0].content.experience.manufacturingSimulation.tasks[0]).not.toHaveProperty('expected');
  });
});
