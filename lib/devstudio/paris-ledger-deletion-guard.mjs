// Branch refreshed to pick up main (71e31a22): /apply/student E2E fix + Dockerfile.google-lms.
// Branch refreshed to pick up main (a11d77d8): fresh CI after E2E shard 3/4 environment failure on the fcad399b-era base.
// Deletion guard for the PARIS repair ledger (#2692).
//
// On 2026-11-17 a raw SQL DO $$ block deleted all 254 paris_code_repairs
// rows with no live verification and no same-day archive. No code path in
// this repo deletes from that table — the deletion happened outside the
// application, through the postgres role — so an application-only check
// cannot prevent a recurrence. This module is one half of the guard:
//
//  1. App level (this file): every future code path that deletes a ledger
//     row MUST call assertParisRepairDeletionAllowed() first, and MUST use
//     archiveParisRepairRow() + deleteParisRepairRow() instead of a raw
//     .delete(). The checks mirror the database trigger in migration
//     20261123120000_paris_ledger_deletion_guard.sql.
//  2. Database level (that migration): a BEFORE DELETE trigger on
//     paris_code_repairs raises unless the row has a release_sha AND an
//     archive row exists for it. The trigger fires for service_role and
//     for raw SQL alike. Residual risk, stated plainly: a postgres
//     superuser can disable a trigger (session_replication_role) — the
//     guard stops accidents and application deletes, not a determined
//     superuser. That is why the archive table is the durable record.
//
// Per #2692 §5 a deletion requires ALL of:
//  - an individual durable live-release SHA (release_sha, per row),
//  - an archive row for that exact repair, read back before the delete,
//  - an explicit approval (actor + reason + retention clearance),
//  - a hard batch limit (no bulk deletes: MAX_PARIS_LEDGER_DELETE_BATCH).
// There is no "delete all" path. Blocked rows with no release_sha can
// never be deleted by this guard — they must be repaired and verified
// first, or the guard must be changed by a reviewed PR.

export const MAX_PARIS_LEDGER_DELETE_BATCH = 10;

export const PARIS_DELETE_ERRORS = Object.freeze({
  repairsRequired: 'PARIS_DELETE_REPAIRS_REQUIRED',
  bulkLimitExceeded: 'PARIS_DELETE_BULK_LIMIT_EXCEEDED',
  requiresReleaseSha: 'PARIS_DELETE_REQUIRES_RELEASE_SHA',
  requiresArchive: 'PARIS_DELETE_REQUIRES_ARCHIVE',
  archiveMismatch: 'PARIS_DELETE_ARCHIVE_MISMATCH',
  requiresArchiveReadback: 'PARIS_DELETE_REQUIRES_ARCHIVE_READBACK',
  requiresApproval: 'PARIS_DELETE_REQUIRES_APPROVAL',
  archiveFailed: 'PARIS_DELETE_ARCHIVE_FAILED',
  archiveReadbackFailed: 'PARIS_DELETE_ARCHIVE_READBACK_FAILED',
  deleteFailed: 'PARIS_DELETE_FAILED',
});

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Pure check. `repairs` are the ledger rows proposed for deletion;
 * `archiveReadbacks` are the archive rows read back from
 * paris_code_repairs_archive (one per repair, fingerprint + release_sha
 * must match the ledger row exactly); `approval` is
 * { actorId, reason, retentionClearance: true }.
 * Throws the typed error for the first failing check. Returns true.
 */
export function assertParisRepairDeletionAllowed({ repairs, archiveReadbacks, approval }) {
  if (!Array.isArray(repairs) || repairs.length === 0) throw Error(PARIS_DELETE_ERRORS.repairsRequired);
  if (repairs.length > MAX_PARIS_LEDGER_DELETE_BATCH) throw Error(PARIS_DELETE_ERRORS.bulkLimitExceeded);
  if (!approval || !isNonEmptyString(approval.actorId) || !isNonEmptyString(approval.reason) || approval.retentionClearance !== true) {
    throw Error(PARIS_DELETE_ERRORS.requiresApproval);
  }
  const byRepairId = new Map();
  for (const archive of Array.isArray(archiveReadbacks) ? archiveReadbacks : []) {
    if (archive?.repair_id) byRepairId.set(String(archive.repair_id), archive);
  }
  for (const repair of repairs) {
    if (!repair || !isNonEmptyString(repair.id)) throw Error(PARIS_DELETE_ERRORS.repairsRequired);
    // A row with no live-release SHA is evidence, not cleanup. It must be
    // repaired and verified first; deleting it would repeat #2692.
    if (!isNonEmptyString(repair.release_sha)) throw Error(PARIS_DELETE_ERRORS.requiresReleaseSha);
    const archive = byRepairId.get(String(repair.id));
    if (!archive) throw Error(PARIS_DELETE_ERRORS.requiresArchive);
    if (archive.fingerprint !== repair.fingerprint || archive.release_sha !== repair.release_sha) {
      throw Error(PARIS_DELETE_ERRORS.archiveMismatch);
    }
    if (!isNonEmptyString(archive.id) || !archive.archived_at) {
      throw Error(PARIS_DELETE_ERRORS.requiresArchiveReadback);
    }
  }
  return true;
}

/**
 * Archive one ledger row into paris_code_repairs_archive and read it back.
 * The readback is the proof the archive exists before any delete is
 * attempted; the caller must pass the returned row to
 * assertParisRepairDeletionAllowed(). `db` is the Supabase admin client.
 */
export async function archiveParisRepairRow(db, repair, actorId) {
  if (!repair || !isNonEmptyString(repair.id)) throw Error(PARIS_DELETE_ERRORS.repairsRequired);
  if (!isNonEmptyString(repair.release_sha)) throw Error(PARIS_DELETE_ERRORS.requiresReleaseSha);
  if (!isNonEmptyString(actorId)) throw Error(PARIS_DELETE_ERRORS.requiresApproval);
  const snapshot = { ...repair };
  const inserted = await db.from('paris_code_repairs_archive').insert({
    repair_id: repair.id,
    fingerprint: repair.fingerprint,
    goal: repair.goal ?? null,
    status: repair.status ?? null,
    release_sha: repair.release_sha,
    verification: repair.verification ?? null,
    error_code: repair.error_code ?? null,
    source_job_id: repair.source_job_id ?? null,
    workflow_run_id: repair.workflow_run_id ?? null,
    attempt_count: repair.attempt_count ?? null,
    snapshot,
    archived_by: actorId,
  }).select('id,repair_id,fingerprint,release_sha,archived_at').single();
  if (inserted.error) throw Error(PARIS_DELETE_ERRORS.archiveFailed, { cause: inserted.error });
  if (!inserted.data?.id) throw Error(PARIS_DELETE_ERRORS.archiveReadbackFailed);
  return inserted.data;
}

/**
 * The only sanctioned single-row delete path. Archives first, readbacks,
 * asserts, then deletes exactly that row. Returns the deleted repair id.
 * Bulk deletes do not exist: call this once per row, at most
 * MAX_PARIS_LEDGER_DELETE_BATCH rows per operation.
 */
export async function deleteParisRepairRow(db, repair, approval) {
  const archive = await archiveParisRepairRow(db, repair, approval?.actorId);
  assertParisRepairDeletionAllowed({ repairs: [repair], archiveReadbacks: [archive], approval });
  const deleted = await db.from('paris_code_repairs').delete().eq('id', repair.id).select('id').single();
  if (deleted.error) throw Error(PARIS_DELETE_ERRORS.deleteFailed, { cause: deleted.error });
  if (!deleted.data?.id) throw Error(PARIS_DELETE_ERRORS.deleteFailed);
  return deleted.data.id;
}
