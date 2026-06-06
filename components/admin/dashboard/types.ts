// Shared types for the admin dashboard — data layer → shell → section components.
// All route strings are resolved before reaching JSX (never built inline in render).

export interface KPICard {
  label: string;
  value: number;
  delta: number;
  deltaLabel: string;
  href: string;
  urgent?: boolean;
  sub?: string; // context line below the value
}

export interface EnrollmentTrendPoint {
  month: string; // e.g. "Jan"
  enrollments: number;
}

export interface StatusPoint {
  name: string;
  value: number;
}

export interface TopProgramPoint {
  id: string;
  title: string;
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
  href: string; // resolved: /admin/students/[id]
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
  href: string; // resolved: /admin/programs/[id]
}

export interface InactiveLearner {
  enrollmentId: string;
  userId: string;
  enrolledAt: string;
  fullName: string | null;
  email: string | null;
  daysInactive: number;
  programTitle: string | null;
  href: string; // resolved: /admin/students/[userId]
}

// Raw counts — typed source of truth for KPI rendering.
// DashboardShell reads from here, not from kpis[].value by label string.
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

// Sections that failed to load due to non-critical query errors.
// UI must render an explicit partial-failure notice when this is non-empty.
// An empty array means all sections loaded successfully.
export type DegradedSection =
  | 'inactive_learners'
  | 'unpublished_programs'
  | 'recent_students'
  | 'enrollments_by_program';

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
  /** DB column is 'title' — not 'message' */
  title: string | null;
  description: string | null;
  created_at: string | null;
}

export interface StaleLeadItem {
  id: string;
  /** Resolved from first_name + last_name or email */
  name: string | null;
  status: string | null;
  updated_at: string | null;
  days_stale: number;
  href: string;
}

export interface OperationalCounts {
  /** pending enrollments + pending WIOA docs */
  needsReview: number;
  needsReviewDetail: string;
  /** learners inactive 7+ days */
  atRisk: number;
  /** unresolved compliance_alerts */
  complianceAlerts: number;
  complianceAlertsSeverity: string | null;
  /** new leads + new enrollments created today */
  newToday: number;
  newTodayDetail: string;
  newAppsToday: number;
  newLeadsToday: number;
  newEnrollmentsToday: number;
  /** revenue this month in cents */
  revenueThisMonthCents: number;
}

export interface SitePreviewTarget {
  label: string;
  url: string;
}

export interface RecentPayment {
  id: string;
  /** Payer email — from stripe_sessions_staging or subscription tables */
  email: string | null;
  /** Amount in cents */
  amountCents: number;
  /** Program slug or product label */
  label: string | null;
  /** Payment source: 'stripe' | 'barber' | 'cosmetology' | 'barber_recurring' */
  source: string;
  paidAt: string;
}

export interface AdminDashboardData {
  counts: DashboardCounts;
  /** All-time tracked revenue in cents — shown in stats overview bar */
  revenueAllTimeCents: number;
  /** Total registered students (profiles with role=student) */
  totalStudents: number;
  /** Last 10 payments across all sources, newest first */
  recentPayments: RecentPayment[];
  operational: OperationalCounts;
  /** Scored and sorted priority items — top 10, ready to render directly */
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
  /** pending WIOA docs count */
  pendingWioaDocs: number;
  /** Applications stuck in submitted/pending for 7+ days */
  stalledApplications: Record<string, unknown>[];
  /** Completed enrollments with no outcome recorded */
  noOutcomeEnrollments: Record<string, unknown>[];
  /** Active enrollments missing a funding source */
  missingFundingEnrollments: Record<string, unknown>[];
  profile: { full_name: string | null } | null;
  generatedAt: string;
  sitePreviewTargets: SitePreviewTarget[];
  /** Non-empty when one or more non-critical sections failed to load. */
  degradedSections: DegradedSection[];
  systemHealth: SystemHealth;
  /** Derived from admin profile role — gates Lizzy secrets panel. */
  isSuperAdmin?: boolean;
}
