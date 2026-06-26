import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { setAuditContext } from '@/lib/audit-context';

const DOCUMENT_BUCKET = 'documents';

export async function getAdminDocumentUrl(params: {
  adminId: string;
  documentId: string;
  context?: string;
}): Promise<string | null> {
  const { adminId, documentId, context } = params;
  const db = await requireAdminClient();
  if (!db) return null;
  await setAuditContext(db, { actorUserId: adminId, systemActor: 'admin_document_access' });
  if (!documentId) return null;
  const { data: doc } = await db.from('documents').select('file_path, user_id, document_type').eq('id', documentId).maybeSingle();
  if (!doc?.file_path) return null;
  const { data, error } = await db.storage.from(DOCUMENT_BUCKET).createSignedUrl(doc.file_path, 60);
  if (error || !data?.signedUrl) return null;
  const { error: auditError } = await db.from('admin_audit_events').insert({
    actor_user_id: adminId,
    action: 'DOCUMENT_URL_ISSUED',
    target_type: 'document',
    target_id: documentId,
    metadata: { document_owner_id: doc.user_id, document_type: doc.document_type, context: context || 'server_render' },
  });
  if (auditError) { logger.warn('[DocumentAccess] Audit log failed', { error: auditError.message }); }
  return data.signedUrl;
}

export async function getAdminDocumentUrls(params: {
  adminId: string;
  documentIds: string[];
  context?: string;
}): Promise<Record<string, string | null>> {
  const { adminId, documentIds, context } = params;
  if (!documentIds.length) return {};
  const db = await requireAdminClient();
  if (!db) return {};
  const results: Record<string, string | null> = {};
  const { data: docs } = await db.from('documents').select('id, file_path, user_id, document_type').in('id', documentIds);
  if (!docs?.length) return {};
  for (const doc of docs) {
    if (!doc.file_path) { results[doc.id] = null; continue; }
    const { data, error } = await db.storage.from(DOCUMENT_BUCKET).createSignedUrl(doc.file_path, 60);
    if (error || !data?.signedUrl) { results[doc.id] = null; continue; }
    results[doc.id] = data.signedUrl;
    const { error: auditError } = await db.from('admin_audit_events').insert({
      actor_user_id: adminId,
      action: 'DOCUMENT_URL_ISSUED',
      target_type: 'document',
      target_id: doc.id,
      metadata: { document_owner_id: doc.user_id, document_type: doc.document_type, context: context || 'server_render_batch' },
    });
    if (auditError) { logger.warn('[DocumentAccess] Audit log failed', { error: auditError.message }); }
  }
  return results;
}

export async function getAdminDocumentUrlByPath(params: {
  adminId: string;
  filePaths: Array<{ bucket: string; path: string; documentId?: string }>;
  context?: string;
}): Promise<Record<string, string | null>> {
  const { adminId, filePaths, context } = params;
  if (!filePaths.length) return {};
  const db = await requireAdminClient();
  if (!db) return {};
  const results: Record<string, string | null> = {};
  for (const { bucket, path, documentId } of filePaths) {
    const { data, error } = await db.storage.from(bucket).createSignedUrl(path, 60);
    if (error || !data?.signedUrl) { results[path] = null; continue; }
    results[path] = data.signedUrl;
    const { error: auditError } = await db.from('admin_audit_events').insert({
      actor_user_id: adminId,
      action: 'DOCUMENT_URL_ISSUED',
      target_type: 'document',
      target_id: documentId || path,
      metadata: { storage_bucket: bucket, file_path: path, context: context || 'server_render_path_based' },
    });
    if (auditError) { logger.warn('[DocumentAccess] Audit log failed', { error: auditError.message }); }
  }
  return results;
}
