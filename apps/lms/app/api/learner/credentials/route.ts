import { validateDocument } from '@/lib/uploads/document-validation';
import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const ALLOWED_TYPES = new Set(['prerequisite', 'exam_result']);
const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const form = await request.formData();
  const uploadType = String(form.get('upload_type') || '');
  const file = form.get('file');
  if (!ALLOWED_TYPES.has(uploadType) || !(file instanceof File))
    return NextResponse.json({ error: 'Choose a supported credential and file.' }, { status: 400 });
  if (!ALLOWED_MIME.has(file.type) || file.size <= 0 || file.size > MAX_BYTES)
    return NextResponse.json({ error: 'Use a PDF, JPG, PNG, or WebP file up to 10 MB.' }, { status: 400 });

  const db = await requireAdminClient();
  const programId = String(form.get('program_id') || '');
  if (!/^[0-9a-f-]{36}$/i.test(programId))
    return NextResponse.json({ error: 'Choose one of your enrolled programs.' }, { status: 400 });
  const { data: enrollment, error: enrollmentError } = await db
    .from('program_enrollments')
    .select('id,program_id')
    .or(`user_id.eq.${user.id},student_id.eq.${user.id}`)
    .eq('program_id', programId)
    .is('revoked_at', null)
    .limit(1)
    .maybeSingle();
  if (enrollmentError) return NextResponse.json({ error: 'Enrollment could not be verified.' }, { status: 503 });
  if (!enrollment?.program_id)
    return NextResponse.json({ error: 'An active enrollment in the selected program is required.' }, { status: 403 });

  const credentialId = String(form.get('credential_id') || '');
  if (credentialId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(credentialId))
    return NextResponse.json({ error: 'Invalid credential selection.' }, { status: 400 });
  if (credentialId) {
    const { data: credential, error: credentialError } = await db.from('credential_registry')
      .select('id').eq('id', credentialId).maybeSingle();
    if (credentialError || !credential) return NextResponse.json({error:'Credential is not in the approved catalog.'},{status:400});
  }
  const validated = await validateDocument(file, 'credential');
  if (validated.error || !validated.extension) return NextResponse.json({ error: validated.error }, { status: 400 });
  const extension = validated.extension;
  const path = `${user.id}/${enrollment.program_id}/${uploadType}/${randomUUID()}.${extension}`;
  const { error: storageError } = await db.storage.from('credential-uploads').upload(path, file, { contentType: file.type, upsert: false });
  if (storageError) return NextResponse.json({ error: 'The protected credential file could not be uploaded.' }, { status: 500 });

  const { data, error } = await db.from('student_credential_uploads').insert({
    user_id: user.id,
    program_id: enrollment.program_id,
    upload_type: uploadType,
    credential_id: credentialId || null,
    storage_bucket: 'credential-uploads',
    storage_path: path,
    original_filename: file.name,
    verification_status: 'pending',
  }).select('id,upload_type,verification_status,created_at').single();
  if (error) {
    await db.storage.from('credential-uploads').remove([path]);
    return NextResponse.json({ error: 'The credential record could not be saved.' }, { status: 500 });
  }
  return NextResponse.json({ upload: data }, { status: 201 });
}
