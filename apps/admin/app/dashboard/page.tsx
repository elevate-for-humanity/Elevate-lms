import { redirect } from 'next/navigation';
import PodcastProgramGuideReview from '@/components/admin/PodcastProgramGuideReview';
import { Metadata } from 'next';
import Link from 'next/link';
import { getAdminDashboardData } from '@/lib/admin/get-admin-dashboard-data';
import { normalizeAdminDashboardData } from '@/lib/admin/normalize-dashboard-data';
import { AdminDashboardContent } from '@/components/admin/dashboard/DashboardShell';
import { requireRole } from '@/lib/auth/require-role';
import { EmailAccountNotice } from '@/components/communications/EmailAccountNotice';
import { getAdminDashboardHeroAssets } from '@/lib/admin/dashboard/get-hero-assets';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false },
  title: 'Admin Dashboard | Elevate For Humanity',
};

/**
 * Admin middleware is the first authorization boundary. requireRole is an
 * explicit second boundary so this page cannot render if middleware routing is
 * ever changed or bypassed by a future refactor.
 *
 * The canonical entry remains reachable for operational roles. Route those
 * callers to the existing RLS-backed staff portal before loading any privileged
 * platform aggregates. Only platform administrators receive global reporting.
 */
export default async function AdminDashboardPage() {
  const { effectiveRoles } = await requireRole([
    'super_admin',
    'admin',
    'org_admin',
    'advisor',
    'staff',
  ]);
  const canAccessDevStudio = effectiveRoles.some((role) => ['super_admin', 'admin'].includes(role));
  if (!canAccessDevStudio) redirect('/staff-portal');

  const [rawData, heroAssets] = await Promise.all([
    getAdminDashboardData(),
    getAdminDashboardHeroAssets(),
  ]);
  const data = normalizeAdminDashboardData(rawData);

  return (
    <>
      <div className="px-3 pt-4 sm:px-5 lg:px-6">
        <EmailAccountNotice href="/phone/email" />
      </div>
      <nav aria-label="Separate training dashboard management" className="grid gap-3 px-3 pt-4 sm:grid-cols-2 sm:px-5 lg:px-6">
        <Link href="/students" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-500">
          <span className="text-lg font-bold text-slate-950">Learner Dashboards</span>
          <p className="mt-1 text-sm text-slate-600">Regular training learners, including HVAC attendance and class clock-in.</p>
        </Link>
        <Link href="/apprenticeships" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-500">
          <span className="text-lg font-bold text-slate-950">Apprentice Dashboards</span>
          <p className="mt-1 text-sm text-slate-600">Registered apprenticeships, OJL, RTI, and employer approvals only.</p>
        </Link>
      </nav>
      <div className="px-3 sm:px-5 lg:px-6">
        <PodcastProgramGuideReview authorized={canAccessDevStudio} />
      </div>
      <AdminDashboardContent
        data={data}
        heroAssets={heroAssets}
        canAccessDevStudio={canAccessDevStudio}
      />
    </>
  );
}
