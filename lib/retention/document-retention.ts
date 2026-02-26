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

interface RetentionResult {
  scanned: number;
  deleted: number;
  errors: number;
}

/**
 * Scan for and delete identity documents past their retention period.
 * Only deletes from storage; the metadata row is kept with status='purged'
 * for audit trail continuity.
 */
export async function enforceDocumentRetention(
  retentionDays: number = DEFAULT_RETENTION_DAYS
): Promise<RetentionResult> {
  const db = createAdminClient();
  if (!db) {
    logger.error('[Retention] Admin client not available');
    return { scanned: 0, deleted: 0, errors: 0 };
  }

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
    .limit(500);

  if (queryError) {
    logger.error('[Retention] Query failed', queryError);
    return { scanned: 0, deleted: 0, errors: 1 };
  }

  const docs = expiredDocs || [];
  let deleted = 0;
  let errors = 0;

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
            error: storageError.message,
          });
          errors++;
          continue;
        }
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

      deleted++;
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
    errors,
    retentionDays,
    cutoffDate: cutoffISO,
  });

  return { scanned: docs.length, deleted, errors };
}
