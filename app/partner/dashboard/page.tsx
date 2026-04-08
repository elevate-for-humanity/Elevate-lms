import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/partner/login');

  const db = createAdminClient();
  if (!db) redirect('/partner/login');

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const allowedRoles = ['partner', 'admin', 'super_admin', 'staff'];
  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect('/unauthorized');
  }

  // Admins/staff have no partners row — send them to their own dashboard
  if (['admin', 'super_admin', 'staff'].includes(profile.role)) {
    redirect('/admin/dashboard');
  }

  // Resolve partner record via partner_users join (partners has no user_id column)
  const { data: partnerLink } = await db
    .from('partner_users')
    .select('partner_id, status, partners(id, onboarding_completed, status)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  const partner = partnerLink?.partners as { id: string; onboarding_completed: boolean; status: string } | null;

  if (!partner || partner.onboarding_completed !== true || partner.status !== 'active') {
    redirect('/partner/onboarding');
  }

  redirect('/partner/attendance');
}
