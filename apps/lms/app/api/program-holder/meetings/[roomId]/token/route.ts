// pre-auth-registry: exempt - requireProgramHolder verifies the host before issuing a scoped room token.
import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { createMeetingToken } from '@/lib/communications/livekit';
import { hydrateProcessEnv } from '@/lib/secrets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const ctx = await requireProgramHolder();
  if (ctx.mode !== 'holder') {
    return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  }
  const { roomId } = await params;
  const { data: room } = await ctx.db
    .from('communication_rooms')
    .select('id,room_key,status,allow_screen_share,host_profile_id')
    .eq('id', roomId)
    .maybeSingle();
  const { data: participant } = room
    ? await ctx.db
        .from('communication_room_participants')
        .select('id')
        .eq('room_id', room.id)
        .eq('profile_id', ctx.user.id)
        .maybeSingle()
    : { data: null };
  if (
    !room ||
    room.status === 'cancelled' ||
    (room.host_profile_id !== ctx.user.id && !participant)
  ) {
    return NextResponse.json({ error: 'Meeting is unavailable.' }, { status: 403 });
  }
  await hydrateProcessEnv();
  try {
    return NextResponse.json(
      await createMeetingToken({
        roomName: room.room_key,
        identity: ctx.user.id,
        displayName: ctx.profile.full_name || ctx.profile.email || 'Program Holder',
        canPublish: true,
        canShare: room.allow_screen_share,
      }),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Meeting service unavailable.' },
      { status: 503 },
    );
  }
}
