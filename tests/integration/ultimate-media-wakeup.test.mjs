import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

// Optional isolated PostgreSQL engine, installed outside production dependencies.
// PGLITE_MODULE=/tmp/studio-queue-sql-tools/node_modules/@electric-sql/pglite/dist/index.js node --test tests/integration/ultimate-media-wakeup.test.mjs
const engine = process.env.PGLITE_MODULE;
test('real PostgreSQL migration retains media arrivals through stale worker transitions', { skip: !engine }, async () => {
  const { PGlite } = await import(engine);
  const db = new PGlite();
  const build = '00000000-0000-4000-8000-000000000001';
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE TABLE public.ultimate_course_builds(id uuid PRIMARY KEY,status text,current_step text,updated_at timestamptz);
      INSERT INTO public.ultimate_course_builds(id,status) VALUES('${build}','running');`);
    await db.exec(await fs.readFile(new URL('../../supabase/migrations/20260926124500_ultimate_durable_worker.sql', import.meta.url), 'utf8'));
    const migration = await fs.readFile(new URL('../../supabase/migrations/20261004150000_ultimate_media_dependency_wakeup.sql', import.meta.url), 'utf8');
    await db.exec(migration);
    await db.exec(migration); // Forward migration remains replay-safe.
    assert.equal((await db.query('SELECT ultimate_media_wakeup_ready() AS ready')).rows[0].ready, true);
    const wake = (lesson, asset) => db.query('SELECT * FROM wake_ultimate_media_dependency($1,$2::jsonb)', [build, JSON.stringify({ lessonIds: [lesson], assetIds: [asset] })]);
    for (const outcome of ['queued', 'failed', 'completed']) {
      await db.exec(`DELETE FROM ultimate_build_jobs; UPDATE ultimate_course_builds SET status='running';`);
      const { rows: [job] } = await db.query(`INSERT INTO ultimate_build_jobs(build_id,status,lease_owner,attempts,payload) VALUES($1,'running','worker',4,'{"nextCompetencyIndex":35,"unresolvedCompetencyIds":["lesson-a"]}') RETURNING *`, [build]);
      await wake('lesson-a', 'asset-a');
      await wake('lesson-b', 'asset-b');
      await wake('lesson-a', 'asset-a');
      // Simulate stale claimed payload written at any terminal/yield boundary.
      await db.query(`UPDATE ultimate_build_jobs SET status=$2,payload=$3::jsonb,last_error='missing',lease_owner=NULL WHERE id=$1`, [job.id, outcome, JSON.stringify(job.payload)]);
      const { rows: [updated] } = await db.query('SELECT * FROM ultimate_build_jobs WHERE id=$1', [job.id]);
      assert.equal(updated.status, 'queued', outcome);
      assert.equal(updated.attempts, 0);
      assert.equal(updated.pending_dependency_resume, null);
      assert.equal(updated.payload.nextCompetencyIndex, undefined);
      assert.equal(updated.payload.unresolvedCompetencyIds, undefined);
      assert.deepEqual(updated.payload.lessonIds.sort(), ['lesson-a', 'lesson-b']);
      assert.deepEqual(updated.payload.assetIds.sort(), ['asset-a', 'asset-b']);
      assert.equal((await db.query('SELECT status FROM ultimate_course_builds')).rows[0].status, 'queued');
    }
    // A targeted QA acceptance job must remain targeted after a wakeup.
    await db.exec("DELETE FROM ultimate_build_jobs; UPDATE ultimate_course_builds SET status='running'");
    const target = { acceptance: true, competencyId: 'one-competency', lessonBuildId: 'one-lesson', nextCompetencyIndex: 12 };
    const { rows: [targeted] } = await db.query("INSERT INTO ultimate_build_jobs(build_id,status,payload) VALUES($1,'running',$2::jsonb) RETURNING *", [build, JSON.stringify(target)]);
    await wake('lesson-target', 'asset-target');
    await db.query("UPDATE ultimate_build_jobs SET status='queued',payload=$2::jsonb WHERE id=$1", [targeted.id, JSON.stringify(target)]);
    const { rows: [resumed] } = await db.query('SELECT payload FROM ultimate_build_jobs WHERE id=$1', [targeted.id]);
    assert.equal(resumed.payload.acceptance, true);
    assert.equal(resumed.payload.competencyId, 'one-competency');
    assert.equal(resumed.payload.lessonBuildId, 'one-lesson');
    assert.equal(resumed.payload.nextCompetencyIndex, undefined);
    // Media arrived during the final work; valid release finished before the
    // worker completed its lease. Never downgrade publication or rerender it.
    await db.query("UPDATE ultimate_build_jobs SET status='running' WHERE id=$1", [targeted.id]);
    await wake('last-lesson', 'last-asset');
    await db.exec("UPDATE ultimate_course_builds SET status='published'");
    await db.query("UPDATE ultimate_build_jobs SET status='completed' WHERE id=$1", [targeted.id]);
    assert.equal((await db.query('SELECT status FROM ultimate_course_builds')).rows[0].status, 'published');
    assert.equal((await db.query('SELECT status FROM ultimate_build_jobs')).rows[0].status, 'completed');
    await wake('late', 'late-asset');
    assert.equal((await db.query('SELECT count(*)::int AS n FROM ultimate_build_jobs')).rows[0].n, 1);
    await db.exec("UPDATE ultimate_course_builds SET status='running'");
    // No active lease remains after an acceptance attempt failed. Its later
    // media arrival must retain that target, never become a course publication.
    await db.exec("DELETE FROM ultimate_build_jobs; UPDATE ultimate_course_builds SET status='blocked'");
    await db.query("INSERT INTO ultimate_build_jobs(build_id,status,payload,created_at) VALUES($1,'failed',$2::jsonb,'2026-01-01T00:00:00Z')", [build, JSON.stringify(target)]);
    const { rows: [lateTarget] } = await wake('target', 'asset-after-failure');
    assert.equal(lateTarget.payload.acceptance, true);
    assert.equal(lateTarget.payload.competencyId, 'one-competency');
    assert.equal(lateTarget.payload.lessonBuildId, 'one-lesson');
    assert.equal(lateTarget.payload.nextCompetencyIndex, undefined);
    // A newer explicit full-course request supersedes the old target, even
    // when that newer job is also terminal before its media arrives.
    await db.query("UPDATE ultimate_build_jobs SET status='failed' WHERE id=$1", [lateTarget.id]);
    await db.query("INSERT INTO ultimate_build_jobs(build_id,status,payload,created_at) VALUES($1,'failed','{}'::jsonb,'2099-01-01T00:00:00Z')", [build]);
    const { rows: [fullResume] } = await wake('whole-course', 'new-asset');
    assert.equal(fullResume.payload.acceptance, undefined);
    assert.equal(fullResume.payload.competencyId, undefined);
    assert.equal(fullResume.payload.lessonBuildId, undefined);
    // Arrival after failure creates a fresh job; terminal writes themselves
    // atomically block the build, without a later application-side stale write.
    await db.exec('DELETE FROM ultimate_build_jobs');
    const { rows: [job] } = await db.query(`INSERT INTO ultimate_build_jobs(build_id,status) VALUES($1,'running') RETURNING *`, [build]);
    await db.query("UPDATE ultimate_build_jobs SET status='failed' WHERE id=$1", [job.id]);
    assert.equal((await db.query('SELECT status FROM ultimate_course_builds')).rows[0].status, 'blocked');
    await wake('lesson-c', 'asset-c');
    assert.equal((await db.query('SELECT status FROM ultimate_course_builds')).rows[0].status, 'queued');
    assert.equal((await db.query("SELECT count(*)::int AS n FROM ultimate_build_jobs WHERE status IN ('running','queued')")).rows[0].n, 1);
  } finally { await db.close(); }
});
