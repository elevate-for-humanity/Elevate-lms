import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const TYPES = new Set([
  'government_id',
  'insurance',
  'epa_608',
  'legacy_mou_reference',
  'mou_draft',
]);
const MIMES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  const { id: holderId } = await params;
  const db = await requireAdminClient();
  const { data: holder } = await db
    .from('program_holders')
    .select('id,user_id')
    .eq('id', holderId)
    .maybeSingle();
  if (!holder?.user_id)
    return NextResponse.json({ error: 'Program Holder not found.' }, { status: 404 });

  const form = await request.formData();
  const file = form.get('file');
  const documentType = String(form.get('documentType') || '');
  if (!(file instanceof File) || !TYPES.has(documentType))
    return NextResponse.json(
      { error: 'Choose a supported document type and file.' },
      { status: 400 },
    );
  if (!MIMES.has(file.type) || file.size <= 0 || file.size > 10 * 1024 * 1024)
    return NextResponse.json(
      { error: 'Upload a PDF, JPG, or PNG no larger than 10 MB.' },
      { status: 400 },
    );

  const ext =
    file.name
      .split('.')
      .pop()
      ?.replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase() || 'bin';
  const path = `program-holders/${holderId}/${documentType}/${randomUUID()}.${ext}`;
  const { error: uploadError } = await db.storage
    .from('documents')
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: 'Protected upload failed.' }, { status: 500 });
  const now = new Date().toISOString();
  const { data, error } = await db
    .from('program_holder_documents')
    .insert({
      user_id: holder.user_id,
      document_type: documentType,
      file_name: file.name,
      file_url: path,
      file_size: file.size,
      mime_type: file.type,
      description: 'Added by an authorized administrator to the protected Program Holder file',
      uploaded_by: auth.id,
      uploaded_at: now,
      status: 'pending',
      approved: false,
      updated_at: now,
    })
    .select('id,document_type,file_name,status')
    .single();
  if (error) {
    await db.storage.from('documents').remove([path]);
    return NextResponse.json({ error: 'Document record could not be saved.' }, { status: 500 });
  }
  await db
    .from('admin_audit_events')
    .insert({
      action: 'program_holder.document_uploaded',
      actor_user_id: auth.id,
      target_type: 'program_holder',
      target_id: holderId,
      metadata: { document_id: data.id, document_type: documentType },
    });
  return NextResponse.json({ document: data }, { status: 201 });
}
