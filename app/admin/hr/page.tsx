import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, Clock, Calendar, DollarSign, Star, AlertCircle, User, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'HR Dashboard | Elevate For Humanity',
  description: 'Human resources management dashboard.',
};

export default async function HRPage() {
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;

  if (!supabase) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div>
    </div>
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/hr');

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const [
    { data: employees, count: employeeCount },
    { data: pendingLeave, count: pendingLeaveCount },
    { data: pendingTimeOff, count: pendingTimeOffCount },
    { data: recentPayroll },
    { data: recentReviews },
  ] = await Promise.all([
    db.from('employees').select('id, first_name, last_name, department, role, status, created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(8),
    db.from('leave_requests').select('id, employee_id, leave_type, start_date, end_date, status', { count: 'exact' }).eq('status', 'pending').limit(5),
    db.from('time_off_requests').select('id, employee_id, start_date, end_date, status', { count: 'exact' }).eq('status', 'pending').limit(5),
    db.from('payroll_runs').select('id, period_start, period_end, total_amount, status').order('period_start', { ascending: false }).limit(5),
    db.from('performance_reviews').select('id, employee_id, review_date, rating, status').order('review_date', { ascending: false }).limit(5),
  ]);

  const activeEmployees = (employees || []).filter((e: any) => e.status === 'active').length;
  const totalPending = (pendingLeaveCount || 0) + (pendingTimeOffCount || 0);

  const deptCounts: Record<string, number> = {};
  for (const emp of (employees || [])) {
    const dept = (emp as any).department || 'Unassigned';
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  }

  const statusBadge: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-600',
    on_leave: 'bg-yellow-100 text-yellow-700',
    terminated: 'bg-red-100 text-red-700',
  };

  const payrollStatusBadge: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-brand-blue-100 text-brand-blue-700',
    failed: 'bg-red-100 text-red-700',
  };

  const modules = [
    { name: 'Employees', href: '/admin/hr/employees', icon: Users, value: (employeeCount || 0).toString(), sub: `${activeEmployees} active`, color: 'text-brand-blue-600', bg: 'bg-brand-blue-50' },
    { name: 'Leave Requests', href: '/admin/hr/leave', icon: Calendar, value: (pendingLeaveCount || 0).toString(), sub: 'pending approval', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { name: 'Time Off', href: '/admin/hr/time', icon: Clock, value: (pendingTimeOffCount || 0).toString(), sub: 'pending approval', color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'Payroll', href: '/admin/hr/payroll', icon: DollarSign, value: recentPayroll && recentPayroll.length > 0 ? `$${Number((recentPayroll[0] as any).total_amount || 0).toLocaleString()}` : '$0', sub: 'last run', color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'HR' }]} />
          <div className="flex justify-between items-center mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">HR Dashboard</h1>
              <p className="text-gray-600 mt-1">Human resources management</p>
            </div>
            <Link href="/admin/hr/employees/new" className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 text-sm font-medium">
              Add Employee
            </Link>
          </div>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {modules.map((m) => (
            <Link key={m.href} href={m.href} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 ${m.bg} rounded-lg flex items-center justify-center mb-3`}>
                <m.icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{m.value}</p>
              <p className="text-sm font-medium text-gray-700 mt-1">{m.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{m.sub}</p>
            </Link>
          ))}
        </div>

        {totalPending > 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">{totalPending} pending request{totalPending !== 1 ? 's' : ''}</span> require your approval —{' '}
              {pendingLeaveCount ? <Link href="/admin/hr/leave" className="underline">{pendingLeaveCount} leave</Link> : null}
              {pendingLeaveCount && pendingTimeOffCount ? ', ' : ''}
              {pendingTimeOffCount ? <Link href="/admin/hr/time" className="underline">{pendingTimeOffCount} time off</Link> : null}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Employee List */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-base font-semibold text-gray-900">Recent Employees</h2>
              <Link href="/admin/hr/employees" className="text-sm text-brand-blue-600 hover:text-brand-blue-800 flex items-center gap-1">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="divide-y">
              {employees && employees.length > 0 ? employees.map((emp: any) => (
                <div key={emp.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-brand-blue-600 font-medium text-sm">{(emp.first_name || 'E')[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{emp.first_name} {emp.last_name}</p>
                      <p className="text-xs text-gray-500">{emp.department || 'Unassigned'} · {emp.role || '—'}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusBadge[emp.status] || 'bg-gray-100 text-gray-600'}`}>
                    {emp.status || 'active'}
                  </span>
                </div>
              )) : (
                <div className="p-8 text-center text-gray-500 text-sm">No employees yet — <Link href="/admin/hr/employees/new" className="text-brand-blue-600 hover:underline">add one</Link></div>
              )}
            </div>
          </div>

          {/* Payroll Runs */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-base font-semibold text-gray-900">Recent Payroll Runs</h2>
              <Link href="/admin/hr/payroll" className="text-sm text-brand-blue-600 hover:text-brand-blue-800 flex items-center gap-1">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="divide-y">
              {recentPayroll && recentPayroll.length > 0 ? recentPayroll.map((run: any) => (
                <div key={run.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {run.period_start ? new Date(run.period_start).toLocaleDateString() : '—'} – {run.period_end ? new Date(run.period_end).toLocaleDateString() : '—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">${Number(run.total_amount || 0).toLocaleString()} total</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${payrollStatusBadge[run.status] || 'bg-gray-100 text-gray-600'}`}>
                    {run.status || 'pending'}
                  </span>
                </div>
              )) : (
                <div className="p-8 text-center text-gray-500 text-sm">No payroll runs yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Department Breakdown */}
        {Object.keys(deptCounts).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Headcount by Department</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(deptCounts).map(([dept, count]) => (
                <div key={dept} className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-sm text-gray-600 mt-1">{dept}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
