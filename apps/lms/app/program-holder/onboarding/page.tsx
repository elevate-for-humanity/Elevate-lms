import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function ProgramHolderOnboardingPage() {
  const context = await requireProgramHolder({ allowPendingApproval: true });

  if (context.mode === 'admin') {
    redirect('/program-holder/dashboard');
  }

  const { data: holder } = await context.db
    .from('program_holders')
    .select('status,approved_at,mou_signed')
    .eq('id', context.holderId)
    .maybeSingle();

  if (!holder || !holder.approved_at || !['approved', 'active', 'approved_pending_mou'].includes(String(holder.status || ''))) {
    return <main className="mx-auto max-w-3xl px-4 py-10"><h1 className="text-3xl font-black">Program Holder approval pending</h1><p className="mt-4 text-slate-700">Your account is connected. Elevate must finish reviewing your application before program and student access is available. Opening this page does not record a signature or approval.</p><Link href="https://www.elevateforhumanity.org/contact" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-5 font-bold text-white">Contact Elevate about your application</Link></main>;
  }

  if (!holder.mou_signed) {
    redirect('/program-holder/sign-mou');
  }

  redirect('/program-holder/how-to-use');
}
