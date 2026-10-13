import { Metadata } from 'next';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import { studentMatchesSearch } from '@/lib/admin/student-search';
import Link from 'next/link';
import { Users, TrendingUp, Clock, CheckCircle, Mail, Phone, UserPlus } from 'lucide-react';
import { AdminPageShell, AdminCard, AdminEmptyState } from '@/components/admin/AdminPageShell';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Students | Admin',
};

// Map enrollment_state to a display badge
function EnrollmentBadge({
  state,
  accessGranted,
}: {
  state: string | null;
  accessGranted: boolean;
}) {
  if (accessGranted) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
        ● Active
      </span>
    );
  }
  if (!state) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
        No enrollment
      </span>
    );
  }
  const map: Record<string, { bg: string; text: string; label: string }> = {
    applied: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Applied' },
    onboarding: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Onboarding' },
    orientation: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Orientation' },
    enrolled: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending Approval' },
    active: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending Approval' },
    waitlisted: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Waitlisted' },
    suspended: { bg: 'bg-red-100', text: 'text-red-700', label: 'Suspended' },
    revoked: { bg: 'bg-red-100', text: 'text-red-700', label: 'Revoked' },
    withdrawn: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Withdrawn' },
    completed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Completed' },
    graduated: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Graduated' },
  };
  const style = map[state] ?? { bg: 'bg-slate-100', text: 'text-slate-500', label: state };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}

function isTestOrAuditProfile(student: { email?: string | null; full_name?: string | null }) {
  const email = String(student.email || '').toLowerCase();
  const name = String(student.full_name || '').toLowerCase();
  return (
    email.endsWith('.test') ||
    email.endsWith('@qa.invalid') ||
    email.endsWith('@elevate-test.dev') ||
    email.endsWith('@test.elevateforhumanity.org') ||
    email.endsWith('@example.com') ||
    name.startsWith('[qa') ||
    ['test admin', 'upload tester', 'final tester', 'v2 test', 'dev studio'].includes(name)
  );
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ include_test?: string; search?: string }>;
}) {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();
  const params = await searchParams;
  const includeTest = params.include_test === '1';
  const search = (params.search ?? '').trim();

  // Load students with their most recent enrollment
  const { data: operationalStudents, error: profilesError } = await db
    .from('profiles')
    .select('id, full_name, first_name, last_name, email, phone, created_at, role')
    .eq('role', 'student')
    .like('email', '%@%')
    .not('email', 'ilike', '%@qa.invalid')
    .not('full_name', 'ilike', '[QA%')
    .order('created_at', { ascending: false })
    .limit(1000);

  // The directory previously truncated to the 50 newest profiles, which hid
  // valid active students such as older HVAC enrollments. The operational set
  // is already bounded to 1,000 and filtered above, so render the full set.
  const allStudents = operationalStudents ?? [];
  const testRecordCount = allStudents.filter(isTestOrAuditProfile).length;
  const eligibleStudents = includeTest
    ? allStudents
    : allStudents.filter((student) => !isTestOrAuditProfile(student));
  const students = eligibleStudents.filter((student) => studentMatchesSearch(student, search));
  const totalStudents = allStudents.length - testRecordCount;
  const operationalStudentIds = allStudents
    .filter((student) => !isTestOrAuditProfile(student))
    .map((student: any) => student.id);

  // Load enrollments for displayed students to show real state.
  const studentIds = students.map((student: any) => student.id);
  const { data: enrollments, error: enrollmentError } =
    studentIds.length > 0
      ? await db
          .from('program_enrollments')
          .select('user_id, enrollment_state, access_granted_at, program_slug')
          .in('user_id', studentIds)
          .order('enrolled_at', { ascending: false })
      : { data: [], error: null };

  // Index: user_id → most recent enrollment
  const enrollmentByUser: Record<string, any> = {};
  for (const e of enrollments ?? []) {
    if (!enrollmentByUser[e.user_id]) enrollmentByUser[e.user_id] = e;
  }

  // Real counts — access_granted_at is the canonical "active" gate
  const { count: activeEnrollments, error: activeError } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .not('access_granted_at', 'is', null)
    .in(
      'user_id',
      operationalStudentIds.length
        ? operationalStudentIds
        : ['00000000-0000-0000-0000-000000000000'],
    );

  const { count: pendingApproval, error: pendingError } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .is('access_granted_at', null)
    .in('enrollment_state', ['active', 'enrolled', 'onboarding', 'orientation'])
    .in(
      'user_id',
      operationalStudentIds.length
        ? operationalStudentIds
        : ['00000000-0000-0000-0000-000000000000'],
    );

  const { count: completedEnrollments, error: completedError } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('enrollment_state', 'completed')
    .in(
      'user_id',
      operationalStudentIds.length
        ? operationalStudentIds
        : ['00000000-0000-0000-0000-000000000000'],
    );

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { count: recentStudents } = await db
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student')
    .like('email', '%@%')
    .not('email', 'ilike', '%@qa.invalid')
    .not('full_name', 'ilike', '[QA%')
    .gte('created_at', weekAgo.toISOString());

  return (
    <AdminPageShell
      title="Students"
      description="View and manage all registered students and their enrollment status."
      breadcrumbs={[{ label: 'Admin', href: '/dashboard' }, { label: 'Students' }]}
      stats={[
        {
          label: 'Total Students',
          value: profilesError ? 'Unavailable' : totalStudents,
          icon: Users,
          color: 'slate',
        },
        {
          label: 'Access Granted',
          value:
            profilesError || activeError ? 'Unavailable' : (activeEnrollments ?? 'Unavailable'),
          icon: TrendingUp,
          color: 'green',
        },
        {
          label: 'Pending Approval',
          value: profilesError || pendingError ? 'Unavailable' : (pendingApproval ?? 'Unavailable'),
          icon: Clock,
          color: 'amber',
        },
        {
          label: 'Completed',
          value:
            profilesError || completedError
              ? 'Unavailable'
              : (completedEnrollments ?? 'Unavailable'),
          icon: CheckCircle,
          color: 'blue',
        },
      ]}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href={includeTest ? '/students' : '/students?include_test=1'}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg border border-white/20 transition-colors"
          >
            {includeTest ? 'Operational records' : `Test & audit records (${testRecordCount})`}
          </Link>
          <Link
            href="/students/export"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg border border-white/20 transition-colors"
          >
            Export CSV
          </Link>
        </div>
      }
    >
      {search && (
        <div className="flex items-center justify-between gap-3 px-1 text-sm text-slate-700">
          <p>
            {students.length} student matches for “{search}”
          </p>
          <Link
            href={includeTest ? '/students?include_test=1' : '/students'}
            className="font-semibold text-blue-700"
          >
            Clear search
          </Link>
        </div>
      )}
      <AdminCard>
        {students && students.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <div className="col-span-3">Student</div>
                <div className="col-span-3">Contact</div>
                <div className="col-span-2">Program</div>
                <div className="col-span-2">Enrollment</div>
                <div className="col-span-1">Joined</div>
                <div className="col-span-1"></div>
              </div>
              {students.map((student: any) => {
                const enr = enrollmentByUser[student.id];
                return (
                  <div
                    key={student.id}
                    className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-slate-50 transition-colors border-t border-slate-100"
                  >
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-brand-blue-700 font-bold text-xs">
                          {(student.full_name || student.first_name || '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 leading-tight truncate">
                          {student.full_name ||
                            `${student.first_name || ''} ${student.last_name || ''}`.trim() ||
                            'Unnamed'}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-3 space-y-0.5 min-w-0">
                      {student.email && (
                        <p className="text-xs text-slate-600 flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          {student.email}
                        </p>
                      )}
                      {student.phone && (
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          {student.phone}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2 min-w-0">
                      {enr?.program_slug ? (
                        <p className="text-xs text-slate-600 truncate">
                          {enr.program_slug.replace(/-/g, ' ')}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400">—</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      {enrollmentError ? (
                        <span className="text-xs text-amber-700">Enrollment unavailable</span>
                      ) : (
                        <EnrollmentBadge
                          state={enr?.enrollment_state ?? null}
                          accessGranted={Boolean(enr?.access_granted_at)}
                        />
                      )}
                    </div>
                    <div className="col-span-1">
                      <p className="text-xs text-slate-500">
                        {new Date(student.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="col-span-1 text-right">
                      <Link
                        href={`/students/${student.id}`}
                        className="text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <AdminEmptyState
            message={
              profilesError
                ? 'Student records are unavailable.'
                : search
                  ? 'No students match this search.'
                  : 'No students registered yet.'
            }
          />
        )}
      </AdminCard>
    </AdminPageShell>
  );
}
