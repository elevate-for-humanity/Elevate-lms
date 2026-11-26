import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { expect, it } from 'vitest';
import {
  assertParisRepairDeletionAllowed,
  archiveParisRepairRow,
  deleteParisRepairRow,
  MAX_PARIS_LEDGER_DELETE_BATCH,
  PARIS_DELETE_ERRORS,
} from '@/lib/devstudio/paris-ledger-deletion-guard.mjs';

// PR4 (#2692): on 2026-11-17 all 254 paris_code_repairs rows were deleted
// by raw SQL with no release_sha and no same-day archive. The guard
// requires, per row: a live-release SHA, a matching archive row read back
// before the delete, and an explicit approval with retention clearance —
// plus a hard batch limit. No bulk delete path exists.

const repair = (overrides = {}) => ({
  id: 'ba7446c1-3d4a-4551-bedd-da9adcc9f90c',
  fingerprint: 'lesson_film_render:quality:abc123',
  goal: 'Repair the lesson film render.',
  status: 'verified',
  release_sha: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
  verification: {
    exactRuntimeSha: true,
    runtimeVerifiedAt: '2026-11-23T00:00:00Z',
    tests: 'passed',
    deployments: 'passed',
    courseExecution: { state: 'passed' },
  },
  error_code: 'TIMEOUT',
  source_job_id: '83445992-95c5-4fc0-b40e-ac945308627d',
  workflow_run_id: 42540598308,
  attempt_count: 1,
  ...overrides,
});

const archive = (r) => ({
  id: 'archive-1',
  repair_id: r.id,
  fingerprint: r.fingerprint,
  release_sha: r.release_sha,
  archived_at: '2026-11-23T00:00:00.000Z',
  snapshot: r,
});

const approval = { actorId: 'admin-1', reason: 'Verified live, retention cleared.', retentionClearance: true };

it('allows a fully guarded single-row delete', () => {
  const r = repair();
  expect(assertParisRepairDeletionAllowed({ repairs: [r], archiveReadbacks: [archive(r)], approval })).toBe(true);
});

it('refuses to delete a row with no live-release SHA — it is evidence, not cleanup', () => {
  const r = repair({ release_sha: null });
  expect(() => assertParisRepairDeletionAllowed({ repairs: [r], archiveReadbacks: [archive(r)], approval }))
    .toThrow(PARIS_DELETE_ERRORS.requiresReleaseSha);
});

it('refuses to delete without an archive row read back first', () => {
  const r = repair();
  expect(() => assertParisRepairDeletionAllowed({ repairs: [r], archiveReadbacks: [], approval }))
    .toThrow(PARIS_DELETE_ERRORS.requiresArchive);
});

it('refuses when the archive snapshot does not match the ledger row', () => {
  const r = repair();
  const wrong = { ...archive(r), release_sha: 'different-sha' };
  expect(() => assertParisRepairDeletionAllowed({ repairs: [r], archiveReadbacks: [wrong], approval }))
    .toThrow(PARIS_DELETE_ERRORS.archiveMismatch);
});

it('refuses without an explicit approval with retention clearance', () => {
  const r = repair();
  expect(() => assertParisRepairDeletionAllowed({ repairs: [r], archiveReadbacks: [archive(r)], approval: { actorId: 'admin-1', reason: 'cleanup' } }))
    .toThrow(PARIS_DELETE_ERRORS.requiresApproval);
  expect(() => assertParisRepairDeletionAllowed({ repairs: [r], archiveReadbacks: [archive(r)], approval: null }))
    .toThrow(PARIS_DELETE_ERRORS.requiresApproval);
});

it('refuses bulk deletes above the hard batch limit', () => {
  const repairs = Array.from({ length: MAX_PARIS_LEDGER_DELETE_BATCH + 1 }, (_, i) => repair({ id: `id-${i}` }));
  expect(() => assertParisRepairDeletionAllowed({ repairs, archiveReadbacks: [], approval }))
    .toThrow(PARIS_DELETE_ERRORS.bulkLimitExceeded);
  expect(() => assertParisRepairDeletionAllowed({ repairs: [], archiveReadbacks: [], approval }))
    .toThrow(PARIS_DELETE_ERRORS.repairsRequired);
});

function fakeDb(repairRow) {
  const calls = [];
  return {
    calls,
    async rpc(name, args) {
      calls.push(['rpc', name, args]);
      return { data: 'archive-1', error: null };
    },
    from(table) {
      const query = {
        delete() { calls.push(['delete', table]); return query; },
        eq() { return query; },
        select() { return query; },
        async single() {
          return { data: table === 'paris_code_repairs_archive' ? archive(repairRow) : { id: repairRow.id }, error: null };
        },
      };
      return query;
    },
  };
}

it('archives then deletes exactly one row, in that order', async () => {
  const r = repair();
  const db = fakeDb(r);
  const deletedId = await deleteParisRepairRow(db, r, approval);
  expect(deletedId).toBe(r.id);
  expect(db.calls.map((c) => c[0])).toEqual(['rpc', 'delete']);
  expect(db.calls[0][1]).toBe('archive_paris_code_repair');
  expect(db.calls[1][1]).toBe('paris_code_repairs');
});

it('archive refuses a row with no release_sha before any insert', async () => {
  const db = fakeDb(repair());
  await expect(archiveParisRepairRow(db, repair({ release_sha: '' }), 'admin-1'))
    .rejects.toThrow(PARIS_DELETE_ERRORS.requiresReleaseSha);
  expect(db.calls).toEqual([]);
});

it('rejects incomplete release and a stale archive even when the SHA matches', () => {
  const r = repair();
  expect(() => assertParisRepairDeletionAllowed({
    repairs: [{ ...r, status: 'deploying' }], archiveReadbacks: [archive(r)], approval,
  })).toThrow(PARIS_DELETE_ERRORS.requiresVerifiedRelease);
  expect(() => assertParisRepairDeletionAllowed({
    repairs: [{ ...r, verification: { ...r.verification, symptom: 'New evidence' } }],
    archiveReadbacks: [archive(r)], approval,
  })).toThrow(PARIS_DELETE_ERRORS.archiveMismatch);
});

it('enforces verified release and exact snapshot in PostgreSQL', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create table paris_code_repairs (
        id uuid primary key, fingerprint text, goal text, status text, release_sha text,
        verification jsonb, error_code text, source_job_id uuid, workflow_run_id bigint,
        attempt_count integer
      );
    `);
    await db.exec(readFileSync('supabase/migrations/20261123120000_paris_ledger_deletion_guard.sql', 'utf8'));
    const r = repair();
    await db.query(
      "insert into paris_code_repairs(id,fingerprint,status,release_sha,verification) values ($1,$2,'deploying',$3,$4)",
      [r.id, r.fingerprint, r.release_sha, JSON.stringify(r.verification)],
    );
    const archiveInDb = () => db.query('select archive_paris_code_repair($1) as id', [r.id]);
    const removeInDb = () => db.query('delete from paris_code_repairs where id=$1 returning id', [r.id]);
    await expect(archiveInDb()).rejects.toThrow(PARIS_DELETE_ERRORS.requiresVerifiedRelease);
    await expect(removeInDb()).rejects.toThrow(PARIS_DELETE_ERRORS.requiresVerifiedRelease);
    await db.query("update paris_code_repairs set status='verified' where id=$1", [r.id]);
    const before = await archiveInDb();
    await db.query("update paris_code_repairs set goal='Updated evidence' where id=$1", [r.id]);
    await expect(removeInDb()).rejects.toThrow(PARIS_DELETE_ERRORS.requiresArchive);
    expect((await archiveInDb()).rows).toEqual(before.rows);
    expect((await removeInDb()).rows).toEqual([{ id: r.id }]);
    expect((await db.query("select snapshot->>'goal' as goal from paris_code_repairs_archive")).rows)
      .toEqual([{ goal: 'Updated evidence' }]);
  } finally {
    await db.close();
  }
}, 30_000);
