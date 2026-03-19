import Link from 'next/link';
import { Archive, ArrowLeft, Mail } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ArchivedMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/messages/archived');

  // Archived messages: recipient is current user, is_read = true, older than 30 days
  const { data: archived } = await supabase
    .from('messages')
    .select('id, subject, body, created_at, sender_id, profiles!messages_sender_id_fkey(full_name)')
    .eq('recipient_id', user.id)
    .eq('is_read', true)
    .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(50);

  const messages = archived ?? [];

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Messages', href: '/messages' }, { label: 'Archived' }]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/messages" className="inline-flex items-center text-slate-600 hover:text-brand-blue-600 mb-6 text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Messages
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Archive className="w-7 h-7 text-brand-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Archived Messages</h1>
          </div>
          <span className="text-slate-500 text-sm">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {messages.length === 0 ? (
            <div className="py-16 text-center">
              <Mail className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium mb-1">No archived messages</p>
              <p className="text-slate-500 text-sm">Read messages older than 30 days appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {messages.map((msg: any) => {
                const senderName = msg.profiles?.full_name ?? 'Sender';
                const preview = msg.body?.slice(0, 100) ?? '';
                return (
                  <div key={msg.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-slate-600 text-xs font-bold">{senderName.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="font-semibold text-slate-900 text-sm truncate">{senderName}</p>
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      {msg.subject && <p className="text-sm text-slate-700 font-medium truncate">{msg.subject}</p>}
                      <p className="text-xs text-slate-500 truncate mt-0.5">{preview}{msg.body?.length > 100 ? '…' : ''}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
