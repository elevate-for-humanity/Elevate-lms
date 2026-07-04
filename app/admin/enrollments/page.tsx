import { Metadata } from 'next';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import { TrendingUp, Users, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import Link from 'next/link';
import { AdminPageShell, AdminFilterBar } from '@/components/admin/AdminPageShell';
import EnrollmentManagementClient from './EnrollmentManagementClient';
import AutomatedEnrollmentWorkflow from '@/components/AutomatedEnrollmentWorkflow';
import PendingAccessPanel from './PendingAccessPanel';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Enrollments | Admin',
};

export default async function AdminEnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; status?: string }>;
}) {
  await requireRole(['admin', 'super_admin', 'staff']);
  const params = await searchParams;
  const programFilter = params.program || '';
  const statusFilter = params.status || '';
  const db = await requireAdminClient();

  // Students who completed onboarding but haven't been granted LMS access yet
  const { data: pendingAccess } = await db
    .from('program_enrollments')
    .select('id, user_id, program_slug, enrolled_at, payment_status, amount_paid_cents')
    .is('access_granted_at', null)
    .in('enrollment_state', ['onboarding', 'documents_complete', 'orientation_complete'])
    .order('enrolled_at', { ascending: true });

  // Enrich with profile data
  const pendingWithProfiles = await Promise.all(
    (pendingAccess || []).map(async (e: any) => {
      const { data: p } = await db
        .from('profiles')
        .select('full_name, email, onboarding_completed')
        .eq('id', e.user_id)
        .maybeSingle();
      return { ...e, profile: p };
    }),
  );

  let enrollmentsQuery = db
    .from('program_enrollments')
    .select('*, course:courses(id, title)')
    .order('enrolled_at', { ascending: false });
  if (programFilter) enrollmentsQuery = enrollmentsQuery.eq('program_slug', programFilter);
  if (statusFilter) enrollmentsQuery = enrollmentsQuery.eq('enrollment_state', statusFilter);

  const { data: rawEnrollments, error: enrollmentsError } = await enrollmentsQuery;
  if (enrollmentsError) console.error('[Enrollments] query failed:', enrollmentsError.message);

  // Supporting data — degrade gracefully if unavailable
  const { data: users } = await db
    .from('profiles')
    .select('id, full_name, email')
    .order('full_name');

  // Hydrate student profiles separately (user_id → auth.users, no FK to profiles)
  const enrollUserIds = [
    ...new Set((rawEnrollments ?? []).map((e: any) => e.user_id).filter(Boolean)),
  ];
  const enrollProfileMap = Object.fromEntries(
    (users ?? []).filter((p: any) => enrollUserIds.includes(p.id)).map((p: any) => [p.id, p]),
  );
  const enrollments = (rawEnrollments ?? []).map((e: any) => ({
    ...e,
    student: enrollProfileMap[e.user_id] ?? null,
  }));
  const { data: coursesRaw } = await db
    .from('courses')
    .select('id, title')
    .eq('is_active', true)
    .order('title');
  const { data: cohortsRaw } = await db
    .from('cohorts')
    .select('id, name, code, status')
    .eq('status', 'active')
    .order('name');

  const allEnrollments = enrollments;
  const stats = {
    total: allEnrollments.length,
    active: allEnrollments.filter((e: any) => (e.enrollment_state ?? e.status) === 'active').length,
    completed: allEnrollments.filter((e: any) => (e.enrollment_state ?? e.status) === 'completed')
      .length,
    atRisk: allEnrollments.filter((e: any) => e.at_risk).length,
    pending: allEnrollments.filter((e: any) =>
      ['applied', 'onboarding', 'orientation_complete', 'documents_complete'].includes(e.enrollment_state ?? e.status),
    ).length,
  };

  return (
    <AdminPageShell
      title="Enrollments"
      description="Manage student program enrollments, approvals, and progress."
      breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Enrollments' }]}
      stats={[
        { label: 'Total', value: stats.total, icon: Users, color: 'slate' },
        { label: 'Active', value: stats.active, icon: TrendingUp, color: 'green' },
        {
          label: 'Pending',
          value: stats.pending,
          icon: Clock,
          color: 'amber',
          alert: stats.pending > 0,
        },
        { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'blue' },
        {
          label: 'At Risk',
          value: stats.atRisk,
          icon: AlertTriangle,
          color: 'red',
          alert: stats.atRisk > 0,
        },
      ]}
    >
      {/* Program / status filters */}
      <AdminFilterBar>
        <form method="GET" className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Program</label>
            <select
              name="program"
              defaultValue={programFilter || 'all'}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-blue-500 focus:outline-none"
            >
              <option value="all">All Programs</option>
              <option value="cdl-training">CDL Training</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
            <select
              name="status"
              defaultValue={statusFilter || 'all'}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-blue-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="pending_review">Pending Review</option>
              <option value="completed">Completed</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            Filter
          </button>
          <Link
            href="/admin/enrollments"
            className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors"
          >
            Clear
          </Link>
        </form>
      </AdminFilterBar>

      {/* Pending access — students who paid + completed onboarding, waiting for admin grant */}
      {pendingWithProfiles.length > 0 && (
        <div className="mb-8">
          <PendingAccessPanel enrollments={pendingWithProfiles} />
        </div>
      )}

      <div className="mb-6">
        <AutomatedEnrollmentWorkflow showStats={false} />
      </div>
      <EnrollmentManagementClient
        initialEnrollments={allEnrollments}
        users={users || []}
        courses={(coursesRaw || []).map((c: any) => ({ id: c.id, title: c.title }))}
        cohorts={cohortsRaw || []}
        stats={stats}
      />
    </AdminPageShell>
  );
}
