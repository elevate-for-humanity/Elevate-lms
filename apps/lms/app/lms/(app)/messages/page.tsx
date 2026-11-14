import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MessageSquare, Search, Plus, User, CheckCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Messages | Elevate LMS', description: 'View and send private messages inside Elevate.' };
export const dynamic = 'force-dynamic';

type InboxMessage = { id: string; sender_id: string; recipient_id: string; content: string | null; body: string | null; created_at: string; read_at: string | null };
type CommunityMember = { id: string; full_name: string | null; avatar_url: string | null };
type Conversation = { id: string; participant: CommunityMember | null; lastMessage: InboxMessage; unread: number };

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const q = params.q?.trim().toLowerCase() ?? '';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/messages');

  const { data: messageData, error: messageError } = await supabase
    .from('messages')
    .select('id,sender_id,recipient_id,content,body,created_at,read_at')
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(250);

  const convMap = new Map<string, Conversation>();
  for (const row of (messageError ? [] : messageData ?? []) as InboxMessage[]) {
    const msg = { ...row, content: row.content || row.body };
    const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
    if (!otherId) continue;
    if (!convMap.has(otherId)) convMap.set(otherId, { id: otherId, participant: null, lastMessage: msg, unread: 0 });
    if (msg.recipient_id === user.id && !msg.read_at) convMap.get(otherId)!.unread += 1;
  }

  // Message foreign keys reference auth.users, not profiles. Resolve only safe,
  // tenant-scoped member fields through the same RPC used by conversations.
  // Private members remain unnamed; keep lookups bounded for large inboxes.
  let memberLookupFailed = false;
  const participantIds = [...convMap.keys()];
  for (let offset = 0; offset < participantIds.length; offset += 8) {
    await Promise.all(participantIds.slice(offset, offset + 8).map(async (id) => {
      const { data, error } = await supabase.rpc('get_community_member', { p_member_id: id });
      if (error) { memberLookupFailed = true; return; }
      convMap.get(id)!.participant = (data?.[0] as CommunityMember | undefined) ?? null;
    }));
  }

  let conversations = Array.from(convMap.values());
  if (q) conversations = conversations.filter((c) => String(c.participant?.full_name ?? '').toLowerCase().includes(q) || String(c.lastMessage?.content ?? '').toLowerCase().includes(q));
  const unreadCount = conversations.reduce((sum, c) => sum + c.unread, 0);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div><p className="text-xs font-black uppercase tracking-[0.2em] text-brand-blue-600">Community</p><h1 className="mt-1 text-3xl font-black text-slate-900">Messages</h1><p className="mt-1 text-slate-600">{unreadCount ? `${unreadCount} unread message${unreadCount === 1 ? '' : 's'}` : 'Private conversations with your Elevate community.'}</p></div>
        <Link href="/lms/members" className="inline-flex items-center gap-2 rounded-xl bg-brand-blue-600 px-5 py-3 font-bold text-white hover:bg-brand-blue-700"><Plus className="h-4 w-4" />New message</Link>
      </div>

      <form action="/lms/messages" className="mt-6 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2">
        <Search className="ml-2 h-5 w-5 text-slate-400" /><input name="q" defaultValue={params.q ?? ''} placeholder="Search conversations" className="min-w-0 flex-1 border-0 px-2 py-2 outline-none focus:ring-0" /><button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Search</button>
      </form>

      {memberLookupFailed && <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Some member names are temporarily unavailable. Your messages are shown below. <Link href="/lms/messages" className="font-bold underline">Retry</Link></p>}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {messageError ? <div role="alert" className="p-8 text-center"><h2 className="text-lg font-bold text-slate-900">Messages are temporarily unavailable</h2><p className="mt-2 text-sm text-slate-600">We could not load your conversations. Please try again.</p><Link href="/lms/messages" className="mt-4 inline-flex rounded-xl bg-brand-blue-600 px-5 py-3 font-bold text-white">Retry</Link></div> : conversations.length ? <div className="divide-y divide-slate-200">{conversations.map((conv) => (
          <Link key={conv.id} href={`/lms/messages/${conv.id}`} className={`block p-4 transition hover:bg-slate-50 ${conv.unread ? 'bg-brand-blue-50/60' : ''}`}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">{conv.participant?.avatar_url ? <img src={conv.participant.avatar_url} alt="" className="h-full w-full object-cover" /> : <User className="h-5 w-5 text-slate-400" />}</div>
              <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><h2 className="truncate font-black text-slate-900">{conv.participant?.full_name ?? 'Elevate Member'}</h2><time className="flex-shrink-0 text-xs text-slate-500">{new Date(conv.lastMessage.created_at).toLocaleDateString()}</time></div><p className="mt-1 truncate text-sm text-slate-600">{conv.lastMessage.sender_id === user.id ? 'You: ' : ''}{conv.lastMessage.content}</p><div className="mt-2 flex items-center gap-2">{conv.lastMessage.sender_id === user.id && conv.lastMessage.read_at && <CheckCheck className="h-4 w-4 text-brand-blue-500" />}{conv.unread > 0 && <span className="rounded-full bg-brand-blue-600 px-2 py-0.5 text-xs font-black text-white">{conv.unread}</span>}</div></div>
            </div>
          </Link>
        ))}</div> : <div className="p-14 text-center"><MessageSquare className="mx-auto h-12 w-12 text-slate-300" /><h2 className="mt-3 text-lg font-black text-slate-900">{q ? 'No matching conversations' : 'No messages yet'}</h2><p className="mt-1 text-sm text-slate-600">Choose a visible member to start a private conversation.</p><Link href="/lms/members" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-blue-600 px-5 py-3 font-bold text-white"><Plus className="h-4 w-4" />Find members</Link></div>}
      </section>
    </main>
  );
}
