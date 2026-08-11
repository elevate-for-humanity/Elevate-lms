import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PlatformShell } from '@/components/platform/PlatformShell';

export const dynamic = 'force-dynamic';

/**
 * Authorization boundary for every /host-shop/dashboard/* route.
 * Authentication alone and profiles.role alone are insufficient: normal host
 * shop users must have an active partner_users linkage.
 */
export default async function HostShopDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/host-shop/login?redirect=/host-shop/dashboard');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, first_name, last_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  const privileged = ['admin', 'super_admin', 'staff', 'org_admin'].includes(
    String(profile?.role || ''),
  );

  if (!privileged) {
    const { data: partnerUser, error } = await supabase
      .from('partner_users')
      .select('partner_id, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (error || !partnerUser?.partner_id) {
      redirect('/host-shop/login?error=no_partner');
    }
  }

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
      role="host_shop"
    >
      {children}
    </PlatformShell>
  );
}
