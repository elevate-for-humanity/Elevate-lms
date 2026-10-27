import type { Metadata } from 'next';
import Link from 'next/link';
import { EmailWorkspace } from '@/components/communications/EmailWorkspace';
import { requireRole } from '@/lib/auth/require-role';
import { COMMUNICATION_MEMBER_ROLES } from '@/lib/phone/access';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Elevate Email' };

export default async function AdminEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ mailboxId?: string }>;
}) {
  const params = await searchParams;
  const { effectiveRoles } = await requireRole(COMMUNICATION_MEMBER_ROLES);
  const canViewDirectory = effectiveRoles.some((role) => ['admin', 'super_admin'].includes(role));
  return (
    <main className="space-y-5 bg-slate-50 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-orange-600">
            Communications Hub
          </p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">Elevate Email</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/phone"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-800"
          >
            Phone & meetings
          </Link>
          {canViewDirectory ? (
            <Link
              href="/phone/email/accounts"
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white"
            >
              Email accounts
            </Link>
          ) : null}
        </div>
      </div>
      <EmailWorkspace initialMailboxId={params.mailboxId} />
    </main>
  );
}
