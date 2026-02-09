import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cash Advance Reports | Admin | Elevate For Humanity',
  description: 'View cash advance reports and analytics.',
};

export default async function CashAdvanceReportsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  // Fetch cash advance statistics
  const { data: allAdvances } = await supabase
    .from('cash_advances')
    .select('*');

  const { data: approvedAdvances } = await supabase
    .from('cash_advances')
    .select('*')
    .eq('status', 'approved');

  const { data: pendingAdvances } = await supabase
    .from('cash_advances')
    .select('*')
    .eq('status', 'pending');

  const totalAmount =
    allAdvances?.reduce((sum, adv) => sum + (adv.amount || 0), 0) || 0;
  const approvedAmount =
    approvedAdvances?.reduce((sum, adv) => sum + (adv.amount || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin/cash-advances"
            className="text-brand-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Cash Advances
          </Link>
          <h1 className="text-3xl font-bold text-black">
            Cash Advance Reports
          </h1>
          <p className="mt-2 text-black">
            View analytics and reports for cash advance program.
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-brand-blue-600">
              {allAdvances?.length || 0}
            </div>
            <div className="text-black text-sm">Total Requests</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-brand-green-600">
              {approvedAdvances?.length || 0}
            </div>
            <div className="text-black text-sm">Approved</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-brand-orange-600">
              {pendingAdvances?.length || 0}
            </div>
            <div className="text-black text-sm">Pending</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-blue-600">
              ${totalAmount.toFixed(2)}
            </div>
            <div className="text-black text-sm">Total Amount</div>
          </div>
        </div>

        {/* Report Sections */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-black mb-4">
              Approval Rate
            </h2>
            <div className="text-4xl font-bold text-brand-green-600 mb-2 text-2xl md:text-3xl lg:text-4xl">
              {allAdvances?.length
                ? Math.round(
                    ((approvedAdvances?.length || 0) / allAdvances.length) * 100
                  )
                : 0}
              %
            </div>
            <p className="text-black">
              {approvedAdvances?.length || 0} of {allAdvances?.length || 0}{' '}
              requests approved
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-black mb-4">
              Average Amount
            </h2>
            <div className="text-4xl font-bold text-brand-blue-600 mb-2 text-2xl md:text-3xl lg:text-4xl">
              $
              {allAdvances?.length
                ? (totalAmount / allAdvances.length).toFixed(2)
                : '0.00'}
            </div>
            <p className="text-black">Average cash advance amount</p>
          </div>
        </div>

        {/* Export Options */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-black mb-4">
            Export Reports
          </h2>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-brand-blue-600 text-white rounded hover:bg-brand-blue-700" aria-label="Action button">
              Export to CSV
            </button>
            <button className="px-4 py-2 bg-brand-green-600 text-white rounded hover:bg-green-700" aria-label="Action button">
              Export to PDF
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" aria-label="Action button">
              Export to Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
