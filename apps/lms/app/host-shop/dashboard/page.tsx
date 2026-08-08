/**
 * Canonical Host Shop Dashboard entry point.
 * Authenticates the user, verifies an active partner-user linkage and partner
 * approval/onboarding state, then routes to the real board workspace.
 */
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getHostShopOnboardingPaths, resolveHostShopProgram } from '@/lib/partners/host-shop-onboarding';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Host Shop Dashboard | Elevate for Humanity',
  description: 'Manage approved host-shop apprentices and training records.',
  robots: { index: false, follow: false },
};

export default async function HostShopDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/host-shop/login?redirect=/host-shop/dashboard');

  let db;
  try {
    db = await requireAdminClient();
  } catch {
    redirect('/host-shop/login?error=identity');
  }

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'staff') {
    redirect('https://admin.elevateforhumanity.org/dashboard');
  }

  // A profile role is not sufficient for host-shop access. The authenticated
  // user must be linked to an active partner record through partner_users.
  const { data: partnerLink } = await db
    .from('partner_users')
    .select('partner_id, status, partners(id, partner_type, program_type, programs, approval_status, status, onboarding_completed, mou_signed, documents_verified)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  const partner = partnerLink?.partners as unknown as {
    id: string;
    partner_type: string | null;
    program_type?: string | null;
    programs?: string[] | null;
    approval_status: string | null;
    status: string | null;
    onboarding_completed: boolean | null;
    mou_signed: boolean | null;
    documents_verified: boolean | null;
  } | null;

  if (!partner) {
    // Preserve legacy applicants without granting portal access.
    const { data: legacyApplication } = user.email
      ? await db
          .from('barbershop_partner_applications')
          .select('status, mou_signed_at')
          .eq('contact_email', user.email)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null };

    if (legacyApplication?.status === 'approved' && !legacyApplication.mou_signed_at) {
      redirect('/host-shop/apply/sign-mou');
    }
    if (legacyApplication?.status === 'approved') redirect('/host-shop/apply/forms');
    if (legacyApplication?.status === 'pending' || legacyApplication?.status === 'submitted') {
      redirect('/host-shop/apply/thank-you');
    }
    redirect('/host-shop/login?error=no_partner');
  }

  if (partner.approval_status !== 'approved' || partner.status !== 'active') {
    redirect('/host-shop/onboarding');
  }

  const programType = resolveHostShopProgram(partner as unknown as Record<string, unknown>);
  const onboardingPaths = getHostShopOnboardingPaths(programType);

  if (!partner.mou_signed) redirect(onboardingPaths.signMou);

  redirect('/host-shop/dashboard/board');
}
