import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Auth + approval gate for barber host shop onboarding (MOU, forms, documents).
 * Route group: /partners/barber-host-shop/sign-mou, /forms, etc.
 */
export default async function BarberHostShopOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/partner/dashboard');
  }

  const db = await requireAdminClient();
  if (!db) redirect('/login');

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const adminRoles = ['admin', 'super_admin', 'staff'];
  if (profile && adminRoles.includes(profile.role)) {
    return <>{children}</>;
  }

  const email = user.email?.toLowerCase().trim() ?? '';

  const { data: bpa } = await db
    .from('barbershop_partner_applications')
    .select('id, status')
    .eq('contact_email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: partnerLink } = await db
    .from('partner_users')
    .select('partner_id, partners(approval_status, status)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  const partner = partnerLink?.partners as { approval_status?: string; status?: string } | null;
  const partnerApproved =
    partner?.approval_status === 'approved' && partner?.status === 'active';
  const bpaApproved = bpa?.status === 'approved';

  if (!bpaApproved && !partnerApproved) {
    if (bpa?.status === 'pending' || bpa?.status === 'submitted') {
      redirect('/partners/barber-host-shop/thank-you');
    }
    redirect('/partners/barber-host-shop/apply');
  }

  return <>{children}</>;
}
