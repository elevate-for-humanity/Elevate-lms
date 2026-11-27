import { isDeepStrictEqual } from 'node:util';

// Only individually verified repairs with a current archive and explicit
// retention clearance are eligible for deletion.
export const MAX_PARIS_LEDGER_DELETE_BATCH = 10;

export const PARIS_DELETE_ERRORS = Object.freeze({
  repairsRequired: 'PARIS_DELETE_REPAIRS_REQUIRED',
  bulkLimitExceeded: 'PARIS_DELETE_BULK_LIMIT_EXCEEDED',
  requiresReleaseSha: 'PARIS_DELETE_REQUIRES_RELEASE_SHA',
  requiresVerifiedRelease: 'PARIS_DELETE_REQUIRES_VERIFIED_RELEASE',
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

function assertVerifiedRelease(repair) {
  if (!repair || !isNonEmptyString(repair.id)) throw Error(PARIS_DELETE_ERRORS.repairsRequired);
  if (!isNonEmptyString(repair.release_sha)) throw Error(PARIS_DELETE_ERRORS.requiresReleaseSha);
  const evidence = repair.verification;
  if (repair.status !== 'verified' || evidence?.exactRuntimeSha !== true ||
      !isNonEmptyString(evidence.runtimeVerifiedAt) || evidence.tests !== 'passed' ||
      evidence.deployments !== 'passed' ||
      (repair.source_job_id && evidence.courseExecution?.state !== 'passed')) {
    throw Error(PARIS_DELETE_ERRORS.requiresVerifiedRelease);
  }
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
    assertVerifiedRelease(repair);
    const archive = byRepairId.get(String(repair.id));
    if (!archive) throw Error(PARIS_DELETE_ERRORS.requiresArchive);
    if (archive.fingerprint !== repair.fingerprint || archive.release_sha !== repair.release_sha ||
        !isDeepStrictEqual(archive.snapshot, repair)) {
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
  assertVerifiedRelease(repair);
  if (!isNonEmptyString(actorId)) throw Error(PARIS_DELETE_ERRORS.requiresApproval);
  const archived = await db.rpc('archive_paris_code_repair', {
    p_repair_id: repair.id,
    p_actor_id: actorId,
  });
  if (archived.error) throw Error(PARIS_DELETE_ERRORS.archiveFailed, { cause: archived.error });
  if (!isNonEmptyString(archived.data)) throw Error(PARIS_DELETE_ERRORS.archiveReadbackFailed);
  const result = await db.from('paris_code_repairs_archive')
    .select('id,repair_id,fingerprint,release_sha,archived_at,snapshot')
    .eq('id', archived.data)
    .single();
  if (result.error || !result.data?.id) {
    throw Error(PARIS_DELETE_ERRORS.archiveReadbackFailed, { cause: result.error });
  }
  return result.data;
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
