import type { Metadata } from 'next';
import Link from 'next/link';
import { EmailDirectory, type EmailDirectoryRow } from '@/components/communications/EmailDirectory';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Email Accounts' };

export default async function EmailAccountsPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();
  const [{ data: mailboxes }, { data: memberships }] = await Promise.all([
    db
      .from('communication_email_mailboxes')
      .select('id,address,display_name,mailbox_kind,active')
      .order('address'),
    db.from('communication_email_mailbox_members').select('mailbox_id,user_id,access_level'),
  ]);
  const userIds = Array.from(
    new Set((memberships ?? []).map((membership: any) => membership.user_id)),
  );
  const { data: profiles } = userIds.length
    ? await db.from('profiles').select('id,full_name,email').in('id', userIds)
    : { data: [] as any[] };
  const profileById = new Map((profiles ?? []).map((profile: any) => [profile.id, profile]));
  const membersByMailbox = new Map<string, string[]>();
  for (const membership of memberships ?? []) {
    const profile = profileById.get(membership.user_id) as any;
    const label = profile?.full_name || profile?.email || 'Account without profile';
    membersByMailbox.set(membership.mailbox_id, [
      ...(membersByMailbox.get(membership.mailbox_id) ?? []),
      label,
    ]);
  }
  const rows: EmailDirectoryRow[] = (mailboxes ?? []).map((mailbox: any) => ({
    id: mailbox.id,
    address: mailbox.address,
    displayName: mailbox.display_name,
    mailboxKind: mailbox.mailbox_kind,
    active: mailbox.active,
    members: membersByMailbox.get(mailbox.id) ?? [],
  }));
  return (
    <main className="space-y-5 bg-slate-50 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-orange-600">
            Communications Hub
          </p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">Email accounts</h1>
          <p className="mt-2 max-w-3xl text-sm font-medium text-slate-600">
            Active personal mailboxes are limited to operational staff. Program Holders and Host
            Shops use their organization mailbox.
          </p>
        </div>
        <Link
          href="/phone/email"
          className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white"
        >
          Open inbox
        </Link>
      </div>
      <EmailDirectory rows={rows} />
    </main>
  );
}
