import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
import { generateInternalMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateInternalMetadata({
  title: 'Payroll Setup',
  description: 'Payroll setup for new employees.',
  path: '/onboarding/payroll-setup',
});

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import PayrollSetupForm from './PayrollSetupForm';


export default async function PayrollSetupPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/onboarding/payroll-setup');
  }

  // Get user's profile to determine role
  const { data: profile } = await db
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.role) {
    redirect('/onboarding/start');
  }

  // Get payout rate config for role
  const { data: rateConfigs } = await db
    .from('payout_rate_configs')
    .select('*')
    .eq('role', profile.role)
    .eq('is_active', true);

  // Check if payroll profile already exists
  const { data: existingProfile } = await db
    .from('payroll_profiles')
    .select('*')
    .eq('user_id', user.id)
    .eq('role', profile.role)
    .single();

  return (
    <PayrollSetupForm
      user={user}
      profile={profile}
      rateConfigs={rateConfigs || []}
      existingProfile={existingProfile}
    />
  );
}
