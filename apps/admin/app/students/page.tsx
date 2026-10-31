import {
  loadStudentDirectory,
  directoryEnrollmentState,
} from '@/lib/admin/student-directory-enrollments';
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
  const normalized = String(state ?? '').toLowerCase();
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    applied: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Applied · Review pending' },
    pending_approval: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Approval pending' },
    onboarding: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Onboarding' },
    orientation: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Orientation' },
    payment_required: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Payment required' },
    waitlisted: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Waitlisted' },
    suspended: { bg: 'bg-red-100', text: 'text-red-800', label: 'Suspended' },
    revoked: { bg: 'bg-red-100', text: 'text-red-800', label: 'Revoked' },
    withdrawn: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Withdrawn' },
    completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completed' },
    graduated: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Graduated' },
  };
  // Enrollment and LMS provisioning are independent. Do not turn active,
  // completed, suspended, or revoked records into a misleading approval state.
  const style = ['active', 'enrolled'].includes(normalized)
    ? {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: accessGranted ? 'Enrolled · Access granted' : 'Enrolled · Access pending',
      }
    : (styles[normalized] ??
      (normalized
        ? { bg: 'bg-slate-100', text: 'text-slate-700', label: normalized.replace(/_/g, ' ') }
        : { bg: 'bg-slate-100', text: 'text-slate-600', label: 'No enrollment' }));
  return (
    <span
      className={`inline-block max-w-full break-words rounded-lg px-2 py-1 text-xs font-semibold leading-tight ${style.bg} ${style.text}`}
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
    email.endsWith('@elevatetest.com') ||
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

  const { profiles: allStudents, enrollments } = await loadStudentDirectory(db);
  const profilesError = null;
  const enrollmentError = null;
  const activeError = null;
  const pendingError = null;
  const completedError = null;
  const testRecordCount = allStudents.filter(isTestOrAuditProfile).length;
  const eligibleStudents = includeTest
    ? allStudents
    : allStudents.filter((student) => !isTestOrAuditProfile(student));
  const students = eligibleStudents.filter((student) => studentMatchesSearch(student, search));
  const operationalStudents = allStudents.filter((student) => !isTestOrAuditProfile(student));
  const totalStudents = operationalStudents.length;
  const operationalStudentIds = new Set(operationalStudents.map((student) => student.id));
  const enrollmentByUser: Record<string, (typeof enrollments)[number]> = {};
  for (const enrollment of enrollments) {
    const userId = enrollment.user_id ?? enrollment.student_id;
    if (userId && !enrollmentByUser[userId])
      enrollmentByUser[userId] = {
        ...enrollment,
        enrollment_state: directoryEnrollmentState(enrollment),
      };
  }
  const countStudents = (states: string[], access = false) =>
    new Set(
      enrollments
        .filter(
          (e) =>
            operationalStudentIds.has(e.user_id ?? e.student_id) &&
            states.includes(directoryEnrollmentState(e) ?? '') &&
            (!access || e.access_granted_at),
        )
        .map((e) => e.user_id ?? e.student_id),
    ).size;
  const activeEnrollments = countStudents(['active', 'enrolled', 'in_progress', 'confirmed'], true);
  const pendingApproval = countStudents(['applied', 'pending_approval']);
  const completedEnrollments = countStudents(['completed', 'graduated']);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentStudents = operationalStudents.filter(
    (student) => student.created_at && new Date(student.created_at) >= weekAgo,
  ).length;

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
          label: 'Enrolled Students',
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
          <>
            <div className="space-y-3 p-3 sm:hidden">
              {students.map((student: any) => {
                const enr = enrollmentByUser[student.id];
                return (
                  <article
                    key={student.id}
                    className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="break-words font-semibold text-slate-900">
                          {student.full_name ||
                            `${student.first_name || ''} ${student.last_name || ''}`.trim() ||
                            'Unnamed'}
                        </h3>
                        <p className="mt-1 break-words text-sm text-slate-600">{student.email}</p>
                        {student.phone && (
                          <p className="mt-1 text-sm text-slate-600">{student.phone}</p>
                        )}
                      </div>
                      <div className="shrink-0">
                        {enrollmentError ? (
                          <span className="text-xs text-amber-700">Enrollment unavailable</span>
                        ) : (
                          <EnrollmentBadge
                            state={enr?.enrollment_state ?? null}
                            accessGranted={Boolean(enr?.access_granted_at)}
                          />
                        )}
                      </div>
                    </div>
                    <p className="mt-3 break-words text-sm capitalize text-slate-700">
                      {enr?.program_slug?.replace(/-/g, ' ') || 'Program not assigned'}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <span className="text-xs text-slate-500">
                        Joined {new Date(student.created_at).toLocaleDateString()}
                      </span>
                      <Link
                        href={`/students/${student.id}`}
                        className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-brand-blue-700"
                      >
                        View student →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="hidden overflow-x-auto sm:block">
              <div className="min-w-[600px]">
                {/* Table header */}
                <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-600">
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
                            {(student.full_name || student.first_name || '?')
                              .charAt(0)
                              .toUpperCase()}
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
          </>
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
