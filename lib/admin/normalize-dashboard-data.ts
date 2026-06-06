import { getDegradedAdminDashboardData } from '@/lib/admin/degraded-dashboard-data';
import type { AdminDashboardData, DashboardCounts } from '@/components/admin/dashboard/types';

function asArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function asCount(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.length;
  return fallback;
}

function normalizeCounts(
  counts: Partial<DashboardCounts> | null | undefined,
  pendingApplicationsListLength: number,
): DashboardCounts {
  const base = getDegradedAdminDashboardData().counts;
  const raw = counts ?? {};
  return {
    pendingApplications: asCount(raw.pendingApplications, pendingApplicationsListLength),
    activeEnrollments: asCount(raw.activeEnrollments, base.activeEnrollments),
    revenueThisMonthCents: asCount(raw.revenueThisMonthCents, base.revenueThisMonthCents),
    certificatesIssued: asCount(raw.certificatesIssued, base.certificatesIssued),
    pendingProgramHolders: asCount(raw.pendingProgramHolders, base.pendingProgramHolders),
    pendingDocuments: asCount(raw.pendingDocuments, base.pendingDocuments),
  };
}

/** Guarantee a complete dashboard payload so render never throws on undefined sections. */
export function normalizeAdminDashboardData(
  input: Partial<AdminDashboardData> | null | undefined,
): AdminDashboardData {
  const fallback = getDegradedAdminDashboardData();
  if (!input) return fallback;

  const pendingApplications = asArray(input.pendingApplications);
  const recentApplications = asArray(input.recentApplications);

  return {
    ...fallback,
    ...input,
    counts: normalizeCounts(input.counts, pendingApplications.length || recentApplications.length),
    revenueAllTimeCents: asCount(input.revenueAllTimeCents, fallback.revenueAllTimeCents),
    totalStudents: asCount(input.totalStudents, fallback.totalStudents),
    recentPayments: asArray(input.recentPayments),
    operational: { ...fallback.operational, ...input.operational },
    priorities: asArray(input.priorities),
    kpis: asArray(input.kpis),
    enrollmentTrend: asArray(input.enrollmentTrend),
    studentStatuses: asArray(input.studentStatuses),
    topPrograms: asArray(input.topPrograms),
    recentActivity: asArray(input.recentActivity),
    recentStudents: asArray(input.recentStudents),
    recentApplications,
    pendingApplications,
    blockedPrograms: asArray(input.blockedPrograms),
    inactiveLearners: asArray(input.inactiveLearners),
    pendingSubmissions: asArray(input.pendingSubmissions),
    complianceAlerts: asArray(input.complianceAlerts),
    staleLeads: asArray(input.staleLeads),
    pendingWioaDocs: asCount(input.pendingWioaDocs, fallback.pendingWioaDocs),
    stalledApplications: asArray(input.stalledApplications),
    noOutcomeEnrollments: asArray(input.noOutcomeEnrollments),
    missingFundingEnrollments: asArray(input.missingFundingEnrollments),
    profile: input.profile ?? fallback.profile,
    generatedAt: input.generatedAt ?? fallback.generatedAt,
    sitePreviewTargets: asArray(input.sitePreviewTargets).length
      ? asArray(input.sitePreviewTargets)
      : fallback.sitePreviewTargets,
    degradedSections: asArray(input.degradedSections),
    systemHealth: { ...fallback.systemHealth, ...input.systemHealth },
    isSuperAdmin: input.isSuperAdmin === true,
  };
}
