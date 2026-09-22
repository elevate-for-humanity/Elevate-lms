import Link from 'next/link';
import { Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import {
  selectPrimaryMailbox,
  type CommunicationMailboxKind,
} from '@/lib/email/communication-email';

export async function EmailAccountNotice({ href }: { href: string }) {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;

  const { data } = await db
    .from('communication_email_mailbox_members')
    .select(
      'mailbox:communication_email_mailboxes!inner(id,address,display_name,mailbox_kind,active)',
    )
    .eq('user_id', user.id)
    .eq('mailbox.active', true);
  const mailboxes = (data ?? [])
    .map((row: any) => (Array.isArray(row.mailbox) ? row.mailbox[0] : row.mailbox))
    .filter(Boolean)
    .map((mailbox: any) => ({
      id: String(mailbox.id),
      address: String(mailbox.address),
      displayName: String(mailbox.display_name),
      mailboxKind: mailbox.mailbox_kind as CommunicationMailboxKind,
    }));
  const mailbox = selectPrimaryMailbox(mailboxes);
  if (!mailbox) return null;

  return (
    <section className="rounded-2xl border border-cyan-300 bg-gradient-to-r from-cyan-50 to-blue-50 p-4 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white">
          <Mail className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
            Your Elevate email is ready
          </p>
          <p className="mt-1 font-black text-slate-950">{mailbox.address}</p>
          <p className="mt-1 text-sm font-medium text-slate-700">
            Inbox, compose, replies, and attachments are available in the Communications Hub.
          </p>
        </div>
      </div>
      <Link
        href={href}
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-black text-white sm:mt-0"
      >
        Open Email
      </Link>
    </section>
  );
}
