import { Metadata } from 'next';
import { generateInternalMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateInternalMetadata({
  title: 'Payroll Setup',
  description: 'Payroll setup for new employees.',
  path: '/onboarding/payroll-setup',
});

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PayrollSetupForm from './PayrollSetupForm';

export const dynamic = 'force-dynamic';


export default async function PayrollSetupPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/onboarding/payroll-setup');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !profile.role) {
    redirect('/onboarding/start');
  }

  return (
    <PayrollSetupForm
      user={user}
      profile={profile}
      rateConfigs={[]}
      existingProfile={null}
    />
  );
}
