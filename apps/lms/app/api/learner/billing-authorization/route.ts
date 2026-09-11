import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const ALLOWED = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const form = await request.formData();
  const authorizationId = String(form.get('authorization_id') || '');
  const file = form.get('file');
  if (!authorizationId || !(file instanceof File))
    return NextResponse.json(
      { error: 'Authorization request and document are required.' },
      { status: 400 },
    );
  if (!ALLOWED.has(file.type) || file.size > 10 * 1024 * 1024)
    return NextResponse.json(
      { error: 'Use a PDF, JPG, PNG, or WebP file up to 10 MB.' },
      { status: 400 },
    );
  const db = await requireAdminClient();
  const { data: authorization, error: lookupError } = await db
    .from('billing_migration_authorizations')
    .select('id,status,document_path')
    .eq('id', authorizationId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (lookupError || !authorization)
    return NextResponse.json({ error: 'Authorization request not found.' }, { status: 404 });
  if (authorization.status === 'approved' || authorization.status === 'superseded')
    return NextResponse.json({ error: 'This authorization is locked.' }, { status: 409 });
  const extension =
    file.name
      .split('.')
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, '') || 'bin';
  const path = `${user.id}/billing-authorizations/${authorization.id}/${crypto.randomUUID()}.${extension}`;
  const uploaded = await db.storage
    .from('documents')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploaded.error)
    return NextResponse.json({ error: 'Authorization document upload failed.' }, { status: 500 });
  const saved = await db
    .from('billing_migration_authorizations')
    .update({
      document_path: path,
      document_name: file.name.slice(0, 255),
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      rejection_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', authorization.id)
    .eq('user_id', user.id)
    .in('status', ['requested', 'submitted', 'rejected']);
  if (saved.error) {
    await db.storage.from('documents').remove([path]);
    return NextResponse.json(
      { error: 'Authorization record could not be saved.' },
      { status: 500 },
    );
  }
  if (authorization.document_path)
    await db.storage.from('documents').remove([authorization.document_path]);
  return NextResponse.json({ ok: true, status: 'submitted' });
}
