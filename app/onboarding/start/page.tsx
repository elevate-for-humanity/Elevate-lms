import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
import { generateInternalMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateInternalMetadata({
  title: 'Start Onboarding',
  description: 'Begin your onboarding process.',
  path: '/onboarding/start',
});

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import OnboardingFlow from './OnboardingFlow';


export default async function OnboardingStartPage() {
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
    redirect('/login?next=/onboarding/start');
  }

  // Get user's profile to determine role
  const { data: profile } = await db
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-black mb-4">
            Role Not Assigned
          </h1>
          <p className="text-black mb-6">
            Your account does not have a role assigned yet. Please contact
            Elevate for Humanity to complete your account setup.
          </p>
          <a
            href="/contact"
            className="inline-block px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700"
          >
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  // Check if onboarding is already complete
  const { data: progress } = await db
    .from('onboarding_progress')
    .select('is_complete, role')
    .eq('user_id', user.id)
    .eq('role', profile.role)
    .single();

  if (progress?.is_complete) {
    // Redirect to appropriate dashboard based on role
    const dashboardMap: Record<string, string> = {
      PROGRAM_HOLDER: '/shop/dashboard',
      WORKSITE_ONLY: '/shop/dashboard',
      SITE_COORDINATOR: '/coordinator/dashboard',
    };

    redirect(dashboardMap[profile.role] || '/dashboard');
  }

  // Get active onboarding packet for role
  const { data: packet } = await db
    .from('onboarding_packets')
    .select('id, title, description')
    .eq('role', profile.role)
    .eq('is_active', true)
    .single();

  if (!packet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-black mb-4">
            Complete Your Profile
          </h1>
          <p className="text-black mb-6">
            To begin onboarding, please complete your profile information first. Contact support if you need assistance.
          </p>
          <a
            href="/contact"
            className="inline-block px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700"
          >
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  // Get onboarding documents
  const { data: documents } = await db
    .from('onboarding_documents')
    .select('*')
    .eq('packet_id', packet.id)
    .order('sort_order', { ascending: true });

  // Get existing signatures
  const { data: signatures } = await db
    .from('onboarding_signatures')
    .select('document_id')
    .eq('user_id', user.id);

  const signedDocumentIds = new Set(
    signatures?.map((s) => s.document_id) || []
  );

  // Get payroll profile status
  const { data: payrollProfile } = await db
    .from('payroll_profiles')
    .select('status')
    .eq('user_id', user.id)
    .eq('role', profile.role)
    .single();

  return (
    <OnboardingFlow
      user={user}
      profile={profile}
      packet={packet}
      documents={documents || []}
      signedDocumentIds={signedDocumentIds}
      payrollStatus={payrollProfile?.status || null}
    />
  );
}
