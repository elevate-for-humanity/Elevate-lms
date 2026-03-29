export interface DashboardData {
  counts: {
    students: number;
    programs: number;
    courses: number;
    enrollments: number;
    certificates: number;
    lessons: number;
    partners: number;
    atRisk: number;
    pendingEnrollments: number;
    pendingDocs: number;
    pendingApplications: number;
  };
  enrollmentsByMonth: Record<string, number>;
  studentStatuses: Record<string, number>;
  enrollmentStatuses: Record<string, number>;
  progressBuckets: Record<string, number>;
  programStatuses: Record<string, number>;
  topCourses: { name: string; enrollments: number }[];
  recentStudents: {
    id: string;
    full_name: string | null;
    email: string | null;
    enrollment_status: string | null;
    created_at: string | null;
    program_name: string | null;
  }[];
  recentApplications: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    email: string | null;
    program_interest: string | null;
    status: string;
    created_at: string;
  }[];
  recentActivity: {
    id: string;
    label: string;
    created_at: string;
  }[];
  totalRevenueCents: number;
  profile: { full_name: string | null; role: string | null } | null;
  /** ISO string — server snapshot time for display */
  generatedAt: string;
}
