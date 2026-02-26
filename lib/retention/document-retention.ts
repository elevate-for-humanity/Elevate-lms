import { logger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Document retention policy configuration.
 *
 * Identity documents (government ID, SSN forms, income proof) are retained
 * for the minimum period required by WIOA/DWD regulations, then purged.
 *
 * WIOA requires 3 years from program exit for participant records.
 * We default to 3 years (1095 days) with a configurable override.
 *
 * Storage note: Supabase Storage does not use object versioning.
 * When files are removed via .remove(), they are permanently deleted
 * with no recoverable versions. This is the desired behavior for PII purge.
 */
const DEFAULT_RETENTION_DAYS = parseInt(
  process.env.DOCUMENT_RETENTION_DAYS || '1095',
  10
);

/** Document types subject to retention policy (PII-bearing) */
const PII_DOCUMENT_TYPES = [
  'government_id',
  'income_proof',
  'residency_proof',
  'selective_service',
  'tax_document',
  'w9',
  'ssn_form',
];

interface RetentionOptions {
  dryRun?: boolean;
  batchSize?: number;
  actorId?: string;
}

interface RetentionResult {
  scanned: number;
  deleted: number;
  skipped: number;
  errors: number;
  dryRun: boolean;
  documents: Array<{ id: string; type: string; created_at: string }>;
}

/**
 * Scan for and delete identity documents past their retention period.
 *
 * - dryRun: if true, returns what would be deleted without deleting
 * - batchSize: max documents to process per run (default 50, max 200)
 * - actorId: who triggered the purge (for audit trail)
 *
 * Only deletes from storage; the metadata row is kept with status='purged'
 * for audit trail continuity. Each deletion is logged to admin_audit_events.
 */
export async function enforceDocumentRetention(
  options: RetentionOptions = {}
): Promise<RetentionResult> {
  const { dryRun = false, batchSize = 50, actorId = 'system' } = options;
  const db = createAdminClient();
  if (!db) {
    logger.error('[Retention] Admin client not available');
    return { scanned: 0, deleted: 0, skipped: 0, errors: 0, dryRun, documents: [] };
  }

  const retentionDays = DEFAULT_RETENTION_DAYS;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  const cutoffISO = cutoffDate.toISOString();

  // Find documents past retention that haven't been purged yet
  const { data: expiredDocs, error: queryError } = await db
    .from('documents')
    .select('id, file_path, document_type, user_id, created_at')
    .in('document_type', PII_DOCUMENT_TYPES)
    .lt('created_at', cutoffISO)
    .neq('status', 'purged')
    .limit(batchSize);

  if (queryError) {
    logger.error('[Retention] Query failed', queryError);
    return { scanned: 0, deleted: 0, skipped: 0, errors: 1, dryRun, documents: [] };
  }

  const docs = expiredDocs || [];

  // Dry run — return what would be deleted without touching anything
  if (dryRun) {
    logger.info('[Retention] Dry run complete', {
      scanned: docs.length,
      retentionDays,
      cutoffDate: cutoffISO,
      actorId,
    });
    return {
      scanned: docs.length,
      deleted: 0,
      skipped: 0,
      errors: 0,
      dryRun: true,
      documents: docs.map(d => ({
        id: d.id,
        type: d.document_type,
        created_at: d.created_at,
      })),
    };
  }

  let deleted = 0;
  let skipped = 0;
  let errors = 0;
  const deletedDocs: Array<{ id: string; type: string; created_at: string }> = [];

  for (const doc of docs) {
    try {
      // Delete the file from storage
      if (doc.file_path) {
        const { error: storageError } = await db.storage
          .from('documents')
          .remove([doc.file_path]);

        if (storageError) {
          logger.warn('[Retention] Storage delete failed', {
            docId: doc.id,
          });
          errors++;
          continue;
        }
      } else {
        // No file_path — already missing from storage, just mark as purged
        skipped++;
      }

      // Mark the metadata row as purged (keep for audit trail)
      await db
        .from('documents')
        .update({
          status: 'purged',
          file_path: null,
          file_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', doc.id);

      // Log each deletion to immutable audit trail
      await db.from('admin_audit_events').insert({
        actor_id: actorId,
        action: 'DOCUMENT_PURGED',
        entity_type: 'document',
        entity_id: doc.id,
        metadata: {
          document_type: doc.document_type,
          user_id: doc.user_id,
          created_at: doc.created_at,
          retention_days: retentionDays,
          reason: 'retention_policy_enforcement',
        },
        created_at: new Date().toISOString(),
      });

      deleted++;
      deletedDocs.push({
        id: doc.id,
        type: doc.document_type,
        created_at: doc.created_at,
      });
    } catch (err) {
      logger.error('[Retention] Error processing document', err as Error, {
        docId: doc.id,
      });
      errors++;
    }
  }

  logger.info('[Retention] Enforcement complete', {
    scanned: docs.length,
    deleted,
    skipped,
    errors,
    retentionDays,
    cutoffDate: cutoffISO,
    actorId,
  });

  return { scanned: docs.length, deleted, skipped, errors, dryRun: false, documents: deletedDocs };
}
