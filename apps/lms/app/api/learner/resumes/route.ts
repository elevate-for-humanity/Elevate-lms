import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { validateDocument } from '@/lib/uploads/document-validation';

export async function GET() {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to view resumes.' }, { status: 401 });
  const db = await requireAdminClient();
  const { data, error } = await db.from('documents').select('id,file_name,created_at')
    .eq('user_id', user.id).contains('metadata', { original_type: 'resume' }).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Resumes could not be loaded.' }, { status: 503 });
  return NextResponse.json({ resumes: data });
}

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'strict');
  if (limited) return limited;
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to upload a resume.' }, { status: 401 });
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Choose your resume.' }, { status: 400 });
  const validated = await validateDocument(file, 'resume');
  if (validated.error || !validated.extension) return NextResponse.json({ error: validated.error }, { status: 400 });
  const db = await requireAdminClient();
  const path = `${user.id}/resumes/${randomUUID()}.${validated.extension}`;
  const { error: storageError } = await db.storage.from('documents').upload(path, file, { contentType: file.type, upsert: false });
  if (storageError) return NextResponse.json({ error: 'Your resume could not be uploaded.' }, { status: 500 });
  const { data, error } = await db.from('documents').insert({ user_id: user.id, uploaded_by: user.id,
    document_type: 'other', file_name: file.name, file_size: file.size, mime_type: file.type,
    file_path: path, status: 'pending', verification_status: 'pending',
    metadata: { original_type: 'resume', storage_bucket: 'documents', storage_path: path },
  }).select('id,file_name,created_at').single();
  if (error) {
    await db.storage.from('documents').remove([path]);
    return NextResponse.json({ error: 'Your resume record could not be saved.' }, { status: 500 });
  }
  return NextResponse.json({ resume: data }, { status: 201 });
}
