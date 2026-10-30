import { PlatformShell } from '@/components/platform/PlatformShell';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import { isApprenticeWorkspaceRole } from '@/lib/navigation/navigation-config';
import { learnerCanSeeBilling } from '@/lib/billing/learner-payment-plan-visibility';

export default async function LearnerWorkspaceLayout({
  children,
  showLearnerNotices = true,
}: {
  children: React.ReactNode;
  showLearnerNotices?: boolean;
}) {
  const { user, profile } = await requireRole([
    'student',
    'learner',
    'apprentice',
    'barber_apprentice',
    'cosmetology_apprentice',
    'admin',
    'staff',
  ]);
  const supabase = await createClient();
  const { data: photoProfile } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  const db = await requireAdminClient();
  const subject = await resolvePortalPreviewSubject(db, user.id);
  const isAdmin = ['admin', 'super_admin', 'staff'].includes(String(profile?.role));
  const subjectRole = subject.previewing
    ? (await db.from('profiles').select('role').eq('id', subject.userId).maybeSingle()).data?.role
    : profile?.role;
  const apprenticeWorkspace = isApprenticeWorkspaceRole(subjectRole);
  const showBilling =
    (!isAdmin || subject.previewing) &&
    (await learnerCanSeeBilling(db, subject.userId, subjectRole));

  return (
    <PlatformShell
      user={{
        id: user.id,
        email: user.email || '',
        full_name: profile?.full_name || undefined,
        first_name: profile?.first_name || undefined,
        last_name: profile?.last_name || undefined,
        avatar_url: photoProfile?.avatar_url || undefined,
      }}
      role={apprenticeWorkspace ? 'apprentice' : 'student'}
      paris={{ autoOpenOnDashboard: false }}
    >
      {showLearnerNotices && !apprenticeWorkspace && !isAdmin && !photoProfile?.avatar_url ? (
        <div className="mx-auto mt-4 w-full max-w-7xl px-4 sm:px-6">
          <details className="rounded-xl border border-slate-200 bg-white p-3">
            <summary className="cursor-pointer text-sm font-bold text-slate-700">
              Profile reminder: add your photo
            </summary>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-800">
              Required profile to-do
            </p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-black text-amber-950">
                  Upload a clear photo of yourself
                </h2>
                <p className="mt-1 text-sm text-amber-900">
                  Your learner photo helps instructors, Host Shops, and authorized program staff
                  confirm they are working in the correct student record.
                </p>
              </div>
              <Link
                href="/lms/profile"
                className="inline-flex min-h-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-900 px-5 py-3 text-sm font-black text-white"
              >
                Upload profile photo
              </Link>
            </div>
          </details>
        </div>
      ) : null}
      {showLearnerNotices && !apprenticeWorkspace && showBilling ? (
        <section
          className="mx-auto mt-4 w-full max-w-7xl px-4 sm:px-6"
          aria-label="Your payment plan"
        >
          <details className="rounded-xl border border-slate-200 bg-white p-3">
            <summary className="cursor-pointer text-sm font-bold text-slate-700">
              Billing and payment plan
            </summary>
            <h2 className="font-bold text-slate-950">Your payment plan</h2>
            <p className="mt-1 text-sm text-slate-700">
              Review your invoices, balance, and approved payment plan.
            </p>
            <Link
              href="/lms/payments"
              className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-indigo-700 px-5 py-3 font-bold text-white"
            >
              View billing
            </Link>
          </details>
        </section>
      ) : null}
      {children}
    </PlatformShell>
  );
}
