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
  let file = form.get('file');
  const documentType = String(form.get('documentType') || '');
  let invoiceDetails: Record<string, string> | null = null;
  if (documentType === 'provider_invoice' && form.get('invoiceMode') === 'form') {
    const read = (key: string) => String(form.get(key) || '').trim();
    const fields = ['providerName', 'invoiceNumber', 'studentName', 'trainingStart', 'trainingEnd', 'serviceDescription', 'amount'] as const;
    invoiceDetails = Object.fromEntries(fields.map(key => [key, read(key)]));
    const amount = read('amount');
    const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
    if (fields.some(key => !read(key) || read(key).length > (key === 'serviceDescription' ? 2000 : 200)) ||
        !validDate(read('trainingStart')) || !validDate(read('trainingEnd')) ||
        read('trainingEnd') < read('trainingStart') ||
        !/^\d{1,7}(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0 ||
        form.get('invoiceAttested') !== 'yes') {
      return NextResponse.json({ error: 'Complete the invoice fields, valid training dates, positive dollar amount, and certification.' }, { status: 400 });
    }
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF();
    pdf.setFontSize(18);
    pdf.text('Training invoice to Elevate for Humanity', 15, 20);
    pdf.setFontSize(11);
    let y = 32;
    const lines = [
      'Provider: ' + read('providerName'),
      'Invoice number: ' + read('invoiceNumber'),
      'Student: ' + read('studentName'),
      'Training dates: ' + read('trainingStart') + ' to ' + read('trainingEnd'),
      'Amount requested (USD): ' + Number(amount).toFixed(2),
      'Services: ' + read('serviceDescription'),
      'Certified by authenticated account: ' + ctx.user.id,
      'Submitted: ' + new Date().toISOString(),
      'Submitted for review. This invoice is not a payment confirmation.',
    ];
    for (const line of lines) {
      for (const wrapped of pdf.splitTextToSize(line, 180)) {
        if (y > 275) { pdf.addPage(); y = 20; }
        pdf.text(wrapped, 15, y); y += 6;
      }
      y += 3;
    }
    file = new File([pdf.output('arraybuffer')], 'training-invoice.pdf', { type: 'application/pdf' });
  }
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
      description: invoiceDetails
        ? JSON.stringify({ kind: 'provider_invoice', ...invoiceDetails, certified_by: ctx.user.id })
        : enrollmentId
        ? JSON.stringify({ enrollment_id: enrollmentId, kind: 'student_evidence' })
        : documentType === 'provider_invoice'
          ? 'Training invoice submitted to Elevate for payment review'
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
