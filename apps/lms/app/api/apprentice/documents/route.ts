import { logger } from '@/lib/logger';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import { auditLog, AuditAction, AuditEntity } from '@/lib/logging/auditLog';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { isQaE2EIdentity } from '@/lib/qa/is-qa-e2e-identity';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type DatabaseClient = Awaited<ReturnType<typeof requireAdminClient>>;

async function resolveEnrollment(
  supabase: NonNullable<DatabaseClient>,
  userId: string,
  programSlug: string,
) {
  if (!programSlug) return null;
  const { data, error } = await supabase
    .from('program_enrollments')
    .select('id,program_slug,status,enrollment_state')
    .or(`user_id.eq.${userId},student_id.eq.${userId}`)
    .eq('program_slug', programSlug)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = await requireAdminClient();

    const programSlug = new URL(request.url).searchParams.get('program')?.trim() || '';
    if (!programSlug) return NextResponse.json({ error: 'Program is required' }, { status: 400 });
    const enrollment = await resolveEnrollment(db, user.id, programSlug);
    if (!enrollment)
      return NextResponse.json({ error: 'No enrollment found for this program' }, { status: 403 });

    const [
      { data: documentTypes, error: typesError },
      { data: uploadedDocuments, error: docsError },
    ] = await Promise.all([
      db
        .from('apprentice_document_types')
        .select('*')
        .eq('program_slug', programSlug)
        .order('display_order', { ascending: true }),
      db
        .from('documents')
        .select(
          'id, document_type, file_name, file_url, file_size_bytes, mime_type, status, verification_status, created_at, metadata',
        )
        .eq('user_id', user.id)
        .contains('metadata', { program_slug: programSlug, enrollment_id: enrollment.id })
        .order('created_at', { ascending: false }),
    ]);
    if (typesError) throw typesError;
    if (docsError) throw docsError;

    return NextResponse.json({
      enrollmentId: enrollment.id,
      documentTypes: documentTypes || [],
      uploadedDocuments: uploadedDocuments || [],
    });
  } catch (error) {
    logger.error(
      '[Documents API] Error',
      normalizeError(error, 'Documents API error'),
      getErrorContext(error),
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = await requireAdminClient();

    const formData = await request.formData();
    const file = formData.get('file');
    const documentTypeId = String(formData.get('documentTypeId') || '').trim();
    const programSlug = String(formData.get('programSlug') || '').trim();
    if (!(file instanceof File) || !documentTypeId || !programSlug) {
      return NextResponse.json(
        { error: 'File, document type, and program are required' },
        { status: 400 },
      );
    }

    const enrollment = await resolveEnrollment(db, user.id, programSlug);
    if (!enrollment)
      return NextResponse.json({ error: 'No enrollment found for this program' }, { status: 403 });

    const { data: docType, error: docTypeError } = await db
      .from('apprentice_document_types')
      .select('*')
      .eq('id', documentTypeId)
      .eq('program_slug', programSlug)
      .maybeSingle();
    if (docTypeError || !docType)
      return NextResponse.json(
        { error: 'Invalid document type for this program' },
        { status: 400 },
      );

    // Requirements are database-configured, so validate their machine key by
    // shape instead of maintaining a second, inevitably drifting allowlist.
    const documentType = String(docType.document_type || '').trim();
    if (!/^[a-z][a-z0-9_-]{0,127}$/.test(documentType)) {
      const configurationError = new Error('Invalid configured apprentice document type');
      logger.error(
        '[Documents API] Invalid configured document type',
        configurationError,
        { documentTypeId, programSlug },
      );
      return NextResponse.json(
        { error: 'This document requirement is misconfigured. Please contact program staff.' },
        { status: 500 },
      );
    }

    const maxBytes = Number(docType.max_file_size_mb || 10) * 1024 * 1024;
    if (file.size <= 0 || file.size > maxBytes) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${docType.max_file_size_mb || 10}MB` },
        { status: 400 },
      );
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const acceptedFormats = Array.isArray(docType.accepted_formats)
      ? docType.accepted_formats.map((value: unknown) =>
          String(value).toLowerCase().replace(/^\./, ''),
        )
      : [];
    if (!acceptedFormats.includes(ext))
      return NextResponse.json(
        { error: `Invalid file type. Accepted: ${acceptedFormats.join(', ')}` },
        { status: 400 },
      );

    const { data: existingDocs, error: existingError } = await db
      .from('documents')
      .select('id,status,verification_status,metadata,file_url')
      .eq('user_id', user.id)
      .eq('document_type', documentType)
      .contains('metadata', { program_slug: programSlug, enrollment_id: enrollment.id });
    if (existingError) throw existingError;

    const immutableExisting = (existingDocs || []).filter((doc) =>
      ['approved', 'accepted', 'verified'].includes(
        String(doc.verification_status || doc.status || '').toLowerCase(),
      ),
    );
    if (immutableExisting.length) {
      return NextResponse.json(
        {
          error:
            'An approved document is already on file. Approved evidence cannot be replaced or deleted; contact program staff if a new version is required.',
        },
        { status: 409 },
      );
    }

    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${user.id}/apprentice-documents/${programSlug}/${enrollment.id}/${documentType}/${timestamp}_${safeFileName}`;
    const { error: uploadError } = await db.storage
      .from('documents')
      .upload(storagePath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });
    if (uploadError) return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });

    const { data: docRecord, error: recordError } = await db
      .from('documents')
      .insert({
        user_id: user.id,
        document_type: documentType,
        file_name: file.name,
        file_size: file.size,
        file_url: null,
        file_size_bytes: file.size,
        mime_type: file.type,
        status: 'pending',
        verification_status: 'pending',
        metadata: {
          program_slug: programSlug,
          enrollment_id: enrollment.id,
          storage_bucket: 'documents',
          storage_path: storagePath,
          document_type_id: documentTypeId,
        },
      })
      .select()
      .single();

    if (recordError || !docRecord) {
      const persistenceError = normalizeError(
        recordError || new Error('Document insert returned no record'),
        'Failed to persist uploaded document',
      );
      logger.error(
        '[Documents API] Failed to persist uploaded document',
        persistenceError,
        {
          ...getErrorContext(recordError || persistenceError),
          documentType,
          documentTypeId,
          programSlug,
          enrollmentId: enrollment.id,
          userId: user.id,
        },
      );
      await db.storage.from('documents').remove([storagePath]);
      return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 });
    }

    // Pending/rejected superseded records may be removed only after the new
    // upload and database row both exist. Approved evidence was rejected above.
    if (existingDocs?.length) {
      const oldIds = existingDocs.map((doc) => doc.id).filter((id) => id !== docRecord.id);
      const oldPaths = existingDocs
        .map((doc) => doc.metadata?.storage_path ?? doc.file_url)
        .filter((path): path is string => typeof path === 'string' && path.length > 0)
        .map((path) => (path.startsWith('documents/') ? path.slice('documents/'.length) : path));
      if (oldIds.length) {
        const { error: deleteRecordError } = await db
          .from('documents')
          .delete()
          .in('id', oldIds)
          .eq('user_id', user.id);
        if (!deleteRecordError && oldPaths.length)
          await db.storage.from('documents').remove(oldPaths);
      }
    }

    await auditLog({
      actorId: user.id,
      actorRole: 'apprentice',
      action: AuditAction.DOCUMENT_UPLOADED || 'DOCUMENT_UPLOADED',
      entity: AuditEntity.DOCUMENT,
      entityId: docRecord.id,
      metadata: {
        enrollment_id: enrollment.id,
        program_slug: programSlug,
        document_type: documentType,
        storage_path: storagePath,
      },
    });

    try {
      if (isQaE2EIdentity(user.email)) {
        return NextResponse.json({ success: true, document: docRecord });
      }
      const [{ data: studentProfile }, { data: admins }] = await Promise.all([
        db.from('profiles').select('full_name,email').eq('id', user.id).maybeSingle(),
        db.from('profiles').select('email').in('role', ['admin', 'super_admin']),
      ]);
      if (admins?.length) {
        const { emailService } = await import('@/lib/notifications/email');
        const studentName = studentProfile?.full_name || studentProfile?.email || 'Unknown Student';
        await Promise.all(
          admins
            .filter((admin) => admin.email)
            .map((admin) =>
              emailService
                .sendDocumentUploadNotification(
                  admin.email!,
                  studentName,
                  docType.name || documentType,
                  programSlug,
                )
                .catch(() => undefined),
            ),
        );
      }
    } catch (notifyError) {
      logger.error('[Documents API] Staff notification error:', notifyError);
    }

    return NextResponse.json({ success: true, document: docRecord });
  } catch (error) {
    logger.error(
      '[Documents API] Error',
      normalizeError(error, 'Documents API error'),
      getErrorContext(error),
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function _DELETE(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = await requireAdminClient();

    const docId = new URL(request.url).searchParams.get('id');
    if (!docId) return NextResponse.json({ error: 'Document ID required' }, { status: 400 });

    const { data: doc } = await db
      .from('documents')
      .select('*')
      .eq('id', docId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    if (
      ['approved', 'accepted', 'verified'].includes(
        String(doc.verification_status || doc.status || '').toLowerCase(),
      )
    ) {
      return NextResponse.json({ error: 'Cannot delete approved evidence' }, { status: 409 });
    }

    const storagePath: string | undefined = doc.metadata?.storage_path ?? doc.file_url ?? undefined;
    if (storagePath) {
      const pathInBucket = storagePath.startsWith('documents/')
        ? storagePath.slice('documents/'.length)
        : storagePath;
      const { error: storageError } = await db.storage.from('documents').remove([pathInBucket]);
      if (storageError)
        return NextResponse.json({ error: 'Failed to delete stored file' }, { status: 500 });
    }

    const { error } = await db.from('documents').delete().eq('id', docId).eq('user_id', user.id);
    if (error) return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });

    await auditLog({
      actorId: user.id,
      actorRole: 'apprentice',
      action: AuditAction.DOCUMENT_DELETED,
      entity: AuditEntity.DOCUMENT,
      entityId: docId,
      metadata: {
        document_type: doc.document_type,
        program_slug: doc.metadata?.program_slug,
        enrollment_id: doc.metadata?.enrollment_id,
        reason: 'user_initiated',
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      '[Documents API] Error',
      normalizeError(error, 'Documents API error'),
      getErrorContext(error),
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withApiAudit('/api/apprentice/documents', _GET);
export const POST = withApiAudit('/api/apprentice/documents', _POST);
export const DELETE = withApiAudit('/api/apprentice/documents', _DELETE);
