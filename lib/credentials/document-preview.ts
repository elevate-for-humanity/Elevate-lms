import 'server-only';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';

export async function credentialDocumentPreview(request: Request, id: string) {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to view credential documents.' }, { status: 401 });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  const db = await requireAdminClient();
  const { data, error } = await db.from('student_credential_uploads')
    .select('user_id,storage_bucket,storage_path').eq('id', id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Document service unavailable.' }, { status: 503 });
  if (!data) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  if (data.user_id !== user.id) {
    const admin = await apiRequireAdmin(request);
    if (admin.error) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  }
  if (data.storage_bucket !== 'credential-uploads' || !data.storage_path.startsWith(`${data.user_id}/`))
    return NextResponse.json({ error: 'Document location needs administrative review.' }, { status: 409 });
  const signed = await db.storage.from('credential-uploads').createSignedUrl(data.storage_path, 60);
  if (signed.error || !signed.data?.signedUrl) return NextResponse.json({ error: 'Document preview unavailable.' }, { status: 503 });
  const response = NextResponse.redirect(signed.data.signedUrl);
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
