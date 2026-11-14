import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { setAuditContext } from '@/lib/audit-context';
import { resolveDocumentStorageLocator } from '@/lib/admin/document-record';

const DOCUMENT_BUCKET = 'documents';

/**
 * Single authorized path for admin document access.
 * Generates a short-lived signed URL and logs the access to the audit trail.
 *
 * When documentId is provided, ALL metadata (filePath, owner, type) is
 * resolved from the database. Caller-supplied values are ignored to prevent
 * audit records that don't match reality.
 *
 * All admin document access MUST go through this function or the
 * /api/admin/documents/signed-url endpoint (which calls this function).
 * Direct createSignedUrl calls in admin pages are prohibited (enforced by CI).
 */
export async function getAdminDocumentUrl(params: {
  adminId: string;
  documentId: string;
  context?: string;
}): Promise<string | null> {
  const { adminId, documentId, context } = params;

  const db = await requireAdminClient();
  if (!db) return null;
  await setAuditContext(db, {
    actorUserId: adminId,
    systemActor: 'admin_document_access',
  });

  if (!documentId) return null;

  // DB is the sole source of truth for document metadata
  const { data: doc } = await db
    .from('documents')
    .select('file_path, file_url, metadata, user_id, document_type')
    .eq('id', documentId)
    .maybeSingle();

  if (!doc) return null;
  const locator = resolveDocumentStorageLocator(doc);
  if (!locator) return null;

  // Generate short-lived signed URL (60s)
  const { data, error } = await db.storage.from(locator.bucket).createSignedUrl(locator.path, 60);

  if (error || !data?.signedUrl) return null;

  // Log access to immutable audit trail
  // created_at is omitted — DB default now() is the authoritative timestamp
  try {
    await db.from('admin_audit_events').insert({
      actor_user_id: adminId,
      action: 'DOCUMENT_URL_ISSUED',
      target_type: 'document',
      target_id: documentId,
      metadata: {
        document_owner_id: doc.user_id,
        document_type: doc.document_type,
        storage_bucket: locator.bucket,
        context: context || 'server_render',
      },
    });
  } catch (err) {
    logger.warn('[DocumentAccess] Audit log failed', {
      error: err instanceof Error ? err.message : err,
    });
  }

  return data.signedUrl;
}

/**
 * Get signed URLs for multiple file paths.
 * Uses the same signed URL mechanism as getAdminDocumentUrl.
 */
export async function getAdminDocumentUrlByPath(params: {
  adminId: string;
  filePaths: string[];
  context?: string;
}): Promise<Record<string, string | null>> {
  const { adminId, filePaths, context } = params;
  const result: Record<string, string | null> = {};

  if (!filePaths?.length) return result;

  const db = await requireAdminClient();
  if (!db) return result;
  await setAuditContext(db, {
    actorUserId: adminId,
    systemActor: 'admin_document_access',
  });

  const urlPromises = filePaths.map(async (filePath) => {
    try {
      const { data, error } = await db.storage.from(DOCUMENT_BUCKET).createSignedUrl(filePath, 60);
      return {
        filePath,
        url: error || !data?.signedUrl ? null : data.signedUrl,
      };
    } catch {
      return { filePath, url: null };
    }
  });

  const urls = await Promise.all(urlPromises);
  for (const { filePath, url } of urls) {
    result[filePath] = url;
  }

  return result;
}
