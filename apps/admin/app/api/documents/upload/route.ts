import { internalFetch } from '@/lib/api/internal-fetch';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { withErrorHandling, APIErrors } from '@/lib/api';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { NextRequest, NextResponse } from 'next/server';
import { auditLog, AuditAction, AuditEntity } from '@/lib/logging/auditLog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const POST = withErrorHandling(async (request: NextRequest) => {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const db = await requireAdminClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw APIErrors.unauthorized();

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const rawDocumentType = formData.get('documentType') as string;
  const metadata = formData.get('metadata') as string;

  if (!file || !rawDocumentType) {
    throw APIErrors.badRequest('File and document type are required');
  }

  const docTypeMap: Record<string, string> = {
    government_id: 'photo_id',
    photo_id: 'photo_id',
    income_proof: 'other',
    residency_proof: 'other',
    selective_service: 'other',
    resume: 'other',
    school_transcript: 'school_transcript',
    certificate: 'certificate',
    out_of_state_license: 'out_of_state_license',
    shop_license: 'shop_license',
    barber_license: 'barber_license',
    ce_certificate: 'ce_certificate',
    employment_verification: 'employment_verification',
    ipla_packet: 'ipla_packet',
    coi_general_liability: 'other',
    coi_workers_comp: 'other',
    employer_mou: 'other',
    business_license: 'other',
    ein_verification: 'other',
    supervisor_designation: 'other',
    worksite_verification: 'other',
  };
  const documentType = docTypeMap[rawDocumentType] || 'other';

  const fileExt = file.name.split('.').pop()?.toLowerCase() ?? '';
  const normalizedExt = fileExt || 'bin';
  const fileName = `${user.id}/${documentType}/${Date.now()}.${normalizedExt}`;

  const { error: uploadError } = await db.storage.from('documents').upload(fileName, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) throw APIErrors.internal('Failed to upload file');

  let parsedMetadata: Record<string, unknown> = {};
  if (metadata) {
    try {
      const parsed = JSON.parse(metadata);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw APIErrors.badRequest('Metadata must be a valid JSON object');
      }
      parsedMetadata = parsed as Record<string, unknown>;
    } catch (parseError) {
      await db.storage.from('documents').remove([fileName]);
      if (parseError instanceof SyntaxError) {
        throw APIErrors.badRequest('Invalid JSON format');
      }
      throw parseError;
    }
  }

  const { data: document, error: dbError } = await supabase
    .from('documents')
    .insert({
      user_id: user.id,
      document_type: documentType,
      file_name: file.name,
      file_size: file.size,
      file_url: null,
      file_path: fileName,
      mime_type: file.type,
      status: 'pending_review',
      uploaded_by: user.id,
      metadata: { ...parsedMetadata, original_type: rawDocumentType },
    })
    .select()
    .maybeSingle();

  if (dbError || !document) {
    await db.storage.from('documents').remove([fileName]);
    throw APIErrors.internal('Failed to save document record');
  }

  await auditLog({
    actorId: user.id,
    actorRole: 'student',
    action: AuditAction.DOCUMENT_UPLOADED,
    entity: AuditEntity.DOCUMENT,
    entityId: document.id,
    metadata: {
      document_type: documentType,
      file_extension: file.name.split('.').pop() || 'unknown',
      file_size: file.size,
      mime_type: file.type,
    },
  });

  if (file.type.startsWith('image/')) {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || '';
      const ocrForm = new FormData();
      ocrForm.append('file', file);
      ocrForm.append('documentType', documentType);
      ocrForm.append('programContext', 'learner');

      const ocrRes = await internalFetch(`${siteUrl}/api/ocr/extract`, {
        method: 'POST',
        body: ocrForm,
      });

      if (ocrRes.ok) {
        const ocrData = await ocrRes.json();
        try {
          await db.from('documents').update({ ocr_text: ocrData.rawText || null }).eq('id', document.id);
        } catch {
          // OCR persistence is non-fatal.
        }
      }
    } catch {
      // Document remains available for manual review.
    }
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role === 'employer') {
      const { tryAutoActivate } = await import('@/lib/employer/check-onboarding-complete');
      await tryAutoActivate(db, user.id);
    }
  } catch {
    // Activation check is non-fatal for document upload.
  }

  return NextResponse.json({ success: true, document });
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw APIErrors.unauthorized();

  const { searchParams } = new URL(request.url);
  const documentType = searchParams.get('type');
  const status = searchParams.get('status');

  let query = supabase
    .from('documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (documentType) query = query.eq('document_type', documentType);
  if (status) query = query.eq('status', status);

  const { data: documents, error } = await query;
  if (error) throw APIErrors.internal('Failed to fetch documents');

  return NextResponse.json({ success: true, documents });
});
