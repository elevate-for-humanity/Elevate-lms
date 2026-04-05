import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Activity, Clock, AlertTriangle, CheckCircle, FileText, Users, Zap, Shield } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Operations Dashboard | Elevate For Humanity',
  description: 'Monitor daily operations and system activities.',
};

export default async function OperationsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/operations');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  const [
    { data: recentAuditLogs },
    { count: todayEnrollments },
    { count: pendingApplications },
    { count: pendingReview },
    { count: totalUsers },
    { data: enrollmentJobs },
    { data: recentFollowUps },
  ] = await Promise.all([
    supabase.from('audit_logs').select('id, action, resource_type, created_at, user_id').order('created_at', { ascending: false }).limit(20),
    supabase.from('program_enrollments').select('id', { count: 'exact', head: true }).gte('enrolled_at', todayISO),
    supabase.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('review_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('enrollment_jobs').select('id, status, created_at, error_message').order('created_at', { ascending: false }).limit(10),
    supabase.from('follow_ups').select('id, type, due_date, status, notes').order('due_date', { ascending: true }).limit(10),
  ]);

  const failedJobs = (enrollmentJobs || []).filter((j: any) => j.status === 'failed').length;
  const pendingJobs = (enrollmentJobs || []).filter((j: any) => j.status === 'pending').length;

  const actionColors: Record<string, string> = {
    create: 'text-green-600 bg-green-50',
    update: 'text-brand-blue-600 bg-brand-blue-50',
    delete: 'text-red-600 bg-red-50',
    login: 'text-purple-600 bg-purple-50',
    export: 'text-yellow-600 bg-yellow-50',
  };

  const jobStatusBadge: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-brand-blue-100 text-brand-blue-700',
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Operations' }]} />
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">Operations Dashboard</h1>
            <p className="text-gray-600 mt-1">Daily operations, jobs, and system activity</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{todayEnrollments || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Enrollments Today</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{(pendingApplications || 0) + (pendingReview || 0)}</p>
            <p className="text-sm text-gray-500 mt-1">Pending Actions</p>
            <p className="text-xs text-gray-400 mt-1">{pendingApplications || 0} apps · {pendingReview || 0} reviews</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{failedJobs}</p>
            <p className="text-sm text-gray-500 mt-1">Failed Jobs</p>
            <p className="text-xs text-gray-400 mt-1">{pendingJobs} pending</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-brand-blue-50 rounded-lg flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-brand-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{(totalUsers || 0).toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">Total Users</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Enrollment Jobs */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-blue-600" /> Enrollment Jobs
              </h2>
              <Link href="/admin/enrollment-jobs" className="text-sm text-brand-blue-600 hover:text-brand-blue-800">View all</Link>
            </div>
            <div className="divide-y">
              {enrollmentJobs && enrollmentJobs.length > 0 ? enrollmentJobs.map((job: any) => (
                <div key={job.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 font-mono">{job.id.slice(0, 8)}…</p>
                    {job.error_message && <p className="text-xs text-red-500 mt-0.5 truncate max-w-xs">{job.error_message}</p>}
                    <p className="text-xs text-gray-400">{job.created_at ? new Date(job.created_at).toLocaleString() : '—'}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${jobStatusBadge[job.status] || 'bg-gray-100 text-gray-600'}`}>
                    {job.status}
                  </span>
                </div>
              )) : (
                <div className="p-8 text-center text-gray-500 text-sm">No enrollment jobs</div>
              )}
            </div>
          </div>

          {/* Follow-ups */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-orange-600" /> Upcoming Follow-ups
              </h2>
              <Link href="/admin/automation" className="text-sm text-brand-blue-600 hover:text-brand-blue-800">Automation</Link>
            </div>
            <div className="divide-y">
              {recentFollowUps && recentFollowUps.length > 0 ? recentFollowUps.map((f: any) => (
                <div key={f.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">{f.type?.replace('_', ' ') || 'Follow-up'}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{f.notes || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{f.due_date ? new Date(f.due_date).toLocaleDateString() : '—'}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${f.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {f.status || 'pending'}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-gray-500 text-sm">No follow-ups scheduled</div>
              )}
            </div>
          </div>
        </div>

        {/* Audit Log */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-5 border-b flex justify-between items-center">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-600" /> Recent Audit Log
            </h2>
            <Link href="/admin/audit-logs" className="text-sm text-brand-blue-600 hover:text-brand-blue-800">Full log</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Resource</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentAuditLogs && recentAuditLogs.length > 0 ? recentAuditLogs.map((log: any) => {
                  const actionKey = (log.action || '').toLowerCase().split('_')[0];
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${actionColors[actionKey] || 'text-gray-600 bg-gray-100'}`}>
                          {log.action || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{log.resource_type?.replace('_', ' ') || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{log.created_at ? new Date(log.created_at).toLocaleString() : '—'}</td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">No audit log entries</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
