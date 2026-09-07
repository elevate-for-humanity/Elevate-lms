import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BYTES = 10 * 1024 * 1024;
const MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const EMPLOYER_DOCUMENT_TYPES = new Set([
  'coi_general_liability',
  'coi_workers_comp',
  'business_license',
  'ein_verification',
  'employer_mou',
  'supervisor_designation',
  'worksite_verification',
]);

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;

  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user)
    return NextResponse.json({ error: 'Sign in before uploading a document.' }, { status: 401 });

  const admin = await requireAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || !['employer', 'admin', 'super_admin', 'org_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Employer portal access is required.' }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get('file');
  const documentType = String(form.get('document_type') || form.get('documentType') || '').trim();
  if (!(file instanceof File) || !EMPLOYER_DOCUMENT_TYPES.has(documentType)) {
    return NextResponse.json(
      { error: 'Choose a required employer document and file.' },
      { status: 400 },
    );
  }
  if (file.size <= 0 || file.size > MAX_BYTES || !MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Upload a PDF, JPG, PNG, or WebP file up to 10 MB.' },
      { status: 400 },
    );
  }

  const extension =
    file.name
      .split('.')
      .pop()
      ?.replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase() || 'bin';
  const storagePath = `employers/${user.id}/${documentType}/${randomUUID()}.${extension}`;
  const { error: storageError } = await admin.storage
    .from('documents')
    .upload(storagePath, await file.arrayBuffer(), { contentType: file.type, upsert: false });
  if (storageError) {
    return NextResponse.json(
      { error: 'The protected file could not be uploaded.' },
      { status: 500 },
    );
  }

  const now = new Date().toISOString();
  const { data: document, error: recordError } = await admin
    .from('documents')
    .insert({
      user_id: user.id,
      document_type: documentType,
      file_name: file.name,
      file_url: storagePath,
      file_path: storagePath,
      storage_path: storagePath,
      file_size: file.size,
      file_size_bytes: file.size,
      mime_type: file.type,
      status: 'pending',
      verification_status: 'pending',
      verified: false,
      uploaded_by: user.id,
      created_at: now,
      updated_at: now,
    })
    .select('id,document_type,file_name,status,created_at')
    .single();

  if (recordError) {
    await admin.storage.from('documents').remove([storagePath]);
    return NextResponse.json({ error: 'The document record could not be saved.' }, { status: 500 });
  }

  return NextResponse.json({ document }, { status: 201 });
}
