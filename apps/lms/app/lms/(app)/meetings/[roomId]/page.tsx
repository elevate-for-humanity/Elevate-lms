import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProgramHolderMeetingRoom } from '@/components/program-holder/ProgramHolderMeetingRoom';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Video Meeting | Elevate LMS', robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ roomId: string }> }) {
  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) notFound();
  const { roomId } = await params;
  const db = await requireAdminClient();
  const { data: participant } = await db
    .from('communication_room_participants')
    .select('id,communication_rooms!inner(id,title,status)')
    .eq('room_id', roomId)
    .eq('profile_id', user.id)
    .maybeSingle();
  const room = Array.isArray(participant?.communication_rooms)
    ? participant.communication_rooms[0]
    : participant?.communication_rooms;
  if (!participant || !room || room.status === 'cancelled' || room.status === 'ended') notFound();

  return (
    <main className="space-y-4 bg-slate-50 p-4 sm:p-6">
      <Link href="/lms/dashboard" className="text-sm font-bold text-indigo-700">
        ← Student dashboard
      </Link>
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-indigo-700">
          Secure Elevate video room
        </p>
        <h1 className="text-2xl font-black">{room.title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Use the room controls for camera, microphone, chat, and screen sharing.
        </p>
      </div>
      <ProgramHolderMeetingRoom roomId={room.id} tokenEndpoint={`/api/meetings/${room.id}/token`} />
    </main>
  );
}
