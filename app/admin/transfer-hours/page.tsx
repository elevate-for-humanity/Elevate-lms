import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { TransferHoursTable } from './transfer-hours-table';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Transfer Hours Management | Admin',
  description: 'Review and approve transfer hour requests',
};

export default async function TransferHoursPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

      
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Transfer Hours" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  const { data: transferHours, count: totalRequests } = await db
    .from('transfer_hours')
    .select(
      `
      *,
      enrollment:student_enrollments(
        student:profiles!student_enrollments_student_id_fkey(full_name, email),
        program:programs(name, slug)
      )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  const { count: pendingRequests } = await db
    .from('transfer_hours')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: approvedRequests } = await db
    .from('transfer_hours')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved');

  const { count: deniedRequests } = await db
    .from('transfer_hours')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'denied');

  return (
    <div className="min-h-screen bg-gray-50 p-8">

      {/* Hero Image */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Transfer Hours" }]} />
        </div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-black">
                Transfer Hours Management
              </h1>
              <p className="text-black mt-1">
                Review and approve transfer hour requests from students
              </p>
            </div>
            <Link
              href="/admin/dashboard"
              className="px-6 py-3 border border-gray-300 rounded-lg text-black hover:bg-gray-50 font-medium"
            >
              Back to Dashboard
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">
                Total Requests
              </h3>
              <p className="text-base md:text-lg font-bold text-black">
                {totalRequests || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">
                Pending Review
              </h3>
              <p className="text-base md:text-lg font-bold text-yellow-600">
                {pendingRequests || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">
                Approved
              </h3>
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
        <TransferHoursTable transferHours={transferHours || []} />
      </div>
    </div>
  );
}
