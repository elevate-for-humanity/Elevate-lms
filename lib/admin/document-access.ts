import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

/**
 * Single authorized path for admin document access.
 * Generates a short-lived signed URL and logs the access to the audit trail.
 *
 * All admin document access MUST go through this function or the
 * /api/admin/documents/signed-url endpoint. Direct createSignedUrl
 * calls in admin pages are prohibited (enforced by CI).
 */
export async function getAdminDocumentUrl(params: {
  adminId: string;
  documentId?: string;
  filePath?: string;
  bucket?: string;
  context?: string;
  documentOwnerId?: string;
  documentType?: string;
}): Promise<string | null> {
  const {
    adminId,
    documentId,
    filePath: inputPath,
    bucket = 'documents',
    context,
    documentOwnerId: inputOwnerId,
    documentType: inputType,
  } = params;

  const db = createAdminClient();
  if (!db) return null;

  let filePath = inputPath;
  let documentOwnerId = inputOwnerId;
  let documentType = inputType;

  // Prefer document ID — resolve path server-side
  if (documentId && !filePath) {
    const { data: doc } = await db
      .from('documents')
      .select('file_path, user_id, document_type')
      .eq('id', documentId)
      .single();

    if (!doc?.file_path) return null;
    filePath = doc.file_path;
    documentOwnerId = doc.user_id;
    documentType = doc.document_type;
  }

  if (!filePath) return null;

  // Generate short-lived signed URL
  const { data, error } = await db.storage
    .from(bucket)
    .createSignedUrl(filePath, 60);

  if (error || !data?.signedUrl) return null;

  // Log access to immutable audit trail
  await db.from('admin_audit_events').insert({
    actor_id: adminId,
    action: 'DOCUMENT_URL_ISSUED',
    entity_type: 'document',
    entity_id: documentId || filePath,
    metadata: {
      bucket,
      document_owner_id: documentOwnerId,
      document_type: documentType,
      context: context || 'server_render',
    },
    created_at: new Date().toISOString(),
  }).catch((err: Error) => {
    logger.warn('[DocumentAccess] Audit log failed', { error: err.message });
  });

  return data.signedUrl;
}
