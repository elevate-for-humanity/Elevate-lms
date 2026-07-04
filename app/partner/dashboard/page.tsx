import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getHostShopOnboardingPaths, resolveHostShopProgram } from '@/lib/partners/host-shop-onboarding';

export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';



/**
 * Partner dashboard entry point.
 *
 * Routes approved partners (role='partner') based on their onboarding state:
 *   - Not authenticated          → /partner/login
 *   - Wrong role                 → /unauthorized
 *   - Onboarding not complete    → /partner/onboarding
 *   - Onboarding complete        → /partner/attendance (primary working view)
 *
 * Must never redirect to /program-holder/dashboard —
 * that guard rejects role='partner' and sends them to /unauthorized.
 */
export default async function PartnerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/partner/dashboard');

  let db: Awaited<ReturnType<typeof requireAdminClient>>;
  try {
    db = await requireAdminClient();
  } catch {
    redirect('/login?redirect=/partner/dashboard');
  }

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const allowedRoles = ['partner', 'admin', 'staff'];
  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect('/unauthorized');
  }

  // Admins/staff have no partners row — send them to their own dashboard
  if (['admin', 'staff'].includes(profile.role)) {
    redirect('/admin/dashboard');
  }

  // Resolve partner record via partner_users join (partners has no user_id column)
  const { data: partnerLink } = await db
    .from('partner_users')
    .select(
      'partner_id, status, partners(id, partner_type, program_type, programs, approval_status, status, onboarding_completed, mou_signed, documents_verified)',
    )
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  const partner = partnerLink?.partners as unknown as {
    id: string;
    partner_type: string | null;
    program_type?: string | null;
    programs?: string[] | null;
    approval_status: string;
    status: string;
    onboarding_completed: boolean;
    mou_signed: boolean;
    documents_verified: boolean;
  } | null;

  // No partner record — route barber host shop applicants to the correct flow
  if (!partner) {
    const { data: bpa } = await db
      .from('barbershop_partner_applications')
      .select('status, mou_signed_at')
      .eq('contact_email', user.email!)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (bpa?.status === 'approved') {
      if (!bpa.mou_signed_at) {
        redirect('/partners/barber-host-shop/sign-mou');
      }
      redirect('/partners/barber-host-shop/forms');
    }
    if (bpa?.status === 'pending' || bpa?.status === 'submitted') {
      redirect('/partners/barber-host-shop/thank-you');
    }
    redirect('/partners/barber-host-shop/apply');
  }

  // Not yet approved — hold at onboarding
  if (partner.approval_status !== 'approved' || partner.status !== 'active') {
    redirect('/partner/onboarding');
  }

  // Approved host-site partners route through the correct program-specific onboarding steps.
  const programType = resolveHostShopProgram(partner as unknown as Record<string, unknown>);
  const onboardingPaths = getHostShopOnboardingPaths(programType);

  if (!partner.mou_signed) {
    redirect(onboardingPaths.signMou);
  }

  // Once the MOU is signed, send partners to the board even if onboarding is
  // incomplete. The board now displays the onboarding/document alerts and links
  // so partners do not get stuck in a loop with no dashboard context.
  redirect(onboardingPaths.dashboard);
}
