// Shared types for the admin dashboard — data layer → shell → section components.
// All route strings are resolved before reaching JSX (never built inline in render).

export interface KPICard {
  label: string;
  value: number;
  delta: number;
  deltaLabel: string;
  href: string;
  urgent?: boolean;
  sub?: string;         // context line below the value
}

export interface EnrollmentTrendPoint {
  month: string;        // e.g. "Jan"
  enrollments: number;
}

export interface StatusPoint {
  name: string;
  value: number;
}

export interface TopProgramPoint {
  id: string;
  name: string;
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
  href: string;         // resolved: /admin/students/[id]
}

export interface RecentApplication {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  program_interest: string | null;
  status: string;
  created_at: string;
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
  href: string;         // resolved: /admin/programs/[id]
}

export interface InactiveLearner {
  enrollmentId: string;
  userId: string;
  enrolledAt: string;
  fullName: string | null;
  email: string | null;
  href: string;         // resolved: /admin/students/[userId]
}

// Raw counts — typed source of truth for KPI rendering.
// DashboardShell reads from here, not from kpis[].value by label string.
export interface DashboardCounts {
  pendingApplications: number;
  activeEnrollments: number;
  revenueThisMonthCents: number;
  certificatesIssued: number;
}

// Sections that failed to load due to non-critical query errors.
// UI must render an explicit partial-failure notice when this is non-empty.
// An empty array means all sections loaded successfully.
export type DegradedSection =
  | 'inactive_learners'
  | 'unpublished_programs'
  | 'recent_students'
  | 'enrollments_by_program';

export interface AdminDashboardData {
  counts: DashboardCounts;
  kpis: KPICard[];
  enrollmentTrend: EnrollmentTrendPoint[];
  studentStatuses: StatusPoint[];
  topPrograms: TopProgramPoint[];
  recentActivity: ActivityItem[];
  recentStudents: RecentStudent[];
  recentApplications: RecentApplication[];
  blockedPrograms: BlockedProgram[];
  inactiveLearners: InactiveLearner[];
  profile: { full_name: string | null } | null;
  generatedAt: string;
  /** Non-empty when one or more non-critical sections failed to load. */
  degradedSections: DegradedSection[];
}
