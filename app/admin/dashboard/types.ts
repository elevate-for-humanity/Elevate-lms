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
  }[];
  profile: { full_name: string | null; role: string | null } | null;
  /** ISO string — server snapshot time for display */
  generatedAt: string;
}
