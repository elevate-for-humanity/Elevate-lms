import Link from 'next/link';
import { Inbox, Mail, Send } from 'lucide-react';
import { requireCurrentHostShopPartner } from '@/lib/partners/current-host-shop';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Messages | Host Shop Portal',
  description: 'View messages sent to or from the signed-in host-shop account.',
  robots: { index: false, follow: false },
};

export default async function HostShopMessagesPage() {
  const { user, db, partner } = await requireCurrentHostShopPartner();
  const { data: partnerUsers } = await db
    .from('partner_users')
    .select('user_id')
    .eq('partner_id', partner.id)
    .eq('status', 'active');
  const linkedAccountIds = (partnerUsers || []).map((row: any) => row.user_id).filter(Boolean);
  const accountIds = Array.from(new Set(linkedAccountIds.length ? linkedAccountIds : [user.id]));
  const accountFilter = accountIds.join(',');

  const { data: messages, error } = await db
    .from('messages')
    .select('id, sender_id, recipient_id, subject, body, read, is_read, created_at')
    .or(`sender_id.in.(${accountFilter}),recipient_id.in.(${accountFilter})`)
    .order('created_at', { ascending: false })
    .limit(50);

  const rows = messages ?? [];
  const accountIdSet = new Set(accountIds);
  const inbox = rows.filter((message) => accountIdSet.has(message.recipient_id));
  const sent = rows.filter((message) => accountIdSet.has(message.sender_id));
  const unread = inbox.filter((message) => !(message.is_read ?? message.read)).length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">{partner.name || 'Host Shop'}</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Messages</h1>
          <p className="mt-2 text-slate-600">Real messages associated with active accounts linked to this Host Shop. Demo conversations have been removed.</p>
        </div>
        <Link href="/host-shop/dashboard" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50">
          Back to dashboard
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><Inbox className="h-5 w-5 text-brand-blue-700" /><p className="mt-3 text-3xl font-black text-slate-950">{inbox.length}</p><p className="text-sm text-slate-600">Inbox</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><Mail className="h-5 w-5 text-amber-700" /><p className="mt-3 text-3xl font-black text-slate-950">{unread}</p><p className="text-sm text-slate-600">Unread</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><Send className="h-5 w-5 text-brand-green-700" /><p className="mt-3 text-3xl font-black text-slate-950">{sent.length}</p><p className="text-sm text-slate-600">Sent</p></div>
      </div>

      {error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">Message data could not be loaded. No sample conversations are being substituted.</div> : null}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6"><h2 className="font-black text-slate-950">Recent activity</h2></div>
        {rows.length === 0 ? (
          <div className="px-6 py-12 text-center"><Mail className="mx-auto h-10 w-10 text-slate-300" /><h3 className="mt-3 font-bold text-slate-900">No messages yet</h3><p className="mt-1 text-sm text-slate-500">Messages created for this account will appear here.</p></div>
        ) : (
          <div className="divide-y divide-slate-200">
            {rows.map((message) => {
              const received = accountIdSet.has(message.recipient_id);
              const isUnread = received && !(message.is_read ?? message.read);
              return (
                <article key={message.id} className="px-5 py-4 sm:px-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0"><div className="flex items-center gap-2"><span className="text-xs font-black uppercase tracking-wide text-slate-500">{received ? 'Received' : 'Sent'}</span>{isUnread ? <span className="rounded-full bg-brand-blue-100 px-2 py-0.5 text-xs font-bold text-brand-blue-800">Unread</span> : null}</div><h3 className="mt-1 font-black text-slate-950">{message.subject || 'Message'}</h3><p className="mt-1 max-w-3xl whitespace-pre-wrap text-sm text-slate-600">{message.body || 'No message body.'}</p></div>
                    <time className="whitespace-nowrap text-xs text-slate-500">{message.created_at ? new Date(message.created_at).toLocaleString() : 'Date unavailable'}</time>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
