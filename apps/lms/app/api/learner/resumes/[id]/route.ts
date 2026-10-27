import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to download your resume.' }, { status: 401 });
  const { id } = await params;
  const db = await requireAdminClient();
  const { data, error } = await db.from('documents').select('file_name,file_path')
    .eq('id', id).eq('user_id', user.id).contains('metadata', { original_type: 'resume' }).maybeSingle();
  if (error) return NextResponse.json({ error: 'Resume service unavailable.' }, { status: 503 });
  if (!data?.file_path) return NextResponse.json({ error: 'Resume not found.' }, { status: 404 });
  const result = await db.storage.from('documents').createSignedUrl(data.file_path, 60, { download: data.file_name });
  if (result.error || !result.data?.signedUrl) return NextResponse.json({ error: 'Download unavailable.' }, { status: 503 });
  return NextResponse.redirect(result.data.signedUrl);
}
