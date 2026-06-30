import { logger } from '@/lib/logger';
import { auditLog, AuditAction, AuditEntity } from '@/lib/logging/auditLog';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/apprentice/documents
 * Get document types and uploaded documents for a program
 */
async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const programSlug = searchParams.get('program') || 'barber-apprenticeship';

    // Get document types for this program
    const { data: documentTypes, error: typesError } = await supabase
      .from('apprentice_document_types')
      .select('*')
      .eq('program_slug', programSlug)
      .order('display_order', { ascending: true });

    if (typesError) {
      logger.error('[Documents API] Types error:', typesError);
    }

    // Get student's uploaded documents from apprentice_documents table
    const { data: uploadedDocuments, error: docsError } = await supabase
      .from('apprentice_documents')
      .select('id, document_type, document_type_id, file_name, file_path, file_url, file_size_bytes, mime_type, status, rejection_reason, uploaded_at, program_slug')
      .eq('student_id', user.id)
      .order('uploaded_at', { ascending: false });

    if (docsError) {
      logger.error('[Documents API] Docs error:', docsError);
    }

    // Generate signed URLs for viewing documents
    const documentsWithUrls = await Promise.all(
      (uploadedDocuments || []).map(async (doc) => {
        const storagePath = doc.file_path || doc.file_url;
        let signedUrl: string | null = null;
        if (storagePath) {
          try {
            const { data: signedData } = await supabase.storage
              .from('documents')
              .createSignedUrl(storagePath, 3600); // 1 hour expiry
            signedUrl = signedData?.signedUrl || null;
          } catch (urlError) {
            logger.error('[Documents API] Signed URL error:', urlError);
          }
        }
        return {
          id: doc.id,
          document_type_id: doc.document_type_id,
          document_type: doc.document_type,
          file_name: doc.file_name,
          file_path: storagePath,
          file_size_bytes: doc.file_size_bytes,
          mime_type: doc.mime_type,
          status: doc.status,
          rejection_reason: doc.rejection_reason,
          uploaded_at: doc.uploaded_at,
          signed_url: signedUrl,
        };
      })
    );

    return NextResponse.json({
      documentTypes: documentTypes || [],
      uploadedDocuments: documentsWithUrls,
    });
  } catch (error) {
    logger.error('[Documents API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/apprentice/documents
 * Upload a document
 */
async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentTypeId = formData.get('documentTypeId') as string;
    const programSlug = formData.get('programSlug') as string;

    if (!file || !documentTypeId || !programSlug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get document type to validate
    const { data: docType } = await supabase
      .from('apprentice_document_types')
      .select('*')
      .eq('id', documentTypeId)
      .maybeSingle();

    if (!docType) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

    // Validate file size
    if (file.size > docType.max_file_size_mb * 1024 * 1024) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size is ${docType.max_file_size_mb}MB`,
        },
        { status: 400 },
      );
    }

    // Validate file type
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!docType.accepted_formats.includes(ext || '')) {
      return NextResponse.json(
        {
          error: `Invalid file type. Accepted: ${docType.accepted_formats.join(', ')}`,
        },
        { status: 400 },
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${user.id}/apprentice-documents/${docType.document_type}/${timestamp}_${safeFileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      logger.error('[Documents API] Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Delete any existing document of this type for this user (replace)
    const { data: existingDocs } = await supabase
      .from('apprentice_documents')
      .select('id, file_path')
      .eq('student_id', user.id)
      .eq('document_type', docType.document_type);

    // Delete old storage files
    if (existingDocs) {
      for (const oldDoc of existingDocs) {
        const oldPath = oldDoc.file_path;
        if (oldPath) {
          const pathInBucket = oldPath.startsWith('documents/') ? oldPath.slice('documents/'.length) : oldPath;
          await supabase.storage.from('documents').remove([pathInBucket]);
        }
      }
      // Delete old records
      await supabase.from('apprentice_documents').delete()
        .eq('student_id', user.id)
        .eq('document_type', docType.document_type);
    }

    // Create document record in apprentice_documents table
    const { data: docRecord, error: recordError } = await supabase
      .from('apprentice_documents')
      .insert({
        student_id: user.id,
        document_type_id: docType.id,
        program_slug: programSlug,
        document_type: docType.document_type,
        file_name: file.name,
        file_path: storagePath, // Full path in storage bucket
        file_size_bytes: file.size,
        mime_type: file.type,
        status: 'pending',
      })
      .select()
      .single();

    if (recordError) {
      logger.error('[Documents API] Record error:', recordError);
      return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 });
    }

    // PHASE 2: Notify staff of document upload
    try {
      // Get student profile for name
      const { data: studentProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .maybeSingle();

      // Get admin emails
      const { data: admins } = await supabase
        .from('profiles')
        .select('email')
        .in('role', ['admin', 'super_admin']);

      if (admins && admins.length > 0) {
        const { emailService } = await import('@/lib/notifications/email');
        const studentName = studentProfile?.full_name || studentProfile?.email || 'Unknown Student';

        // Send notification to all admins
        for (const admin of admins) {
          if (admin.email) {
            await emailService
              .sendDocumentUploadNotification(
                admin.email,
                studentName,
                docType.name || docType.document_type,
                programSlug,
              )
              .catch((err: Error) => {
                logger.error('[Documents API] Staff notification failed:', err);
              });
          }
        }
        logger.info('[Documents API] Staff notifications sent for document upload');
      }
    } catch (notifyError) {
      // Log but don't fail the upload
      logger.error('[Documents API] Staff notification error:', notifyError);
    }

    return NextResponse.json({
      success: true,
      document: docRecord,
    });
  } catch (error) {
    logger.error('[Documents API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/apprentice/documents
 * Delete a document
 */
async function _DELETE(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const docId = searchParams.get('id');

    if (!docId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    // Get document to verify ownership and get file path
    const { data: doc } = await supabase
      .from('apprentice_documents')
      .select('*')
      .eq('id', docId)
      .eq('student_id', user.id)
      .maybeSingle();

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Don't allow deleting approved documents
    if (doc.status === 'approved') {
      return NextResponse.json({ error: 'Cannot delete approved documents' }, { status: 400 });
    }

    // Delete from storage
    const storagePath: string | undefined = doc.file_path || doc.file_url || undefined;
    if (storagePath) {
      const pathInBucket = storagePath.startsWith('documents/') ? storagePath.slice('documents/'.length) : storagePath;
      await supabase.storage.from('documents').remove([pathInBucket]);
    }

    // Delete record from apprentice_documents
    const { error } = await supabase.from('apprentice_documents').delete().eq('id', docId);

    if (error) {
      logger.error('[Documents API] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }

    // Audit: log document deletion
    await auditLog({
      actorId: user.id,
      actorRole: 'student',
      action: AuditAction.DOCUMENT_DELETED,
      entity: AuditEntity.DOCUMENT,
      entityId: docId,
      metadata: {
        document_type: doc.document_type,
        reason: 'user_initiated',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[Documents API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/apprentice/documents', _GET);
export const POST = withApiAudit('/api/apprentice/documents', _POST);
export const DELETE = withApiAudit('/api/apprentice/documents', _DELETE);
