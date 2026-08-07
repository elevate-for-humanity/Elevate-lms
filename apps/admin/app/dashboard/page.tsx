import { Metadata } from 'next';
import { getAdminDashboardData } from '@/lib/admin/get-admin-dashboard-data';
import { normalizeAdminDashboardData } from '@/lib/admin/normalize-dashboard-data';
import { AdminDashboardContent } from '@/components/admin/dashboard/DashboardShell';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false },
  title: 'Admin Dashboard | Elevate For Humanity',
};

// Middleware enforces authentication and staff/admin role access for /dashboard.
export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let canAccessDevStudio = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    canAccessDevStudio = profile?.role === 'admin' || profile?.role === 'super_admin';
  }

  const data = normalizeAdminDashboardData(await getAdminDashboardData());

  return <AdminDashboardContent data={data} canAccessDevStudio={canAccessDevStudio} />;
}
