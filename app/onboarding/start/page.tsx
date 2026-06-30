import { Metadata } from 'next';
import { generateInternalMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateInternalMetadata({
  title: 'Start Onboarding',
  description: 'Begin your onboarding process.',
  path: '/onboarding/start',
});

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import OnboardingFlow from './OnboardingFlow';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export default async function OnboardingStartPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/onboarding/start');
  }

  // Get user's profile to determine role
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !profile.role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Role Not Assigned</h1>
          <p className="text-black mb-6">
            Your account does not have a role assigned yet. Please contact {PLATFORM_DEFAULTS.orgName} to
            complete your account setup.
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
  const { data: progress } = await supabase
    .from('onboarding_progress')
    .select('is_complete, role')
    .eq('user_id', user.id)
    .eq('role', profile.role)
    .maybeSingle();

  if (progress?.is_complete) {
    // Redirect to appropriate dashboard based on role
    const dashboardMap: Record<string, string> = {
      PROGRAM_HOLDER: '/program-holder/dashboard',
      WORKSITE_ONLY: '/partner/dashboard',
      SITE_COORDINATOR: '/partner/dashboard',
      program_holder: '/program-holder/dashboard',
      worksite_only: '/partner/dashboard',
      site_coordinator: '/partner/dashboard',
      staff: '/admin/staff-portal/dashboard',
      instructor: '/instructor/dashboard',
      employer: '/employer/dashboard',
      admin: '/admin/dashboard',
      super_admin: '/admin/dashboard',
    };

    redirect(dashboardMap[profile.role] || '/dashboard');
  }

  // Get active onboarding packet for role
  const { data: packet } = await supabase
    .from('onboarding_packets')
    .select('id, title, description')
    .eq('role', profile.role)
    .eq('is_active', true)
    .maybeSingle();

  if (!packet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Complete Your Profile</h1>
          <p className="text-black mb-6">
            To begin onboarding, please complete your profile information first. Contact support if
            you need assistance.
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
  const { data: documents } = await supabase
    .from('onboarding_documents')
    .select('*')
    .eq('packet_id', packet.id)
    .order('sort_order', { ascending: true });

  // Get existing signatures
  const { data: signatures } = await supabase
    .from('onboarding_signatures')
    .select('document_id, signed_at')
    .eq('user_id', user.id);

  const signedDocumentIds = new Set(signatures?.map((s) => s.document_id) || []);
  const signedAtByDocId = Object.fromEntries(
    (signatures ?? []).map((s) => [s.document_id, s.signed_at as string]),
  );

  // Get payroll profile status
  const { data: payrollProfile } = await supabase
    .from('payroll_profiles')
    .select('status')
    .eq('user_id', user.id)
    .eq('role', profile.role)
    .maybeSingle();

  return (
    <OnboardingFlow
      user={user}
      profile={profile}
      packet={packet}
      documents={documents || []}
      signedDocumentIds={signedDocumentIds}
      signedAtByDocId={signedAtByDocId}
      payrollStatus={payrollProfile?.status || null}
    />
  );
}
