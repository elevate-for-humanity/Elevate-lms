import { Metadata } from 'next';
import { getAdminDashboardData } from '@/lib/admin/get-admin-dashboard-data';
import { normalizeAdminDashboardData } from '@/lib/admin/normalize-dashboard-data';
import { AdminDashboardContent } from '@/components/admin/dashboard/DashboardShell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Elevate For Humanity',
};

// Auth and role enforcement is handled by apps/admin/app/admin/layout.tsx.
export default async function AdminDashboardPage() {
  const data = normalizeAdminDashboardData(await getAdminDashboardData());

  return (
    <>
      <AdminDashboardContent data={data} />
    </>
  );
}
