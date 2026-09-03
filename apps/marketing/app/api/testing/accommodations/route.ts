import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function safeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').slice(0, 120);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const phone = String(formData.get('phone') ?? '').trim();
  const provider = String(formData.get('provider') ?? '').trim();
  const examDate = String(formData.get('examDate') ?? '').trim();
  const accommodationType = String(formData.get('accommodationType') ?? '').trim();
  const details = String(formData.get('details') ?? '').trim();
  const documentation = formData.get('documentation');

  if (!name || !email || !provider || !accommodationType || !details || !(documentation instanceof File)) {
    return NextResponse.json({ error: 'Complete all required fields and attach supporting documentation.' }, { status: 400 });
  }
  if (documentation.size <= 0 || documentation.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Documentation must be between 1 byte and 10 MB.' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(documentation.type)) {
    return NextResponse.json({ error: 'Upload a PDF, JPG, PNG, DOC, or DOCX file.' }, { status: 400 });
  }

  const db = await requireAdminClient();
  const now = new Date();
  const confirmationId = `ACQ-${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const storagePath = `accommodations/${now.getUTCFullYear()}/${confirmationId}/${safeSegment(documentation.name || 'documentation')}`;

  const { error: storageError } = await db.storage
    .from('testing-center')
    .upload(storagePath, documentation, {
      contentType: documentation.type,
      upsert: false,
    });
  if (storageError) {
    return NextResponse.json({ error: 'Supporting documentation could not be stored.' }, { status: 500 });
  }

  const { data: requestForm, error: formError } = await db
    .from('forms')
    .upsert(
      {
        slug: 'testing-accommodation-request',
        title: 'Testing Accommodation Request',
        updated_at: now.toISOString(),
      },
      { onConflict: 'slug' },
    )
    .select('id')
    .single();

  if (formError || !requestForm?.id) {
    await db.storage.from('testing-center').remove([storagePath]);
    return NextResponse.json({ error: 'Accommodation request form is unavailable.' }, { status: 500 });
  }

  const { data: { user } } = await db.auth.getUser(request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '');
  const payload = {
    confirmation_id: confirmationId,
    name,
    email,
    phone: phone || null,
    provider,
    exam_date: examDate || null,
    accommodation_type: accommodationType,
    details,
    documentation_bucket: 'testing-center',
    documentation_path: storagePath,
    documentation_name: documentation.name,
    documentation_type: documentation.type,
    status: 'submitted',
  };

  const { error: submissionError } = await db.from('form_submissions').insert({
    form_id: requestForm.id,
    user_id: user?.id ?? null,
    payload,
  });
  if (submissionError) {
    await db.storage.from('testing-center').remove([storagePath]);
    return NextResponse.json({ error: 'Accommodation request could not be recorded.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, confirmationId }, { status: 201 });
}
