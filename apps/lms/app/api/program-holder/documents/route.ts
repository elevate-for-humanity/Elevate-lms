// pre-auth-registry: exempt - requireProgramHolder verifies the authenticated user and active holder relationship before any protected document write.
import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { HVAC_PROGRAM_HOLDER_REQUIRED_DOCUMENTS } from '@/lib/program-holder/onboarding-readiness';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'video/mp4']);
const DOCUMENT_TYPES = new Set(HVAC_PROGRAM_HOLDER_REQUIRED_DOCUMENTS.map((item) => item.type));

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;
  const ctx = await requireProgramHolder();
  if (ctx.mode !== 'holder')
    return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });

  const form = await request.formData();
  const file = form.get('file');
  const documentType = String(form.get('documentType') || '');
  if (!(file instanceof File) || !DOCUMENT_TYPES.has(documentType as any))
    return NextResponse.json({ error: 'Choose a required document and file.' }, { status: 400 });
  const maxBytes = file.type === 'video/mp4' ? MAX_VIDEO_BYTES : MAX_BYTES;
  if (!MIME_TYPES.has(file.type) || file.size <= 0 || file.size > maxBytes)
    return NextResponse.json(
      { error: 'Upload a PDF, JPG, or PNG up to 10 MB, or an MP4 video up to 50 MB.' },
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
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });
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
      file_size: file.size,
      mime_type: file.type,
      description: 'Submitted through protected Program Holder onboarding',
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
