// Normalized shape passed from page.tsx → DashboardClient.tsx

export interface KPICard {
  label: string;
  value: number;
  delta: number;        // % change vs prior period, 0 if unknown
  deltaLabel: string;
  href: string;
  urgent?: boolean;
}

export interface EnrollmentTrendPoint {
  month: string;        // e.g. "Jan", "Feb"
  enrollments: number;
}

export interface StatusPoint {
  name: string;         // e.g. "Active", "At Risk"
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
}

export interface RecentApplication {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  program_interest: string | null;
  status: string;
  created_at: string;
}

export interface BlockedProgram {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
}

export interface InactiveLearner {
  enrollmentId: string;
  userId: string;
  enrolledAt: string;
  fullName: string | null;
  email: string | null;
}

export interface DashboardData {
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
}
