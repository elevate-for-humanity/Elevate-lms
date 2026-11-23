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
  status: 'blocked',
  release_sha: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
  verification: { liveVerified: true },
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

// Minimal fake Supabase client: records calls, returns canned rows.
function fakeDb() {
  const calls = [];
  const store = new Map();
  return {
    calls,
    store,
    from(table) {
      const query = {
        _table: table,
        insert(row) { calls.push(['insert', table, row]); store.set(row.repair_id ?? row.id, row); return query; },
        delete() { calls.push(['delete', table]); return query; },
        eq() { return query; },
        select() { return query; },
        async single() {
          const last = calls[calls.length - 1];
          if (last[0] === 'insert') {
            const row = last[2];
            return { data: { id: `arch-${row.repair_id}`, repair_id: row.repair_id, fingerprint: row.fingerprint, release_sha: row.release_sha, archived_at: '2026-11-23T00:00:00.000Z' }, error: null };
          }
          return { data: { id: 'ba7446c1-3d4a-4551-bedd-da9adcc9f90c' }, error: null };
        },
      };
      return query;
    },
  };
}

it('archives then deletes exactly one row, in that order', async () => {
  const db = fakeDb();
  const r = repair();
  const deletedId = await deleteParisRepairRow(db, r, approval);
  expect(deletedId).toBe(r.id);
  expect(db.calls.map((c) => c[0])).toEqual(['insert', 'delete']);
  expect(db.calls[0][1]).toBe('paris_code_repairs_archive');
  expect(db.calls[1][1]).toBe('paris_code_repairs');
});

it('archive refuses a row with no release_sha before any insert', async () => {
  const db = fakeDb();
  await expect(archiveParisRepairRow(db, repair({ release_sha: '' }), 'admin-1'))
    .rejects.toThrow(PARIS_DELETE_ERRORS.requiresReleaseSha);
  expect(db.calls).toEqual([]);
});
