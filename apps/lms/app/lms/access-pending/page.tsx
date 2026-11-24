import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Enrollment Pending | Elevate for Humanity', robots: { index: false, follow: false } };

export default async function LearnerAccessPendingPage() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/login');

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-12 text-center">
      <h1 className="text-3xl font-bold text-slate-950">Enrollment review pending</h1>
      <p className="mt-4 text-base leading-7 text-slate-700">
        Your account is available, but training materials and the learner dashboard
        remain locked until your enrollment is active. For state-funded enrollment, an administrator must approve your funding and enrollment.
      </p>
      <p className="mt-3 text-sm text-slate-600">
        If you paid directly, submit the full enrollment application with your verified payment to activate access. Please do not pay again to unlock the portal.
      </p>
      <Link href="/enrollment" className="mt-7 rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white">
        View enrollment steps
      </Link>
      <Link href="/lms/onboarding" className="mt-4 font-semibold text-blue-800 underline">
        Continue required onboarding
      </Link>
    </main>
  );
}
