// pre-auth-registry: exempt - requireCommunicationActor and assigned_profile_id scope access to the voicemail.
import { NextResponse } from 'next/server';
import { requireCommunicationActor } from '@/lib/communications/actor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCommunicationActor();
  const { id } = await params;
  const { data: item } = await ctx.db
    .from('voicemails')
    .select('recording_url')
    .eq('id', id)
    .eq('assigned_profile_id', ctx.user.id)
    .maybeSingle();
  if (!item?.recording_url) return new NextResponse('Voicemail recording not found', { status: 404 });
  const source = await fetch(item.recording_url, { cache: 'no-store' });
  if (!source.ok || !source.body) return new NextResponse('Voicemail recording unavailable', { status: 502 });
  return new NextResponse(source.body, {
    headers: {
      'Content-Type': source.headers.get('content-type') || 'audio/mpeg',
      'Cache-Control': 'private, no-store, max-age=0',
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
