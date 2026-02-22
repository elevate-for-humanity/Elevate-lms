import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withErrorHandling, APIErrors } from '@/lib/api';
import { NextRequest, NextResponse } from 'next/server';
import { auditLog, AuditAction, AuditEntity } from '@/lib/logging/auditLog';
// OCR processing moved to Netlify function: /.netlify/functions/ocr-extract

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

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
  const documentType = formData.get('documentType') as string;
  const metadata = formData.get('metadata') as string;

  if (!file || !documentType) {
    throw APIErrors.validation('file and documentType', 'File and document type are required');
  }

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

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw APIErrors.external('Supabase Storage', 'Failed to upload file');
  }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('documents').getPublicUrl(fileName);

  // Parse and validate metadata
  let parsedMetadata = {};
  if (metadata) {
    try {
      parsedMetadata = JSON.parse(metadata);
      if (typeof parsedMetadata !== 'object' || parsedMetadata === null || Array.isArray(parsedMetadata)) {
        throw APIErrors.validation('metadata', 'Metadata must be a valid JSON object');
      }
    } catch (parseError) {
      await supabase.storage.from('documents').remove([fileName]);
      if (parseError instanceof Error && parseError.name === 'SyntaxError') {
        throw APIErrors.validation('metadata', 'Invalid JSON format');
      }
      throw parseError;
    }
  }

  // Save document record to database
  const { data: document, error: dbError } = await db
    .from('documents')
    .insert({
      user_id: user.id,
      document_type: documentType,
      file_name: file.name,
      file_size: file.size,
      file_url: publicUrl,
      mime_type: file.type,
      status: 'pending',
      uploaded_by: user.id,
      metadata: parsedMetadata,
    })
    .select()
    .single();

  if (dbError) {
    // Clean up uploaded file
    await supabase.storage.from('documents').remove([fileName]);
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
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
    },
  });

  // Document processing moved to Netlify function
  // Call /.netlify/functions/ocr-extract for OCR if needed

  return NextResponse.json({
    success: true,
    document,
  });
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

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
  let query = db
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
