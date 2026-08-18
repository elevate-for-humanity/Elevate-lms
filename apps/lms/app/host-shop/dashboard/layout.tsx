import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMyPartnerContext, getSessionUser } from '@/lib/partner/access';
import { PlatformShell } from '@/components/platform/PlatformShell';

export const dynamic = 'force-dynamic';

/**
 * Authorization boundary for every /host-shop/dashboard/* route.
 * Access is relationship-aware: active shop_staff or partner_users membership
 * is sufficient, while platform operators use the explicit Host Shop selector.
 */
export default async function HostShopDashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await getMyPartnerContext();

  if (!context) {
    const user = await getSessionUser();
    if (!user) redirect('/host-shop/login?redirect=/host-shop/dashboard');
    redirect('/host-shop/login?error=no_partner');
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, first_name, last_name, avatar_url')
    .eq('id', context.user.id)
    .maybeSingle();

  return (
    <PlatformShell
      user={{
        id: context.user.id,
        email: context.user.email || '',
        full_name: profile?.full_name || undefined,
        first_name: profile?.first_name || undefined,
        last_name: profile?.last_name || undefined,
        avatar_url: profile?.avatar_url || undefined,
      }}
      role="host_shop"
    >
      {children}
    </PlatformShell>
  );
}
