import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { ArrowLeft, Send, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Conversation | Elevate LMS', robots: { index: false, follow: false } };

async function sendMessage(formData: FormData) {
  'use server';
  const recipientId = String(formData.get('recipient_id') ?? '');
  const content = String(formData.get('content') ?? '').trim();
  if (!recipientId || !content || content.length > 5000) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/lms/messages/${recipientId}`);
  if (recipientId === user.id) return;

  const { data: recipient } = await supabase
    .from('profiles')
    .select('id,community_visible,community_allow_messages')
    .eq('id', recipientId)
    .maybeSingle();

  const { data: prior } = await supabase
    .from('messages')
    .select('id')
    .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
    .limit(1);

  const existingConversation = !!prior?.length;
  if (!recipient || (!existingConversation && (!recipient.community_visible || !recipient.community_allow_messages))) return;

  const { error } = await supabase.from('messages').insert({ sender_id: user.id, recipient_id: recipientId, content });
  if (error) return;

  revalidatePath(`/lms/messages/${recipientId}`);
  revalidatePath('/lms/messages');
  redirect(`/lms/messages/${recipientId}`);
}

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/lms/messages/${id}`);
  if (id === user.id) redirect('/lms/messages');

  const { data: participant } = await supabase
    .from('profiles')
    .select('id,full_name,avatar_url,community_visible,community_allow_messages')
    .eq('id', id)
    .maybeSingle();

  const { data: rows } = await supabase
    .from('messages')
    .select('id,sender_id,recipient_id,content,created_at,read_at')
    .or(`and(sender_id.eq.${user.id},recipient_id.eq.${id}),and(sender_id.eq.${id},recipient_id.eq.${user.id})`)
    .order('created_at', { ascending: true })
    .limit(250);

  const messages = rows ?? [];
  const existingConversation = messages.length > 0;
  const mayStart = !!participant && participant.community_visible && participant.community_allow_messages;
  if (!existingConversation && !mayStart) {
    return <main className="mx-auto max-w-3xl px-4 py-8"><Link href="/lms/messages" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600"><ArrowLeft className="h-4 w-4" />Messages</Link><div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-600">This member is not accepting new community messages.</div></main>;
  }

  const unreadIds = messages.filter((m: any) => m.recipient_id === user.id && !m.read_at).map((m: any) => m.id);
  if (unreadIds.length) await supabase.from('messages').update({ read_at: new Date().toISOString() }).in('id', unreadIds).eq('recipient_id', user.id);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col px-4 py-6 md:px-6">
      <header className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <Link href="/lms/messages" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Back to messages"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-slate-100">{participant?.avatar_url ? <img src={participant.avatar_url} alt="" className="h-full w-full object-cover" /> : <User className="h-5 w-5 text-slate-400" />}</div>
        <div><h1 className="font-black text-slate-900">{participant?.full_name ?? 'Elevate Member'}</h1><p className="text-xs text-slate-500">Private Elevate conversation</p></div>
      </header>

      <section className="flex-1 space-y-3 overflow-y-auto py-6">
        {!messages.length && <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">Start the conversation. Messages stay inside your authenticated Elevate account.</div>}
        {messages.map((message: any) => {
          const mine = message.sender_id === user.id;
          return <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 ${mine ? 'bg-brand-blue-600 text-white' : 'bg-slate-100 text-slate-900'}`}><p className="whitespace-pre-wrap break-words text-sm">{message.content}</p><p className={`mt-1 text-[11px] ${mine ? 'text-blue-100' : 'text-slate-500'}`}>{new Date(message.created_at).toLocaleString()}</p></div></div>;
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
