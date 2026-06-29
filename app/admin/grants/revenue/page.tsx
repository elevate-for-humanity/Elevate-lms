import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/grants/revenue' },
  title: 'Grant Revenue | Elevate For Humanity',
  description: 'Track grant revenue and funding allocations.',
};

function formatCurrency(cents: number): string {
  if (cents >= 1_000_000) return `$${(cents / 1_000_000).toFixed(1)}M`;
  if (cents >= 1_000) return `$${(cents / 1_000).toFixed(0)}K`;
  return `$${cents.toFixed(0)}`;
}

export default async function GrantRevenuePage() {
  await requireRole(['admin']);
  const supabase = await createClient();

  const { data: applications } = await supabase
    .from('grant_applications')
    .select('status, amount_requested, amount_awarded');

  const totalAwarded = (applications ?? [])
    .filter((a) => a.status === 'approved' && a.amount_awarded != null)
    .reduce((sum, a) => sum + Number(a.amount_awarded ?? 0), 0);

  const totalPending = (applications ?? [])
    .filter((a) => ['submitted', 'under_review'].includes(a.status) && a.amount_requested != null)
    .reduce((sum, a) => sum + Number(a.amount_requested ?? 0), 0);

  const activeCount = (applications ?? []).filter((a) =>
    ['submitted', 'under_review'].includes(a.status),
  ).length;

  const approvedApplications = (applications ?? []).filter((a) => a.status === 'approved');

  return (
    <div className="min-h-screen bg-white">
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
                <Link href="/admin/grants" className="hover:text-primary">
                  Grants
                </Link>
              </li>
              <li>/</li>
              <li className="text-slate-900 font-medium">Revenue</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-slate-900">Grant Revenue</h1>
          <p className="text-slate-700 mt-2">Track funding and revenue from grants</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-slate-700">Total Awarded</h3>
            <p className="text-3xl font-bold text-brand-green-600 mt-2">{formatCurrency(totalAwarded)}</p>
            <p className="text-xs text-slate-500 mt-1">{approvedApplications.length} approved applications</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-slate-700">Pending (requested)</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{formatCurrency(totalPending)}</p>
            <p className="text-xs text-slate-500 mt-1">{activeCount} in review</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-slate-700">Applications</h3>
            <p className="text-3xl font-bold text-brand-blue-600 mt-2">{(applications ?? []).length}</p>
            <p className="text-xs text-slate-500 mt-1">All statuses in grant_applications</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-slate-700">Approved</h3>
            <p className="text-3xl font-bold text-brand-blue-600 mt-2">{approvedApplications.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6 overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4 text-slate-900">By status</h2>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Count</th>
                <th className="py-2 font-medium">Amount (awarded or requested)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(
                (applications ?? []).reduce<Record<string, { count: number; cents: number }>>((acc, row) => {
                  const status = row.status ?? 'unknown';
                  const cents =
                    status === 'approved'
                      ? Number(row.amount_awarded ?? 0)
                      : Number(row.amount_requested ?? 0);
                  if (!acc[status]) acc[status] = { count: 0, cents: 0 };
                  acc[status].count += 1;
                  acc[status].cents += cents;
                  return acc;
                }, {}),
              ).map(([status, { count, cents }]) => (
                <tr key={status} className="border-b border-slate-100">
                  <td className="py-2 pr-4 capitalize text-slate-800">{status.replace(/_/g, ' ')}</td>
                  <td className="py-2 pr-4 text-slate-700">{count}</td>
                  <td className="py-2 text-slate-700">{formatCurrency(cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(applications ?? []).length === 0 && (
            <p className="text-sm text-slate-500 py-4">No grant applications in the database yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
