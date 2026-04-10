import { Metadata } from 'next';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import { TrendingUp, Users, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import EnrollmentManagementClient from './EnrollmentManagementClient';
import AutomatedEnrollmentWorkflow from '@/components/AutomatedEnrollmentWorkflow';
import PendingAccessPanel from './PendingAccessPanel';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Enrollments | Admin',
};

export default async function AdminEnrollmentsPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await getAdminClient();

  // Students who paid but haven't been granted LMS access yet (pending admin review)
  const { data: pendingAccess } = await db
    .from('program_enrollments')
    .select('id, user_id, program_slug, enrolled_at, payment_status, amount_paid_cents')
    .is('access_granted_at', null)
    .eq('status', 'pending_review')
    .order('enrolled_at', { ascending: true });

  // Enrich with profile data
  const pendingWithProfiles = await Promise.all(
    (pendingAccess || []).map(async (e: any) => {
      const { data: p } = await db.from('profiles')
        .select('full_name, email, onboarding_completed')
        .eq('id', e.user_id).maybeSingle();
      return { ...e, profile: p };
    })
  );

  const { data: enrollments, error: enrollmentsError } = await db
    .from('program_enrollments')
    .select('*, student:profiles(id, full_name, email), course:courses(id, title)')
    .order('enrolled_at', { ascending: false });
  if (enrollmentsError) throw new Error(`program_enrollments query failed: ${enrollmentsError.message}`);

  // Supporting data — degrade gracefully if unavailable
  const { data: users } = await db.from('profiles').select('id, full_name, email').order('full_name');
  const { data: coursesRaw } = await db.from('courses').select('id, title').eq('is_active', true).order('title');
  const { data: cohortsRaw } = await db.from('cohorts').select('id, name, code, status').eq('status', 'active').order('name');

  const allEnrollments = enrollments;
  const stats = {
    total:     allEnrollments.length,
    active:    allEnrollments.filter((e: any) => e.status === 'active').length,
    completed: allEnrollments.filter((e: any) => e.status === 'completed').length,
    atRisk:    allEnrollments.filter((e: any) => e.at_risk).length,
    pending:   allEnrollments.filter((e: any) => ['pending', 'pending_approval', 'pending_review'].includes(e.status)).length,
  };

  return (
    <AdminPageShell
      title="Enrollments"
      description="Manage student program enrollments, approvals, and progress."
      breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Enrollments' }]}
      stats={[
        { label: 'Total',     value: stats.total,     icon: Users,         color: 'slate' },
        { label: 'Active',    value: stats.active,    icon: TrendingUp,    color: 'green' },
        { label: 'Pending',   value: stats.pending,   icon: Clock,         color: 'amber', alert: stats.pending > 0 },
        { label: 'Completed', value: stats.completed, icon: CheckCircle,   color: 'blue' },
        { label: 'At Risk',   value: stats.atRisk,    icon: AlertTriangle, color: 'red',   alert: stats.atRisk > 0 },
      ]}
    >
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
