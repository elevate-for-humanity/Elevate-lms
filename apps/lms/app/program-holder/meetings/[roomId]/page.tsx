import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProgramHolderMeetingRoom } from '@/components/program-holder/ProgramHolderMeetingRoom';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Video Meeting | Program Holder', robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ roomId: string }> }) {
  const ctx = await requireProgramHolder();
  if (ctx.mode !== 'holder') notFound();
  const { roomId } = await params;
  const { data: room } = await ctx.db
    .from('communication_rooms')
    .select('id,title,status,host_profile_id')
    .eq('id', roomId)
    .maybeSingle();
  if (!room || room.host_profile_id !== ctx.user.id || room.status === 'cancelled') notFound();
  return (
    <main className="space-y-4 bg-slate-50 p-4 sm:p-6">
      <Link href="/program-holder/meetings" className="text-sm font-bold text-indigo-700">
        ← Meetings
      </Link>
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-indigo-700">
          Secure dashboard video room
        </p>
        <h1 className="text-2xl font-black">{room.title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Use the room controls for camera, microphone, chat, and screen sharing.
        </p>
      </div>
      <ProgramHolderMeetingRoom roomId={room.id} />
    </main>
  );
}
