import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Authorization boundary for every /host-shop/dashboard/* route.
 * Authentication alone and profiles.role alone are insufficient: normal host
 * shop users must have an active partner_users linkage.
 */
export default async function HostShopDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/host-shop/login?redirect=/host-shop/dashboard');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'staff') {
    return <>{children}</>;
  }

  const { data: partnerUser, error } = await supabase
    .from('partner_users')
    .select('partner_id, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !partnerUser?.partner_id) {
    redirect('/host-shop/login?error=no_partner');
  }

  return <>{children}</>;
}
