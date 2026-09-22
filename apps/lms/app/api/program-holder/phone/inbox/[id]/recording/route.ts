// pre-auth-registry: exempt - requireProgramHolder and assigned_profile_id scope access to the recording.
import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireProgramHolder();
  if (ctx.mode !== 'holder') return new NextResponse('Forbidden', { status: 403 });
  const { id } = await params;
  const { data: item } = await ctx.db
    .from('phone_callback_tasks')
    .select('recording_url')
    .eq('id', id)
    .eq('assigned_profile_id', ctx.user.id)
    .maybeSingle();
  if (!item?.recording_url) return new NextResponse('Recording not found', { status: 404 });
  const source = await fetch(item.recording_url, { cache: 'no-store' });
  if (!source.ok || !source.body) return new NextResponse('Recording unavailable', { status: 502 });
  return new NextResponse(source.body, {
    headers: {
      'Content-Type': source.headers.get('content-type') || 'audio/mpeg',
      'Cache-Control': 'private, no-store, max-age=0',
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
