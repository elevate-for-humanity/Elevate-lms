import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Tax Filing Reports | Admin | Elevate For Humanity',
  description: 'View tax filing reports and analytics.',
};

export default async function TaxFilingReportsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

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

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin/tax-filing"
            className="text-brand-blue-600 hover:text-brand-blue-800 mb-4 inline-block"
          >
            ← Back to Tax Filing
          </Link>
          <h1 className="text-3xl font-bold text-black">
            Tax Filing Reports
          </h1>
          <p className="mt-2 text-black">
            View analytics and generate reports for tax filing operations.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-brand-blue-600">0</div>
            <div className="text-black text-sm">Returns Filed</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-brand-green-600">$0</div>
            <div className="text-black text-sm">Total Refunds</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-brand-blue-600">0</div>
            <div className="text-black text-sm">Clients Served</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-brand-orange-600">$0</div>
            <div className="text-black text-sm">Avg Refund</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-black mb-4">
              Report Types
            </h2>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:border-brand-blue-500" aria-label="Action button">
                <div className="font-semibold text-black">
                  Monthly Summary
                </div>
                <div className="text-sm text-black">
                  Returns filed and refunds processed
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:border-brand-blue-500" aria-label="Action button">
                <div className="font-semibold text-black">
                  Preparer Performance
                </div>
                <div className="text-sm text-black">
                  Individual preparer statistics
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:border-brand-blue-500" aria-label="Action button">
                <div className="font-semibold text-black">
                  Client Demographics
                </div>
                <div className="text-sm text-black">
                  Client breakdown and trends
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-black mb-4">
              Export Options
            </h2>
            <div className="space-y-4">
              <button className="w-full px-4 py-2 bg-brand-blue-600 text-white rounded-md hover:bg-brand-blue-700" aria-label="Action button">
                Export to CSV
              </button>
              <button className="w-full px-4 py-2 bg-brand-green-600 text-white rounded-md hover:bg-brand-green-700" aria-label="Action button">
                Export to PDF
              </button>
              <button className="w-full px-4 py-2 bg-brand-blue-600 text-white rounded-md hover:bg-brand-blue-700" aria-label="Action button">
                Export to Excel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
