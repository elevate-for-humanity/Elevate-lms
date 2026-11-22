import type { Metadata } from 'next';
import Link from 'next/link';
import { EmailWorkspace } from '@/components/communications/EmailWorkspace';
import { requireRole } from '@/lib/auth/require-role';
import { COMMUNICATION_MEMBER_ROLES } from '@/lib/phone/access';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Elevate Email' };

const LMS_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'https://app.elevateforhumanity.org';

export default async function AdminEmailPage({
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
            Communications Hub
          </p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">Elevate Email</h1>
        </div>
        <div className="flex gap-2">
          {canViewDirectory ? (
            <Link
              href="/phone"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-800"
            >
              Phone & meetings
            </Link>
          ) : null}
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
      <EmailWorkspace
        initialMailboxId={params.mailboxId}
        initialThreadId={params.threadId}
        communicationLinks={canViewDirectory ? undefined : {
          phone: `${LMS_ORIGIN}/communications/phone`,
          chat: `${LMS_ORIGIN}/lms/messages`,
          calendar: `${LMS_ORIGIN}/lms/calendar`,
        }}
      />
    </main>
  );
}
