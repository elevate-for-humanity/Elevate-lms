import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { MessageSquare, Send, Clock, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Messages | Program Holder Portal',
  robots: { index: false, follow: false },
};

export default async function PortalMessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/program-holder/portal/messages');

  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!['program_holder', 'admin', 'super_admin', 'instructor'].includes(profile?.role ?? ''))
    redirect('/portals');

  const [{ data: conversations, count: convCount }, { data: recentMessages, count: unreadCount }] =
    await Promise.all([
      db
        .from('conversations')
        .select('id, created_at, updated_at', { count: 'exact' })
        .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
        .order('updated_at', { ascending: false })
        .limit(10),
      db
        .from('messages')
        .select('id, content, created_at, sender_id, read_at', { count: 'exact' })
        .eq('recipient_id', user.id)
        .is('read_at', null)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-0.5">
            Program Holder Portal
          </p>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Messages
            {(unreadCount ?? 0) > 0 && (
              <span className="rounded-full bg-red-500 text-white text-xs font-bold px-2 py-0.5">
                {unreadCount}
              </span>
            )}
          </h1>
        </div>
        <Link
          href="/program-holder/portal"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          ← Portal
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid sm:grid-cols-2 gap-5 mb-8">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <MessageSquare className="w-5 h-5 text-blue-500 mb-3" />
            <p className="text-2xl font-extrabold text-slate-900">{convCount ?? 0}</p>
            <p className="text-sm text-slate-500 mt-0.5">Conversations</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <Send className="w-5 h-5 text-red-500 mb-3" />
            <p className="text-2xl font-extrabold text-slate-900">{unreadCount ?? 0}</p>
            <p className="text-sm text-slate-500 mt-0.5">Unread Messages</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 mb-6">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Unread Messages</h2>
          </div>
          {!recentMessages?.length ? (
            <div className="px-6 py-12 text-center text-slate-400 text-sm">No unread messages.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentMessages.map((m: any) => (
                <div key={m.id} className="flex items-start gap-4 px-6 py-4">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 line-clamp-2">{m.content}</p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(m.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Recent Conversations</h2>
          </div>
          {!conversations?.length ? (
            <div className="px-6 py-12 text-center text-slate-400 text-sm">
              No conversations yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {conversations.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between px-6 py-3">
                  <p className="text-xs text-slate-400">
                    {new Date(c.updated_at ?? c.created_at).toLocaleDateString()}
                  </p>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
