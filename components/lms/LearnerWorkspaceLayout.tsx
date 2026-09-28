import { PlatformShell } from '@/components/platform/PlatformShell';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function LearnerWorkspaceLayout({
  children,
  showLearnerNotices = true,
}: {
  children: React.ReactNode;
  showLearnerNotices?: boolean;
}) {
  const { user, profile } = await requireRole(['student', 'learner', 'admin', 'staff']);
  const supabase = await createClient();
  const { data: photoProfile } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle();

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
      role="student"
    >
      {showLearnerNotices && !photoProfile?.avatar_url ? (
        <div className="mx-auto mt-4 w-full max-w-7xl px-4 sm:px-6">
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 sm:p-5">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-800">Required profile to-do</p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><h2 className="text-lg font-black text-amber-950">Upload a clear photo of yourself</h2><p className="mt-1 text-sm text-amber-900">Your learner photo helps instructors, Host Shops, and authorized program staff confirm they are working in the correct student record.</p></div>
              <Link href="/lms/profile" className="inline-flex min-h-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-900 px-5 py-3 text-sm font-black text-white">Upload profile photo</Link>
            </div>
          </div>
        </div>
      ) : null}
      {showLearnerNotices ? (
        <div className="mx-auto mt-4 w-full max-w-7xl px-4 sm:px-6">
          <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 sm:p-5">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">Payment plans</p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0"><h2 className="text-lg font-black text-slate-950">PayPal autopay and QuickBooks invoices are available</h2><p className="mt-1 text-sm leading-6 text-slate-700">Open Billing to review the payment plan managed in the Elevate Admin dashboard. PayPal handles approved automatic collection, and QuickBooks records invoices, balances, and Pay Now links. Elevate does not store your card or bank credentials.</p></div>
            <Link href="/apprentice/billing" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-indigo-700 px-5 py-3 text-sm font-black text-white">View payment options</Link>
          </div>
          </section>
        </div>
      ) : null}
      {children}
    </PlatformShell>
  );
}
