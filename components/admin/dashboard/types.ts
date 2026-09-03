// Shared types for the admin dashboard — data layer → shell → section components.
// All route strings are resolved before reaching JSX (never built inline in render).

export interface KPICard {
  label: string;
  value: number;
  delta: number;
  deltaLabel: string;
  href: string;
  urgent?: boolean;
  sub?: string;
}

export interface EnrollmentTrendPoint {
  month: string;
  enrollments: number;
}

export interface StatusPoint {
  name: string;
  value: number;
}

export interface TopProgramPoint {
  id: string;
  title: string;
  /** Canonical program slug when available; ID remains the safe fallback route key. */
  slug?: string;
  learners: number;
  completed: number;
  completionRate: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  timestamp: string;
}

export interface RecentStudent {
  id: string;
  full_name: string | null;
  email: string | null;
  enrollment_status: string | null;
  created_at: string | null;
  program_name: string | null;
  href: string;
}

export interface RecentApplication {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  program_interest: string | null;
  status: string;
  created_at: string;
  submitted_at: string | null;
  age_days: number;
  urgent: boolean;
  href: string;
}

export interface BlockedProgram {
  id: string;
  title: string;
  slug: string;
  status: string;
  updatedAt: string;
  href: string;
}

export interface InactiveLearner {
  enrollmentId: string;
  userId: string;
  enrolledAt: string;
  fullName: string | null;
  email: string | null;
  daysInactive: number;
  programTitle: string | null;
  href: string;
}

export interface DashboardCounts {
  pendingApplications: number;
  activeEnrollments: number;
  revenueThisMonthCents: number;
  certificatesIssued: number;
  pendingProgramHolders: number;
  pendingDocuments: number;
}

export interface SystemHealthAlert {
  code: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

export interface SystemHealth {
  stripeWebhookOk: boolean;
  stripeIssuingOk: boolean;
  buildEnvOk: boolean;
  staleJobs: number;
  degraded: boolean;
  missingDocuments: number;
  missingCertifications: number;
  unresolvedFlags: number;
  alerts: SystemHealthAlert[];
}

export type DegradedSection =
  | 'inactive_learners'
  | 'unpublished_programs'
  | 'recent_students'
  | 'enrollments_by_program'
  | 'dashboard_data';

export interface PendingSubmission {
  id: string;
  user_id: string | null;
  course_lesson_id: string | null;
  step_type: string | null;
  submitted_at: string | null;
  status: string;
}

export interface ComplianceAlert {
  id: string;
  alert_type: string | null;
  severity: string | null;
  title: string | null;
  description: string | null;
  created_at: string | null;
}

export interface StaleLeadItem {
  id: string;
  name: string | null;
  status: string | null;
  updated_at: string | null;
  days_stale: number;
  href: string;
}

export interface OperationalCounts {
  needsReview: number;
  needsReviewDetail: string;
  atRisk: number;
  complianceAlerts: number;
  complianceAlertsSeverity: string | null;
  newToday: number;
  newTodayDetail: string;
  newAppsToday: number;
  newLeadsToday: number;
  newEnrollmentsToday: number;
  revenueThisMonthCents: number;
}

export interface SitePreviewTarget {
  label: string;
  url: string;
}

export interface RecentPayment {
  id: string;
  email: string | null;
  amountCents: number;
  label: string | null;
  source: string;
  paidAt: string;
}

export interface AdminDashboardData {
  counts: DashboardCounts;
  revenueAllTimeCents: number;
  totalStudents: number;
  recentPayments: RecentPayment[];
  operational: OperationalCounts;
  priorities: import('@/lib/admin/priority-score').PriorityItem[];
  kpis: KPICard[];
  enrollmentTrend: EnrollmentTrendPoint[];
  studentStatuses: StatusPoint[];
  topPrograms: TopProgramPoint[];
  recentActivity: ActivityItem[];
  recentStudents: RecentStudent[];
  recentApplications: RecentApplication[];
  pendingApplications: RecentApplication[];
  blockedPrograms: BlockedProgram[];
  inactiveLearners: InactiveLearner[];
  pendingSubmissions: PendingSubmission[];
  complianceAlerts: ComplianceAlert[];
  staleLeads: StaleLeadItem[];
  pendingWioaDocs: number;
  stalledApplications: Record<string, unknown>[];
  noOutcomeEnrollments: Record<string, unknown>[];
  missingFundingEnrollments: Record<string, unknown>[];
  profile: { full_name: string | null; role?: string } | null;
  generatedAt: string;
  sitePreviewTargets: SitePreviewTarget[];
  degradedSections: DegradedSection[];
  systemHealth: SystemHealth;
  isSuperAdmin?: boolean;
}
