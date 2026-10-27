// pre-auth-registry: exempt - holder context and document ownership are verified before signing.
import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireProgramHolder();
  if (ctx.mode === 'admin') return NextResponse.json({ error: 'Select a Program Holder.' }, { status: 403 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid document.' }, { status: 400 });
  const { data: document, error } = await ctx.db.from('program_holder_documents').select('file_url,storage_bucket').eq('id', id).eq('user_id', ctx.profile.id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Document lookup unavailable.' }, { status: 503 });
  if (!document?.file_url) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  let path = document.file_url, bucket = document.storage_bucket || 'documents';
  if (/^https?:\/\//i.test(path)) {
    const stored = new URL(path), project = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    if (!project || stored.origin !== new URL(project).origin) return NextResponse.json({ error: 'Document storage requires review.' }, { status: 409 });
    const match = stored.pathname.match(/^\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/);
    if (!match) return NextResponse.json({ error: 'Invalid storage reference.' }, { status: 409 });
    bucket = match[1]; path = decodeURIComponent(match[2]);
  }
  const { data: signed, error: signingError } = await ctx.db.storage.from(bucket).createSignedUrl(path, 60);
  if (signingError || !signed?.signedUrl) return NextResponse.json({ error: 'Document preview unavailable.' }, { status: 503 });
  const response = NextResponse.redirect(signed.signedUrl);
  response.headers.set('Cache-Control', 'private, no-store'); response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
