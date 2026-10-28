// pre-auth-registry: exempt - holder context and document ownership are verified before signing.
import { isHolderRecordId } from '@/lib/program-holder/testing-report';
import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireProgramHolder();
  if (ctx.mode === 'admin')
    return NextResponse.json({ error: 'Select a Program Holder.' }, { status: 403 });
  const { id } = await params;
  if (!isHolderRecordId(id))
    return NextResponse.json({ error: 'Invalid document.' }, { status: 400 });
  const { data: document, error } = await ctx.db
    .from('program_holder_documents')
    .select('file_url,storage_bucket')
    .eq('id', id)
    .eq('user_id', ctx.profile.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'Document lookup unavailable.' }, { status: 503 });
  if (!document?.file_url)
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  let path = document.file_url,
    bucket = document.storage_bucket || 'documents';
  if (/^https?:\/\//i.test(path)) {
    const project = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    let stored: URL;
    let projectOrigin: string;
    try {
      stored = new URL(path);
      projectOrigin = project ? new URL(project).origin : '';
    } catch {
      return NextResponse.json({ error: 'Invalid storage reference.' }, { status: 409 });
    }
    if (!projectOrigin || stored.origin !== projectOrigin)
      return NextResponse.json({ error: 'Document storage requires review.' }, { status: 409 });
    const match = stored.pathname.match(
      /^\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/,
    );
    if (!match) return NextResponse.json({ error: 'Invalid storage reference.' }, { status: 409 });
    bucket = match[1];
    try {
      path = decodeURIComponent(match[2]);
    } catch {
      return NextResponse.json({ error: 'Invalid storage reference.' }, { status: 409 });
    }
  }
  if (!['documents', 'provider-documents'].includes(bucket))
    return NextResponse.json({ error: 'Document storage requires review.' }, { status: 409 });
  if (path.startsWith('program-holders/') && !path.startsWith(`program-holders/${ctx.holderId}/`))
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  if (
    !path ||
    /(?:^|\/)\.\.(?:\/|$)/.test(path) ||
    path.split('').some((character: string) => character === '\\' || character.charCodeAt(0) < 32)
  )
    return NextResponse.json({ error: 'Invalid storage reference.' }, { status: 409 });
  const { data: signed, error: signingError } = await ctx.db.storage
    .from(bucket)
    .createSignedUrl(path, 60);
  if (signingError || !signed?.signedUrl)
    return NextResponse.json({ error: 'Document preview unavailable.' }, { status: 503 });
  const response = NextResponse.redirect(signed.signedUrl);
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
