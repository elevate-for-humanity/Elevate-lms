import { Suspense } from 'react';
import { Metadata } from 'next';
import { getAdminDashboardData } from '@/lib/admin/get-admin-dashboard-data';
import { getDegradedAdminDashboardData } from '@/lib/admin/degraded-dashboard-data';
import { normalizeAdminDashboardData } from '@/lib/admin/normalize-dashboard-data';
import { AdminDashboardContent } from '@/components/admin/dashboard/DashboardShell';
import { logger } from '@/lib/logger';
import DashboardLoading from './loading';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Elevate For Humanity',
};

// Auth and role enforcement is handled by apps/admin/app/admin/layout.tsx.
async function DashboardContent() {
  let data;
  try {
    data = normalizeAdminDashboardData(await getAdminDashboardData());
  } catch (err) {
    logger.error('[AdminDashboardPage] Dashboard data load failed; rendering degraded dashboard', err);
    data = normalizeAdminDashboardData(getDegradedAdminDashboardData());
  }
  return <AdminDashboardContent data={data} />;
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
