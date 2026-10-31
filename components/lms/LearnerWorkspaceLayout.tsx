import { resolveAssignedLearnerHome } from '@/lib/portal/assigned-learner-home';
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
  const supabase = await createClient();
  const {
    data: { user: authenticatedUser },
  } = await supabase.auth.getUser();
  const db = await requireAdminClient();
  const subject = await resolvePortalPreviewSubject(db, authenticatedUser?.id);
  // Only the verified, administrator-signed handoff can render without a learner session.
  // Ordinary requests still pass the full role and membership authorization below.
  const authorized = subject.previewing
    ? null
    : await requireRole([
        'student',
        'learner',
        'apprentice',
        'barber_apprentice',
        'cosmetology_apprentice',
        'admin',
        'staff',
      ]);
  const user = authorized?.user || { id: subject.userId, email: undefined };
  const profile = authorized?.profile;
  const subjectProfile = subject.previewing
    ? (
        await db
          .from('profiles')
          .select('role,email,full_name,first_name,last_name,avatar_url')
          .eq('id', subject.userId)
          .maybeSingle()
      ).data
    : profile;
  if (!subjectProfile) throw new Error('Learner workspace profile could not be loaded.');
  const photoProfile = { avatar_url: subjectProfile.avatar_url };
  const isAdmin =
    subject.previewing || ['admin', 'super_admin', 'staff'].includes(String(profile?.role));
  const subjectRole = subjectProfile.role;
  const assignedHome = ['student', 'learner'].includes(String(subjectRole))
    ? await resolveAssignedLearnerHome(db, subject.userId)
    : null;
  const apprenticeWorkspace = isApprenticeWorkspaceRole(subjectRole) || assignedHome?.startsWith('/apprentice') === true;
  const showBilling =
    (!isAdmin || subject.previewing) &&
    (await learnerCanSeeBilling(db, subject.userId, subjectRole));

  return (
    <PlatformShell
      user={{
        id: subject.userId,
        email: subjectProfile?.email || user.email || '',
        full_name: subjectProfile?.full_name || undefined,
        first_name: subjectProfile?.first_name || undefined,
        last_name: subjectProfile?.last_name || undefined,
        avatar_url: subject.previewing
          ? subjectProfile?.avatar_url || undefined
          : photoProfile?.avatar_url || undefined,
      }}
      role={apprenticeWorkspace ? 'apprentice' : 'student'}
      paris={{ autoOpenOnDashboard: false }}
    >
      {showLearnerNotices && !isAdmin && !photoProfile?.avatar_url && !apprenticeWorkspace ? (
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
      {showLearnerNotices && showBilling && !apprenticeWorkspace ? (
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
