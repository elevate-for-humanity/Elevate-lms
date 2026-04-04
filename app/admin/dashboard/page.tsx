import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { getAdminDashboardData } from '@/lib/admin/get-admin-dashboard-data';
import { DashboardShell } from '@/components/admin/dashboard/DashboardShell';
import { BuiltCoursesPanel } from './BuiltCoursesPanel';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Admin Dashboard | Elevate For Humanity',
};

export default async function AdminDashboardPage() {
  await requireAdmin();
  const data = await getAdminDashboardData();

  return (
    <>
      <DashboardShell data={data} />
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <BuiltCoursesPanel />
      </div>
    </>
  );
}
