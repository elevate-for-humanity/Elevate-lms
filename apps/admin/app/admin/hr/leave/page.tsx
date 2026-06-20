import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/hr/leave' },
  title: 'Leave Management | Elevate For Humanity',
  description: 'Manage employee leave requests and balances.',
};

export default async function LeavePage() {
  await requireRole(['admin', 'super_admin']);
  const supabase = await createClient();

  const { data: rawLeaveRequests } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  // Hydrate profiles via employee_id (no FK to profiles)
  const leaveEmpIds = [
    ...new Set((rawLeaveRequests ?? []).map((r: any) => r.employee_id).filter(Boolean)),
  ];
  const { data: leaveProfiles } = leaveEmpIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', leaveEmpIds)
    : { data: [] };
  const leaveProfileMap = Object.fromEntries((leaveProfiles ?? []).map((p: any) => [p.id, p]));
  const requests = (rawLeaveRequests ?? []).map((r: any) => ({
    ...r,
    profiles: leaveProfileMap[r.employee_id] ?? null,
  }));

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-slate-700">
              <li>
                <Link href="/admin" className="hover:text-primary">
                  Admin
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/admin/hr" className="hover:text-primary">
                  HR
                </Link>
              </li>
              <li>/</li>
              <li className="text-slate-900 font-medium">Leave</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-slate-900">Leave Management</h1>
          <p className="text-slate-700 mt-2">Review and approve leave requests</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-slate-700">Pending Requests</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{requests?.length || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-slate-700">Approved This Month</h3>
            <p className="text-3xl font-bold text-brand-green-600 mt-2">12</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-slate-700">On Leave Today</h3>
            <p className="text-3xl font-bold text-brand-blue-600 mt-2">3</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Pending Requests</h2>
          </div>
          <div className="divide-y">
            {requests && requests.length > 0 ? (
              requests.map((req: any) => (
                <div
                  key={req.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium">{req.profiles?.full_name}</p>
                    <p className="text-sm text-slate-700">
                      {req.leave_type} • {req.start_date} to {req.end_date}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-brand-green-600 text-white rounded text-sm hover:bg-brand-green-700">
                      Approve
                    </button>
                    <button className="px-3 py-1 bg-brand-red-600 text-white rounded text-sm hover:bg-brand-red-700">
                      Deny
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-700">No pending requests</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
