import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const ALLOWED_TYPES = new Set(['osha-10', 'cpr-aed', 'epa-608']);
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
  const { data: enrollment } = await db
    .from('program_enrollments')
    .select('id,program_id')
    .or(`user_id.eq.${user.id},student_id.eq.${user.id}`)
    .eq('program_slug', 'hvac-technician')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!enrollment?.program_id)
    return NextResponse.json({ error: 'An HVAC enrollment is required for this credential upload.' }, { status: 403 });

  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const path = `${user.id}/${enrollment.program_id}/${uploadType}/${randomUUID()}.${extension}`;
  const { error: storageError } = await db.storage.from('credential-uploads').upload(path, file, { contentType: file.type, upsert: false });
  if (storageError) return NextResponse.json({ error: 'The protected credential file could not be uploaded.' }, { status: 500 });

  const { data, error } = await db.from('student_credential_uploads').insert({
    user_id: user.id,
    program_id: enrollment.program_id,
    upload_type: uploadType,
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
