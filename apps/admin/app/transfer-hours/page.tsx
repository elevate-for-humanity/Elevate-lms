import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { TransferHoursTable } from './transfer-hours-table';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Transfer Hours Management | Admin',
  description: 'Review and approve transfer hour requests',
};

export default async function TransferHoursPage() {
  await requireRole(['admin']);
  const supabase = await createClient();

  const { data: transferHourRequests, count: totalRequests } = await supabase
    .from('transfer_hour_requests')
    .select(
      `
      *,
      enrollment:program_enrollments(
        student_id,
        program:programs(name, title, slug)
      )
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false });

  const studentIds = Array.from(
    new Set(
      (transferHourRequests || [])
        .map((request: any) => request.enrollment?.student_id)
        .filter(Boolean),
    ),
  );
  const { data: students } = studentIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', studentIds)
    : { data: [] };
  const studentsById = new Map((students || []).map((student) => [student.id, student]));
  const transferHours = (transferHourRequests || []).map((request: any) => ({
    ...request,
    enrollment: request.enrollment
      ? {
          ...request.enrollment,
          student: studentsById.get(request.enrollment.student_id) || null,
        }
      : null,
  }));

  const { count: pendingRequests } = await supabase
    .from('transfer_hour_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: approvedRequests } = await supabase
    .from('transfer_hour_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved');

  const { count: deniedRequests } = await supabase
    .from('transfer_hour_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'denied');

  return (
    <div className="min-h-screen bg-white p-8">
      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Admin', href: '/' }, { label: 'Transfer Hours' }]} />
      </div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-black">Transfer Hours Management</h1>
              <p className="text-black mt-1">
                Review and approve transfer hour requests from students
              </p>
            </div>
            <Link
              href="/dashboard"
              className="px-6 py-3 border border-slate-300 rounded-lg text-black hover:bg-slate-50 font-medium"
            >
              Back to Dashboard
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">Total Requests</h3>
              <p className="text-base md:text-lg font-bold text-black">{totalRequests || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">Pending Review</h3>
              <p className="text-base md:text-lg font-bold text-yellow-600">
                {pendingRequests || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">Approved</h3>
              <p className="text-base md:text-lg font-bold text-brand-green-600">
                {approvedRequests || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">Denied</h3>
              <p className="text-base md:text-lg font-bold text-brand-orange-600">
                {deniedRequests || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Transfer Hours Table */}
        <TransferHoursTable transferHours={transferHours} />
      </div>
    </div>
  );
}
