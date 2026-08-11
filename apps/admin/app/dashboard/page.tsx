import { Metadata } from 'next';
import { getAdminDashboardData } from '@/lib/admin/get-admin-dashboard-data';
import { normalizeAdminDashboardData } from '@/lib/admin/normalize-dashboard-data';
import { AdminDashboardContent } from '@/components/admin/dashboard/DashboardShell';
import { requireRole } from '@/lib/auth/require-role';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false },
  title: 'Admin Dashboard | Elevate For Humanity',
};

/**
 * Admin middleware is the first authorization boundary. requireRole is an
 * explicit second boundary so this page cannot render if middleware routing is
 * ever changed or bypassed by a future refactor.
 */
export default async function AdminDashboardPage() {
  const { effectiveRoles } = await requireRole(['super_admin', 'admin', 'org_admin', 'staff']);
  const canAccessDevStudio = effectiveRoles.some((role) =>
    ['super_admin', 'admin'].includes(role),
  );

  const data = normalizeAdminDashboardData(await getAdminDashboardData());

  return <AdminDashboardContent data={data} canAccessDevStudio={canAccessDevStudio} />;
}
