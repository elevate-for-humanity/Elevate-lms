// pre-auth-registry: exempt - requireProgramHolder verifies the authenticated user and active holder relationship before any protected document write.
import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { isHolderRecordId } from '@/lib/program-holder/testing-report';
import { materialUploadPolicy } from '@/lib/program-holder/material-upload';
import {
  CORE_PROGRAM_HOLDER_REQUIRED_DOCUMENTS,
  HVAC_PROGRAM_HOLDER_REQUIRED_DOCUMENTS,
} from '@/lib/program-holder/onboarding-readiness';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'video/mp4']);
const DOCUMENT_TYPES = new Set([
  ...CORE_PROGRAM_HOLDER_REQUIRED_DOCUMENTS.map((item) => item.type),
  ...HVAC_PROGRAM_HOLDER_REQUIRED_DOCUMENTS.map((item) => item.type),
  'company_logo',
  'profile_photo',
  'lab_tracker',
  'textbook',
  'testing_evidence',
  'provider_invoice',
]);

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;
  const ctx = await requireProgramHolder();
  if (ctx.mode !== 'holder')
    return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Submit a valid file upload.' }, { status: 400 });
  const file = form.get('file');
  const documentType = String(form.get('documentType') || '');
  if (!(file instanceof File) || !DOCUMENT_TYPES.has(documentType as any))
    return NextResponse.json({ error: 'Choose a required document and file.' }, { status: 400 });
  if (
    documentType === 'testing_evidence' &&
    !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)
  )
    return NextResponse.json(
      { error: 'Upload testing evidence as a PDF, JPG, or PNG.' },
      { status: 400 },
    );
  if (documentType === 'profile_photo' && !['image/jpeg', 'image/png'].includes(file.type))
    return NextResponse.json({ error: 'Upload a JPG or PNG profile picture.' }, { status: 400 });
  if (documentType === 'provider_invoice') {
    const holder = await ctx.db
      .from('program_holders')
      .select('organization_name')
      .eq('id', ctx.holderId)
      .maybeSingle();
    if (holder.error || holder.data?.organization_name !== 'The CDL Academy')
      return NextResponse.json(
        { error: 'Training invoice submission is unavailable for this account.' },
        { status: 403 },
      );
    if (file.type === 'video/mp4')
      return NextResponse.json(
        { error: 'Submit the invoice as a PDF, JPG, or PNG.' },
        { status: 400 },
      );
  }
  const enrollmentId = String(form.get('enrollmentId') || '');
  if (documentType === 'testing_evidence' && !enrollmentId)
    return NextResponse.json(
      { error: 'Select the student whose evidence you are uploading.' },
      { status: 400 },
    );
  if (enrollmentId && !isHolderRecordId(enrollmentId))
    return NextResponse.json({ error: 'Select a valid student.' }, { status: 400 });
  if (enrollmentId) {
    const { data: student, error } = await ctx.db
      .from('program_enrollments')
      .select('id,program_id')
      .eq('id', enrollmentId)
      .eq('program_holder_id', ctx.holderId)
      .is('revoked_at', null)
      .in('status', ['active', 'enrolled', 'in_progress', 'completed', 'graduated'])
      .maybeSingle();
    if (error)
      return NextResponse.json({ error: 'Student verification unavailable.' }, { status: 503 });
    if (!student || !ctx.programIds.includes(student.program_id))
      return NextResponse.json({ error: 'Student is not assigned to you.' }, { status: 403 });
  }
  const material = materialUploadPolicy(documentType, file);
  const maxBytes = file.type === 'video/mp4' ? MAX_VIDEO_BYTES : MAX_BYTES;
  if (
    material
      ? !material.allowed
      : !MIME_TYPES.has(file.type) || file.size <= 0 || file.size > maxBytes
  )
    return NextResponse.json(
      {
        error: material
          ? 'Upload an XLSX, XLS, or CSV lab tracker up to 10 MB, or a PDF or DOCX textbook up to 50 MB.'
          : 'Upload a PDF, JPG, or PNG up to 10 MB, or an MP4 video up to 50 MB.',
      },
      { status: 400 },
    );

  const extension =
    file.name
      .split('.')
      .pop()
      ?.replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase() || 'bin';
  const path = `program-holders/${ctx.holderId}/${documentType}/${randomUUID()}.${extension}`;
  const { error: storageError } = await ctx.db.storage
    .from('documents')
    .upload(path, await file.arrayBuffer(), {
      contentType: material?.contentType || file.type,
      upsert: false,
    });
  if (storageError)
    return NextResponse.json(
      { error: 'The protected file could not be uploaded.' },
      { status: 500 },
    );

  const now = new Date().toISOString();
  const { data, error } = await ctx.db
    .from('program_holder_documents')
    .insert({
      user_id: ctx.user.id,
      document_type: documentType,
      file_name: file.name,
      file_url: path,
      storage_bucket: 'documents',
      file_size: file.size,
      mime_type: material?.contentType || file.type,
      description: enrollmentId
        ? JSON.stringify({ enrollment_id: enrollmentId, kind: 'student_evidence' })
        : documentType === 'provider_invoice'
          ? 'CDL training invoice submitted to Elevate for payment review'
          : 'Submitted through protected Program Holder onboarding',
      uploaded_by: ctx.user.id,
      uploaded_at: now,
      status: 'pending',
      approved: false,
      updated_at: now,
    })
    .select('id,document_type,file_name,status,created_at')
    .single();
  if (error) {
    await ctx.db.storage.from('documents').remove([path]);
    return NextResponse.json({ error: 'The document record could not be saved.' }, { status: 500 });
  }
  return NextResponse.json({ document: data }, { status: 201 });
}
