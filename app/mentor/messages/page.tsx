import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { MessageSquare, Clock, User } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Messages | Mentor Portal | Elevate For Humanity',
  description: 'View and respond to messages from your mentees.',
};

export default async function MentorMessagesPage() {
  const auth = await requireRole(['mentor', 'admin', 'super_admin', 'staff']);
  const supabase = await createClient();

  const { data: messages } = await supabase
    .from('messages')
    .select('id, subject, body, created_at, read_at, sender_id, profiles:sender_id(full_name, avatar_url)')
    .eq('recipient_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const allMessages = messages || [];
  const unread = allMessages.filter((m: any) => !m.read_at);
  const read = allMessages.filter((m: any) => m.read_at);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-slate-500 text-sm mt-1">
            {unread.length > 0 ? `${unread.length} unread` : 'All caught up'}
          </p>
        </div>
        <Link href="/mentor/dashboard" className="text-sm text-slate-500 hover:text-slate-700">
          ← Dashboard
        </Link>
      </div>

      {allMessages.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No messages yet</p>
          <p className="text-slate-400 text-sm mt-1">Messages from your mentees will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {unread.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Unread</h2>
              <div className="space-y-2">
                {unread.map((msg: any) => <MessageRow key={msg.id} msg={msg} unread />)}
              </div>
            </section>
          )}
          {read.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Read</h2>
              <div className="space-y-2">
                {read.map((msg: any) => <MessageRow key={msg.id} msg={msg} unread={false} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function MessageRow({ msg, unread }: { msg: any; unread: boolean }) {
  const sender = Array.isArray(msg.profiles) ? msg.profiles[0] : msg.profiles;
  const name = sender?.full_name ?? 'Unknown';
  const date = new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl border ${unread ? 'bg-blue-50 border-blue-100' : 'bg-white border-slate-100'}`}>
      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
        {sender?.avatar_url
          ? <img src={sender.avatar_url} alt={name} className="w-9 h-9 rounded-full object-cover" />
          : <User className="w-4 h-4 text-slate-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-semibold truncate ${unread ? 'text-slate-900' : 'text-slate-700'}`}>{name}</p>
          <span className="text-xs text-slate-400 flex items-center gap-1 flex-shrink-0">
            <Clock className="w-3 h-3" /> {date}
          </span>
        </div>
        {msg.subject && <p className={`text-sm truncate mt-0.5 ${unread ? 'font-medium text-slate-800' : 'text-slate-600'}`}>{msg.subject}</p>}
        <p className="text-sm text-slate-500 truncate mt-0.5">{msg.body}</p>
      </div>
      {unread && <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-2" />}
    </div>
  );
}
