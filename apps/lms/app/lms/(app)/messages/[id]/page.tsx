import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { ArrowLeft, Send, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Conversation | Elevate LMS', robots: { index: false, follow: false } };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type ConversationMessage = { id: string; sender_id: string; recipient_id: string; content: string | null; body: string | null; created_at: string; read_at: string | null };

async function sendMessage(formData: FormData) {
  'use server';
  const recipientId = String(formData.get('recipient_id') ?? '');
  const content = String(formData.get('content') ?? '').trim();
  if (!UUID_RE.test(recipientId) || !content || content.length > 5000) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/lms/messages/${recipientId}`);
  if (recipientId === user.id) return;

  // The database INSERT policy calls can_start_community_message(), so a forged
  // client request cannot bypass visibility/contact rules.
  const { error } = await supabase.from('messages').insert({ sender_id: user.id, recipient_id: recipientId, content });
  if (error) return;

  revalidatePath(`/lms/messages/${recipientId}`);
  revalidatePath('/lms/messages');
  redirect(`/lms/messages/${recipientId}`);
}

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) redirect('/lms/messages');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/lms/messages/${id}`);
  if (id === user.id) redirect('/lms/messages');

  const [{ data: memberRows, error: memberError }, { data: rows, error: messageError }] = await Promise.all([
    supabase.rpc('get_community_member', { p_member_id: id }),
    supabase
      .from('messages')
      .select('id,sender_id,recipient_id,content,body,created_at,read_at')
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${id}),and(sender_id.eq.${id},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: false })
      .limit(250),
  ]);

  const participant = memberRows?.[0] ?? null;
  // Bound the database read to recent messages, then display that window oldest
  // first. Limiting an ascending query hides every new reply after message 250.
  const messages = [...((rows ?? []) as ConversationMessage[])].reverse();
  const existingConversation = messages.length > 0;

  if (messageError || (!existingConversation && memberError)) {
    return <main className="mx-auto max-w-3xl px-4 py-8"><Link href="/lms/messages" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600"><ArrowLeft className="h-4 w-4" />Messages</Link><div role="alert" className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center"><h1 className="font-bold text-slate-900">Conversation is temporarily unavailable</h1><p className="mt-2 text-slate-600">We could not load this conversation. Please try again.</p><Link href={`/lms/messages/${id}`} className="mt-4 inline-flex font-bold text-brand-blue-600 underline">Retry</Link></div></main>;
  }

  // An existing conversation remains readable even if a member later leaves the
  // directory. Starting a new conversation requires the safe contact policy.
  if (!existingConversation && !participant?.community_allow_messages) {
    return <main className="mx-auto max-w-3xl px-4 py-8"><Link href="/lms/messages" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600"><ArrowLeft className="h-4 w-4" />Messages</Link><div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-600">This member is not accepting new community messages.</div></main>;
  }

  const { error: readError } = await supabase.rpc('mark_community_messages_read', { p_other_user: id });

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col px-4 py-6 md:px-6">
      <header className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <Link href="/lms/messages" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Back to messages"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-slate-100">{participant?.avatar_url ? <img src={participant.avatar_url} alt="" className="h-full w-full object-cover" /> : <User className="h-5 w-5 text-slate-400" />}</div>
        <div><h1 className="font-black text-slate-900">{participant?.full_name ?? 'Elevate Member'}</h1><p className="text-xs text-slate-500">Private Elevate conversation</p></div>
      </header>

      {memberError && <p role="alert" className="mt-4 text-sm text-amber-800">Member details are temporarily unavailable. Your conversation is shown below.</p>}
      {readError && <p role="alert" className="mt-4 text-sm text-amber-800">Your messages could not be marked as read. <Link href={`/lms/messages/${id}`} className="font-bold underline">Retry</Link></p>}

      <section className="flex-1 space-y-3 overflow-y-auto py-6">
        {messages.length === 250 && <p className="text-center text-xs text-slate-500">Showing the latest 250 messages.</p>}
        {!messages.length && <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">Start the conversation. Messages stay inside your authenticated Elevate account.</div>}
        {messages.map((message) => {
          const mine = message.sender_id === user.id;
          return <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 ${mine ? 'bg-brand-blue-600 text-white' : 'bg-slate-100 text-slate-900'}`}><p className="whitespace-pre-wrap break-words text-sm">{message.content || message.body}</p><p className={`mt-1 text-[11px] ${mine ? 'text-blue-100' : 'text-slate-500'}`}>{new Date(message.created_at).toLocaleString()}</p></div></div>;
        })}
      </section>

      <form action={sendMessage} className="sticky bottom-0 flex gap-2 border-t border-slate-200 bg-white py-4">
        <input type="hidden" name="recipient_id" value={id} />
        <textarea name="content" required maxLength={5000} rows={2} placeholder="Write a message…" className="min-w-0 flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-blue-500" />
        <button type="submit" className="inline-flex items-center gap-2 self-end rounded-xl bg-brand-blue-600 px-5 py-3 font-bold text-white hover:bg-brand-blue-700"><Send className="h-4 w-4" />Send</button>
      </form>
    </main>
  );
}
