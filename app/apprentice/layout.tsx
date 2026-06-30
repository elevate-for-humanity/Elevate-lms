import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { ApprenticeSubNav } from '@/components/portal/ApprenticeSubNav';
import { resolveApprenticeNavConfig } from '@/lib/portal/apprentice-nav-config';
import { resolveApprenticeProgramSlug } from '@/lib/portal/resolve-apprentice-program';
import { canAccessApprenticeTools } from '@/lib/portal/apprentice-access';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { generateBreadcrumbs } from '@/lib/navigation/navigation-config';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Apprentice Portal',
  description: 'Apprentice dashboard, hours, documents, and training.',
};
export const dynamic = 'force-dynamic';

/** Routes that must stay reachable when tuition is past due (payment method update only). */
const BILLING_EXEMPT_PREFIXES = ['/apprentice/billing'];

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '/apprentice';

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!canAccessApprenticeTools(profile?.role)) {
    redirect('/unauthorized');
  }
  const isBillingExempt = BILLING_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));

  const db = await getAdminClient();
  if (db && !isBillingExempt) {
    const { data: barberSub } = await db
      .from('barber_subscriptions')
      .select('payment_status, suspension_deadline')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const isSuspended =
      barberSub?.payment_status === 'suspended' ||
      (barberSub?.payment_status === 'past_due' &&
        !!barberSub.suspension_deadline &&
        new Date(barberSub.suspension_deadline) < new Date());

    if (isSuspended) {
      redirect('/billing-required?reason=payment_failed');
    }
  }

  const programSlug = await resolveApprenticeProgramSlug(supabase, user.id);
  const nav = resolveApprenticeNavConfig(programSlug);

  // Generate breadcrumbs for apprentice portal
  const breadcrumbs = generateBreadcrumbs(pathname).map(crumb => {
    if (crumb.label === 'Apprentice') {
      return { label: 'Apprentice Portal', href: crumb.href };
    }
    return crumb;
  });

  return (
    <PlatformShell
      user={{
        id: user.id,
        email: user.email || '',
        full_name: profile?.full_name || undefined,
        first_name: profile?.first_name || undefined,
        last_name: profile?.last_name || undefined,
        avatar_url: profile?.avatar_url || undefined,
      }}
      role="apprentice"
      breadcrumbs={breadcrumbs}
    >
      {/* Apprentice-specific tab navigation */}
      {nav && <ApprenticeSubNav programSlug={nav.programSlug} config={nav.config} />}
      
      {/* Main Content */}
      <div className="mt-4">
        {children}
      </div>
    </PlatformShell>
  );
}
