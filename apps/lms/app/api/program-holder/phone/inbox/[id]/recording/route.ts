// pre-auth-registry: exempt - requireCommunicationActor and assigned_profile_id scope recording access.
import { NextResponse } from 'next/server';
import { requireCommunicationActor } from '@/lib/communications/actor';
import { loadPhoneRecording } from '@/lib/phone/recordings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireCommunicationActor();
  const { id } = await params;
  const { data: item, error } = await ctx.db.from('phone_callback_tasks')
    .select('recording_url').eq('id', id).eq('assigned_profile_id', ctx.user.id).maybeSingle();
  if (error) return new NextResponse('Recording lookup unavailable', { status: 503 });
  if (!item?.recording_url) return new NextResponse('Recording not found', { status: 404 });
  try {
    const recording = await loadPhoneRecording(item.recording_url);
    return recording;
  } catch {
    return new NextResponse('Recording unavailable', { status: 502 });
  }
}
