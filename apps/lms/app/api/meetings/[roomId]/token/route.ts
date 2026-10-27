// pre-auth-registry: exempt - the authenticated user must be an explicit room participant.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createMeetingToken } from '@/lib/communications/livekit';
import { hydrateProcessEnv } from '@/lib/secrets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const { roomId } = await params;
  const db = await requireAdminClient();
  const { data: participant } = await db
    .from('communication_room_participants')
    .select('id,display_name,role,communication_rooms!inner(room_key,status,allow_screen_share)')
    .eq('room_id', roomId)
    .eq('profile_id', user.id)
    .maybeSingle();
  const room = Array.isArray(participant?.communication_rooms)
    ? participant.communication_rooms[0]
    : participant?.communication_rooms;
  if (!participant || !room || room.status === 'cancelled' || room.status === 'ended') {
    return NextResponse.json({ error: 'Meeting is unavailable.' }, { status: 403 });
  }

  await hydrateProcessEnv();
  try {
    return NextResponse.json(
      await createMeetingToken({
        roomName: room.room_key,
        identity: user.id,
        displayName: participant.display_name || user.email || 'Student',
        canPublish: participant.role !== 'viewer',
        canShare: room.allow_screen_share && participant.role !== 'viewer',
      }),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Meeting service unavailable.' },
      { status: 503 },
    );
  }
}
