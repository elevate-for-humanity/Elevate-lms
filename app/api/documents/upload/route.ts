import { createClient } from '@/lib/supabase/server';
import { withErrorHandling, APIErrors } from '@/lib/api';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { NextRequest, NextResponse } from 'next/server';
import { auditLog, AuditAction, AuditEntity } from '@/lib/logging/auditLog';
// OCR processing moved to Netlify function: /.netlify/functions/ocr-extract

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const POST = withErrorHandling(async (request: NextRequest) => {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw APIErrors.unauthorized();
  }

  // Parse form data
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const rawDocumentType = formData.get('documentType') as string;
  const metadata = formData.get('metadata') as string;

  if (!file || !rawDocumentType) {
    throw APIErrors.validation('file and documentType', 'File and document type are required');
  }

  // Map frontend document types to DB-valid values
  // DB constraint: photo_id, school_transcript, certificate, out_of_state_license,
  //   shop_license, barber_license, ce_certificate, employment_verification, ipla_packet, other
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
    // Employer onboarding document types
    coi_general_liability: 'other',
    coi_workers_comp: 'other',
    employer_mou: 'other',
    business_license: 'other',
    ein_verification: 'other',
    supervisor_designation: 'other',
    worksite_verification: 'other',
  };
  const documentType = docTypeMap[rawDocumentType] || 'other';

  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw APIErrors.badRequest('File size exceeds 10MB limit', { maxSize, actualSize: file.size });
  }

  // Validate file type
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];
  if (!allowedTypes.includes(file.type)) {
    throw APIErrors.badRequest('Invalid file type. Only PDF and images are allowed', {
      allowedTypes,
      receivedType: file.type,
    });
  }

  // Generate unique file name
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${documentType}/${Date.now()}.${fileExt}`;

  // Upload to Supabase Storage (use admin client to bypass RLS)
  const { data: uploadData, error: uploadError } = await db.storage
    .from('documents')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw APIErrors.external('Supabase Storage', 'Failed to upload file');
  }

    // Bucket is private — do not use getPublicUrl().
    // Store file_path only; generate signed URLs on-demand for viewing.

  // Parse and validate metadata
  let parsedMetadata = {};
  if (metadata) {
    try {
      parsedMetadata = JSON.parse(metadata);
      if (typeof parsedMetadata !== 'object' || parsedMetadata === null || Array.isArray(parsedMetadata)) {
        throw APIErrors.validation('metadata', 'Metadata must be a valid JSON object');
      }
    } catch (parseError) {
      await db.storage.from('documents').remove([fileName]);
      if (parseError instanceof Error && parseError.name === 'SyntaxError') {
        throw APIErrors.validation('metadata', 'Invalid JSON format');
      }
      throw parseError;
    }
  }

  // Save document record to database
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
    .single();

  if (dbError) {
    // Clean up uploaded file
    await db.storage.from('documents').remove([fileName]);
    throw APIErrors.database('Failed to save document record');
  }

  // Audit log: document uploaded
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

  // Document processing moved to Netlify function
  // Call /.netlify/functions/ocr-extract for OCR if needed

  // Check if this upload completes employer onboarding
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'employer') {
      const { tryAutoActivate } = await import('@/lib/employer/check-onboarding-complete');
      await tryAutoActivate(db, user.id);
    }
  } catch {
    // Non-fatal — don't block document upload if activation check fails
  }

  return NextResponse.json({
    success: true,
    document,
  });
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw APIErrors.unauthorized();
  }

  // Get query parameters
  const { searchParams } = new URL(request.url);
  const documentType = searchParams.get('type');
  const status = searchParams.get('status');

  // Build query
  let query = supabase
    .from('documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (documentType) {
    query = query.eq('document_type', documentType);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data: documents, error } = await query;

  if (error) {
    throw APIErrors.database('Failed to fetch documents');
  }

  return NextResponse.json({
    success: true,
    documents,
  });
});
