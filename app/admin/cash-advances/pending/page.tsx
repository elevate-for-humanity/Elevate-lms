import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pending Cash Advances | Admin | Elevate For Humanity',
  description: 'View and manage pending cash advance requests.',
};

export default async function PendingCashAdvancesPage() {
  const supabase = await createClient();



  // Fetch pending cash advances
  const { data: pendingAdvances } = await supabase
    .from('cash_advances')
    .select('*, profiles(full_name, email)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-white py-8">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin/cash-advances"
            className="text-brand-blue-600 hover:text-brand-blue-800 mb-4 inline-block"
          >
            ← Back to Cash Advances
          </Link>
          <h1 className="text-3xl font-bold text-black">
            Pending Cash Advances
          </h1>
          <p className="mt-2 text-black">
            Review and approve pending cash advance requests.
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-brand-orange-600">
              {pendingAdvances?.length || 0}
            </div>
            <div className="text-black">Pending Requests</div>
          </div>
        </div>

        {/* Pending List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-black">
              Pending Requests
            </h2>
          </div>

          {pendingAdvances && pendingAdvances.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {pendingAdvances.map((advance: Record<string, any>) => (
                <div key={advance.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-black">
                        {advance.profiles?.full_name || 'Unknown'}
                      </h3>
                      <p className="text-sm text-black">
                        {advance.profiles?.email}
                      </p>
                      <p className="text-sm text-black mt-1">
                        Requested:{' '}
                        {new Date(advance.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-black">
                        ${advance.amount?.toFixed(2) || '0.00'}
                      </div>
                      <Link
                        href={`/admin/cash-advances/${advance.id}`}
                        className="text-sm text-brand-blue-600 hover:text-brand-blue-800"
                      >
                        Review →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-black">
              No pending cash advance requests
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
