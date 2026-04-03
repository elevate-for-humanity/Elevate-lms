import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { TrendingUp, Users, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import EnrollmentManagementClient from './EnrollmentManagementClient';
import AutomatedEnrollmentWorkflow from '@/components/AutomatedEnrollmentWorkflow';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Enrollments | Admin',
};

export default async function AdminEnrollmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'super_admin', 'staff'].includes(profile?.role ?? '')) redirect('/unauthorized');

  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select('*, student:profiles(id, full_name, email), course:courses(id, title)')
    .order('enrolled_at', { ascending: false });

  const { data: users } = await supabase.from('profiles').select('id, full_name, email').order('full_name');
  const { data: coursesRaw } = await supabase.from('courses').select('id, title').eq('is_active', true).order('title');
  const { data: cohortsRaw } = await supabase.from('cohorts').select('id, name, code, status').eq('status', 'active').order('name');

  const allEnrollments = enrollments || [];
  const stats = {
    total:     allEnrollments.length,
    active:    allEnrollments.filter((e: any) => e.status === 'active').length,
    completed: allEnrollments.filter((e: any) => e.status === 'completed').length,
    atRisk:    allEnrollments.filter((e: any) => e.at_risk).length,
    pending:   allEnrollments.filter((e: any) => ['pending', 'pending_approval'].includes(e.status)).length,
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
