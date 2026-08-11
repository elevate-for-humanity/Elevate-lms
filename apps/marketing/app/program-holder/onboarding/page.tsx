import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function ProgramHolderOnboardingPage() {
  const auth = await createClient();
  const db = await requireAdminClient();
  const { data: { user } } = await auth.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/program-holder/onboarding');
  }

  const { data: profile } = await db
    .from('profiles')
    .select('program_holder_id')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile?.program_holder_id) {
    redirect('/apply/program-holder?status=pending');
  }

  const { data: holder } = await db
    .from('program_holders')
    .select('status, approved_at, mou_signed')
    .eq('id', profile.program_holder_id)
    .maybeSingle();

  if (!holder || !holder.approved_at || !['approved', 'active'].includes(String(holder.status || ''))) {
    redirect('/apply/program-holder?status=pending');
  }

  if (!holder.mou_signed) {
    redirect('/program-holder/sign-mou');
  }

  redirect('/program-holder/dashboard');
}
