import Link from 'next/link';
import { EmailWorkspace } from '@/components/communications/EmailWorkspace';
import { requireRole } from '@/lib/auth/require-role';
import { COMMUNICATION_MEMBER_ROLES } from '@/lib/phone/access';

export const dynamic = 'force-dynamic';

export default async function ElevateMailPage({
  searchParams,
}: {
  searchParams: Promise<{ threadId?: string; mailboxId?: string }>;
}) {
  const params = await searchParams;
  const { effectiveRoles } = await requireRole(COMMUNICATION_MEMBER_ROLES);
  const canViewDirectory = effectiveRoles.some((role) => ['admin', 'super_admin'].includes(role));
  return (
    <main className="space-y-5 bg-slate-50 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-orange-600">
            Interoffice Email
          </p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">Elevate Mail</h1>
        </div>
        {canViewDirectory ? (
          <Link
            href="/mail/accounts"
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white"
          >
            Email accounts
          </Link>
        ) : null}
      </div>
      <EmailWorkspace
        initialMailboxId={params.mailboxId}
        initialThreadId={params.threadId}
        communicationLinks={null}
      />
    </main>
  );
}
