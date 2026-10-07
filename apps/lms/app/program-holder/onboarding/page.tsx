import { redirect } from 'next/navigation';
import { PROGRAM_HOLDER_PENDING_APPLICATION_URL, requireProgramHolder } from '@/lib/auth/require-program-holder';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function ProgramHolderOnboardingPage() {
  const context = await requireProgramHolder();

  if (context.mode === 'admin') {
    redirect('/program-holder/dashboard');
  }

  const { data: holder } = await context.db
    .from('program_holders')
    .select('status,approved_at,mou_signed')
    .eq('id', context.holderId)
    .maybeSingle();

  if (!holder || !holder.approved_at || !['approved', 'active', 'approved_pending_mou'].includes(String(holder.status || ''))) {
    redirect(PROGRAM_HOLDER_PENDING_APPLICATION_URL);
  }

  if (!holder.mou_signed) {
    redirect('/program-holder/sign-mou');
  }

  redirect('/program-holder/how-to-use');
}
