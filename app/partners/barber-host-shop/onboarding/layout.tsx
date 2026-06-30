import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Server-side auth gate for the legacy all-in-one barbershop onboarding page.
// Replaces the client-side useEffect/getSession check which allowed the page
// to render before the redirect fired.
export default async function BarbershopOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/partners/barber-host-shop/onboarding');
  }

  const db = await requireAdminClient();
  if (!db) redirect('/login');
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const adminRoles = ['admin', 'super_admin', 'staff'];
  const partnerRoles = ['program_holder', 'employer', 'partner'];
  const allowed = [...adminRoles, ...partnerRoles];

  if (!profile || !allowed.includes(profile.role)) {
    redirect('/partners/barber-host-shop');
  }

  // Admins bypass approval check
  if (adminRoles.includes(profile.role)) {
    return <>{children}</>;
  }

  // Must have an approved application to access onboarding
  const [{ data: bpa }, { data: pa }] = await Promise.all([
    db
      .from('barbershop_partner_applications')
      .select('status')
      .eq('contact_email', user.email!)
      .eq('status', 'approved')
      .maybeSingle(),
    db
      .from('partner_applications')
      .select('status')
      .eq('contact_email', user.email!)
      .eq('status', 'approved')
      .maybeSingle(),
  ]);

  if (!bpa && !pa) {
    redirect('/partners/barber-host-shop?status=pending');
  }

  return <>{children}</>;
}
