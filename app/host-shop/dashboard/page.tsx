/**
 * Host Shop Dashboard - Entry Point
 * 
 * This is the MAIN dashboard for ALL host shop types:
 * - Barber Host Shops
 * - Cosmetology Host Shops
 * - Nail Tech Host Shops
 * - Esthetician Host Shops
 * 
 * Routes to the board view for authenticated partners.
 */
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getHostShopOnboardingPaths, resolveHostShopProgram } from '@/lib/partners/host-shop-onboarding';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Host Shop Dashboard | Elevate for Humanity',
  description: 'Manage your host shop, apprentices, and training programs.',
  robots: { index: false, follow: false },
};

export default async function HostShopDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/host-shop/dashboard');
  }

  // Get admin client for partner lookup
  let db;
  try {
    db = await requireAdminClient();
  } catch {
    redirect('/login?redirect=/host-shop/dashboard');
  }

  // Check role
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const allowedRoles = ['partner', 'admin', 'staff'];
  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect('/unauthorized');
  }

  // Admins/staff go to their own dashboard
  if (['admin', 'staff'].includes(profile.role)) {
    redirect('/admin/dashboard');
  }

  // Resolve partner record via partner_users join
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

  // No partner record - route to onboarding
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
        redirect('/host-shop/apply/sign-mou');
      }
      redirect('/host-shop/apply/forms');
    }
    if (bpa?.status === 'pending' || bpa?.status === 'submitted') {
      redirect('/host-shop/apply/thank-you');
    }
    redirect('/host-shop/apply');
  }

  // Not yet approved - hold at onboarding
  if (partner.approval_status !== 'approved' || partner.status !== 'active') {
    redirect('/host-shop/onboarding');
  }

  // Approved partners - route to board (main working view)
  const programType = resolveHostShopProgram(partner as unknown as Record<string, unknown>);
  const onboardingPaths = getHostShopOnboardingPaths(programType);

  if (!partner.mou_signed) {
    redirect(onboardingPaths.signMou);
  }

  // Show the board as the main dashboard view
  redirect('/host-shop/dashboard/board');
}
