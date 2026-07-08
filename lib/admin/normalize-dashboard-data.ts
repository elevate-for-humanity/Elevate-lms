import type {
  AdminDashboardData,
  DashboardCounts,
  InactiveLearner,
  KPICard,
  OperationalCounts,
  RecentApplication,
  RecentStudent,
  SitePreviewTarget,
  TopProgramPoint,
} from '@/components/admin/dashboard/types';
import type { PriorityItem } from '@/lib/admin/priority-score';

function asArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function asObjectArray<T extends object>(value: T[] | null | undefined): T[] {
  return asArray(value).filter((item): item is T => item != null && typeof item === 'object');
}

function asCount(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.length;
  return fallback;
}

const PRIORITY_SEVERITIES = new Set<PriorityItem['severity']>([
  'critical',
  'high',
  'medium',
  'low',
]);

const FALLBACK_OPERATIONAL: OperationalCounts = {
  needsReview: 0,
  needsReviewDetail: '',
  atRisk: 0,
  complianceAlerts: 0,
  complianceAlertsSeverity: null,
  newToday: 0,
  newTodayDetail: '',
  newAppsToday: 0,
  newLeadsToday: 0,
  newEnrollmentsToday: 0,
  revenueThisMonthCents: 0,
};

const FALLBACK_SYSTEM_HEALTH: AdminDashboardData['systemHealth'] = {
  stripeWebhookOk: true,
  stripeIssuingOk: true,
  buildEnvOk: true,
  staleJobs: 0,
  degraded: false,
  missingDocuments: 0,
  missingCertifications: 0,
  unresolvedFlags: 0,
  alerts: [],
};

const FALLBACK_COUNTS: DashboardCounts = {
  pendingApplications: 0,
  activeEnrollments: 0,
  revenueThisMonthCents: 0,
  certificatesIssued: 0,
  pendingProgramHolders: 0,
  pendingDocuments: 0,
};

const FALLBACK_SITE_PREVIEW: SitePreviewTarget[] = [];

function normalizeKpis(kpis: KPICard[] | null | undefined): KPICard[] {
  return asObjectArray(kpis).map((kpi) => ({
    label: typeof kpi.label === 'string' ? kpi.label : 'Metric',
    value: asCount(kpi.value),
    delta: asCount(kpi.delta),
    deltaLabel: typeof kpi.deltaLabel === 'string' ? kpi.deltaLabel : '',
    href: typeof kpi.href === 'string' ? kpi.href : '/admin/dashboard',
    urgent: kpi.urgent === true,
    sub: typeof kpi.sub === 'string' ? kpi.sub : undefined,
  }));
}

function normalizePriorities(items: PriorityItem[] | null | undefined): PriorityItem[] {
  return asObjectArray(items).map((item) => ({
    id: String(item.id ?? 'priority'),
    type: item.type ?? 'system',
    label: typeof item.label === 'string' ? item.label : 'Operational item',
    href: typeof item.href === 'string' ? item.href : '/admin/operations',
    score: asCount(item.score),
    severity: PRIORITY_SEVERITIES.has(item.severity) ? item.severity : 'low',
    context: typeof item.context === 'string' ? item.context : '',
  }));
}

function normalizeOperational(
  operational: Partial<OperationalCounts> | null | undefined,
): OperationalCounts {
  const raw = operational ?? {};
  return {
    needsReview: asCount(raw.needsReview, FALLBACK_OPERATIONAL.needsReview),
    needsReviewDetail:
      typeof raw.needsReviewDetail === 'string' ? raw.needsReviewDetail : FALLBACK_OPERATIONAL.needsReviewDetail,
    atRisk: asCount(raw.atRisk, FALLBACK_OPERATIONAL.atRisk),
    complianceAlerts: asCount(raw.complianceAlerts, FALLBACK_OPERATIONAL.complianceAlerts),
    complianceAlertsSeverity:
      typeof raw.complianceAlertsSeverity === 'string' ? raw.complianceAlertsSeverity : FALLBACK_OPERATIONAL.complianceAlertsSeverity,
    newToday: asCount(raw.newToday, FALLBACK_OPERATIONAL.newToday),
    newTodayDetail:
      typeof raw.newTodayDetail === 'string' ? raw.newTodayDetail : FALLBACK_OPERATIONAL.newTodayDetail,
    newAppsToday: asCount(raw.newAppsToday, FALLBACK_OPERATIONAL.newAppsToday),
    newLeadsToday: asCount(raw.newLeadsToday, FALLBACK_OPERATIONAL.newLeadsToday),
    newEnrollmentsToday: asCount(raw.newEnrollmentsToday, FALLBACK_OPERATIONAL.newEnrollmentsToday),
    revenueThisMonthCents: asCount(raw.revenueThisMonthCents, FALLBACK_OPERATIONAL.revenueThisMonthCents),
  };
}

function normalizeSystemHealth(
  health: Partial<AdminDashboardData['systemHealth']> | null | undefined,
): AdminDashboardData['systemHealth'] {
  const raw = health ?? {};
  const alerts = asObjectArray(raw.alerts).map((alert) => ({
    code: typeof alert.code === 'string' ? alert.code : 'unknown',
    severity:
      alert.severity === 'critical' || alert.severity === 'warning' || alert.severity === 'info'
        ? alert.severity
        : 'warning',
    message: typeof alert.message === 'string' ? alert.message : 'System health alert',
  }));
  return {
    stripeWebhookOk: raw.stripeWebhookOk === true,
    stripeIssuingOk: raw.stripeIssuingOk === true,
    buildEnvOk: raw.buildEnvOk === true,
    staleJobs: asCount(raw.staleJobs, FALLBACK_SYSTEM_HEALTH.staleJobs),
    degraded: raw.degraded === true || alerts.some((a) => a.severity === 'critical'),
    missingDocuments: asCount(raw.missingDocuments, FALLBACK_SYSTEM_HEALTH.missingDocuments),
    missingCertifications: asCount(raw.missingCertifications, FALLBACK_SYSTEM_HEALTH.missingCertifications),
    unresolvedFlags: asCount(raw.unresolvedFlags, FALLBACK_SYSTEM_HEALTH.unresolvedFlags),
    alerts: alerts.length ? alerts : FALLBACK_SYSTEM_HEALTH.alerts,
  };
}

function normalizeProfile(
  profile: AdminDashboardData['profile'] | null | undefined,
): AdminDashboardData['profile'] {
  if (!profile || typeof profile !== 'object') return null;
  return {
    full_name: typeof profile.full_name === 'string' ? profile.full_name : null,
    role: typeof profile.role === 'string' ? profile.role : 'admin',
  };
}

function normalizeSitePreviewTargets(
  targets: SitePreviewTarget[] | null | undefined,
  fallback: SitePreviewTarget[],
): SitePreviewTarget[] {
  const rows = asObjectArray(targets)
    .map((target) => {
      const url = typeof target.url === 'string' ? target.url.trim() : '';
      if (!url) return null;
      const label =
        typeof target.label === 'string' && target.label.trim()
          ? target.label.trim()
          : url;
      return { label, url };
    })
    .filter((row): row is SitePreviewTarget => row != null);
  return rows.length ? rows : fallback;
}

function normalizeRecentStudents(students: RecentStudent[] | null | undefined): RecentStudent[] {
  return asObjectArray(students)
    .map((student) => {
      const id = String(student.id ?? '').trim();
      if (!id) return null;
      return {
        id,
        full_name: typeof student.full_name === 'string' ? student.full_name : null,
        email: typeof student.email === 'string' ? student.email : null,
        enrollment_status:
          typeof student.enrollment_status === 'string' ? student.enrollment_status : null,
        created_at: typeof student.created_at === 'string' ? student.created_at : null,
        program_name: typeof student.program_name === 'string' ? student.program_name : null,
        href:
          typeof student.href === 'string' && student.href.startsWith('/')
            ? student.href
            : `/admin/students/${id}`,
      };
    })
    .filter((row): row is RecentStudent => row != null);
}

function normalizeInactiveLearners(
  learners: InactiveLearner[] | null | undefined,
): InactiveLearner[] {
  return asObjectArray(learners)
    .map((learner) => {
      const enrollmentId = String(learner.enrollmentId ?? learner.userId ?? '').trim();
      const userId = String(learner.userId ?? '').trim();
      if (!enrollmentId && !userId) return null;
      const daysInactive = asCount(learner.daysInactive);
      return {
        enrollmentId: enrollmentId || userId,
        userId: userId || enrollmentId,
        enrolledAt: typeof learner.enrolledAt === 'string' ? learner.enrolledAt : '',
        fullName: typeof learner.fullName === 'string' ? learner.fullName : null,
        email: typeof learner.email === 'string' ? learner.email : null,
        daysInactive,
        programTitle: typeof learner.programTitle === 'string' ? learner.programTitle : null,
        href:
          typeof learner.href === 'string' && learner.href.startsWith('/')
            ? learner.href
            : `/admin/students/${userId || enrollmentId}`,
      };
    })
    .filter((row): row is InactiveLearner => row != null);
}

function normalizeTopPrograms(programs: TopProgramPoint[] | null | undefined): TopProgramPoint[] {
  return asObjectArray(programs)
    .map((program) => {
      const id = String(program.id ?? '').trim();
      const title = typeof program.title === 'string' ? program.title : 'Program';
      if (!id) return null;
      return {
        id,
        title,
        learners: asCount(program.learners),
        completed: asCount(program.completed),
        completionRate: asCount(program.completionRate),
      };
    })
    .filter((row): row is TopProgramPoint => row != null);
}

function normalizeRecentApplications(
  applications: RecentApplication[] | null | undefined,
): RecentApplication[] {
  return asObjectArray(applications).map((app) => ({
    id: String(app.id ?? `app-${Math.random().toString(36).slice(2)}`),
    first_name: typeof app.first_name === 'string' ? app.first_name : null,
    last_name: typeof app.last_name === 'string' ? app.last_name : null,
    full_name: typeof app.full_name === 'string' ? app.full_name : null,
    email: typeof app.email === 'string' ? app.email : null,
    program_interest: typeof app.program_interest === 'string' ? app.program_interest : null,
    status: typeof app.status === 'string' ? app.status : 'submitted',
    created_at: typeof app.created_at === 'string' ? app.created_at : new Date().toISOString(),
    submitted_at: typeof app.submitted_at === 'string' ? app.submitted_at : null,
    age_days: asCount(app.age_days),
    urgent: app.urgent === true,
    href:
      typeof app.href === 'string' && app.href.startsWith('/')
        ? app.href
        : '/admin/applications',
  }));
}

function normalizeCounts(
  counts: Partial<DashboardCounts> | null | undefined,
  pendingApplicationsListLength: number,
): DashboardCounts {
  const raw = counts ?? {};
  return {
    pendingApplications: asCount(raw.pendingApplications, pendingApplicationsListLength),
    activeEnrollments: asCount(raw.activeEnrollments, FALLBACK_COUNTS.activeEnrollments),
    revenueThisMonthCents: asCount(raw.revenueThisMonthCents, FALLBACK_COUNTS.revenueThisMonthCents),
    certificatesIssued: asCount(raw.certificatesIssued, FALLBACK_COUNTS.certificatesIssued),
    pendingProgramHolders: asCount(raw.pendingProgramHolders, FALLBACK_COUNTS.pendingProgramHolders),
    pendingDocuments: asCount(raw.pendingDocuments, FALLBACK_COUNTS.pendingDocuments),
  };
}

/** Guarantee a complete dashboard payload so render never throws on undefined sections. */
export function normalizeAdminDashboardData(
  input: Partial<AdminDashboardData> | null | undefined,
): AdminDashboardData {
  if (!input) return {
    counts: FALLBACK_COUNTS,
    revenueAllTimeCents: 0,
    totalStudents: 0,
    recentPayments: [],
    operational: FALLBACK_OPERATIONAL,
    priorities: [],
    kpis: [],
    enrollmentTrend: [],
    studentStatuses: [],
    topPrograms: [],
    recentActivity: [],
    recentStudents: [],
    recentApplications: [],
    pendingApplications: [],
    blockedPrograms: [],
    inactiveLearners: [],
    pendingSubmissions: [],
    complianceAlerts: [],
    staleLeads: [],
    pendingWioaDocs: 0,
    stalledApplications: [],
    noOutcomeEnrollments: [],
    missingFundingEnrollments: [],
    profile: null,
    generatedAt: new Date().toISOString(),
    sitePreviewTargets: FALLBACK_SITE_PREVIEW,
    degradedSections: [],
    systemHealth: FALLBACK_SYSTEM_HEALTH,
    isSuperAdmin: false,
  };

  const pendingApplications = normalizeRecentApplications(
    input.pendingApplications as RecentApplication[] | undefined,
  );
  const recentApplications = normalizeRecentApplications(input.recentApplications);

  return {
    counts: normalizeCounts(input.counts, pendingApplications.length || recentApplications.length),
    revenueAllTimeCents: asCount(input.revenueAllTimeCents, 0),
    totalStudents: asCount(input.totalStudents, 0),
    recentPayments: asObjectArray(input.recentPayments),
    operational: normalizeOperational(input.operational),
    priorities: normalizePriorities(input.priorities),
    kpis: normalizeKpis(input.kpis),
    enrollmentTrend: asObjectArray(input.enrollmentTrend),
    studentStatuses: asObjectArray(input.studentStatuses),
    topPrograms: normalizeTopPrograms(input.topPrograms),
    recentActivity: asObjectArray(input.recentActivity).map((item) => ({
      id: String(item.id ?? 'activity'),
      title: typeof item.title === 'string' ? item.title : 'Activity',
      timestamp:
        typeof item.timestamp === 'string' ? item.timestamp : new Date().toISOString(),
    })),
    recentStudents: normalizeRecentStudents(input.recentStudents),
    recentApplications,
    pendingApplications,
    blockedPrograms: asObjectArray(input.blockedPrograms),
    inactiveLearners: normalizeInactiveLearners(input.inactiveLearners),
    pendingSubmissions: asObjectArray(input.pendingSubmissions),
    complianceAlerts: asObjectArray(input.complianceAlerts),
    staleLeads: asObjectArray(input.staleLeads),
    pendingWioaDocs: asCount(input.pendingWioaDocs, 0),
    stalledApplications: asObjectArray(input.stalledApplications),
    noOutcomeEnrollments: asObjectArray(input.noOutcomeEnrollments),
    missingFundingEnrollments: asObjectArray(input.missingFundingEnrollments),
    profile: normalizeProfile(input.profile),
    generatedAt:
      typeof input.generatedAt === 'string' ? input.generatedAt : new Date().toISOString(),
    sitePreviewTargets: normalizeSitePreviewTargets(
      input.sitePreviewTargets,
      FALLBACK_SITE_PREVIEW,
    ),
    degradedSections: asArray(input.degradedSections).filter(
      (section): section is AdminDashboardData['degradedSections'][number] =>
        typeof section === 'string',
    ),
    systemHealth: normalizeSystemHealth(input.systemHealth),
    isSuperAdmin: input.isSuperAdmin === true || normalizeProfile(input.profile)?.role === 'admin',
  };
}
