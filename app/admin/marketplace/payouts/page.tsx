import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Admin Marketplace Payouts | Elevate For Humanity',
  description: 'Elevate For Humanity - Career training and workforce development',
};

import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';
import MarkPaidButton from './MarkPaidButton';

export const dynamic = 'force-dynamic';


export default async function AdminPayoutsPage() {
  await requireAdmin();

  const supabase = await createClient();


  // Fetch creators with pending earnings
  const { data: creators } = await supabase
    .from('marketplace_creators')
    .select(
      `
      *,
      sales:marketplace_sales(
        id,
        amount_cents,
        creator_earnings_cents,
        paid_out,
        payout_date,
        created_at
      )
    `
    )
    .eq('status', 'approved')
    .order('display_name');

  // Calculate earnings for each creator
  const creatorsWithEarnings =
    creators?.map((creator) => {
      const allSales = creator.sales || [];
      const totalEarnings = allSales.reduce(
        (sum, sale) => sum + (sale.creator_earnings_cents || 0),
        0
      );
      const pendingSales = allSales.filter((sale) => !sale.paid_out);
      const pendingEarnings = pendingSales.reduce(
        (sum, sale) => sum + (sale.creator_earnings_cents || 0),
        0
      );
      const paidEarnings = totalEarnings - pendingEarnings;

      return {
        ...creator,
        totalEarnings,
        pendingEarnings,
        paidEarnings,
        pendingSales,
        lastPayoutDate: allSales
          .filter((sale) => sale.paid_out && sale.payout_date)
          .sort(
            (a, b) =>
              new Date(b.payout_date).getTime() -
              new Date(a.payout_date).getTime()
          )[0]?.payout_date,
      };
    }) || [];

  // Filter creators with pending earnings above minimum ($50)
  const creatorsNeedingPayout = creatorsWithEarnings.filter(
    (c) => c.pendingEarnings >= 5000 // $50 minimum
  );

  return (
    <div className="py-8">

      {/* Hero Image */}
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Payouts" }]} />
      </div>
<div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manage Payouts</h1>
        <p className="text-black">
          Process monthly payouts to creators (minimum $50)
        </p>
      </div>

      {/* Creators Needing Payout */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">
          Ready for Payout ({creatorsNeedingPayout.length})
        </h2>

        {creatorsNeedingPayout.length === 0 ? (
          <p className="text-black">
            No creators have reached the $50 minimum payout threshold.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Creator</th>
                  <th className="text-left py-3 px-4">Payout Method</th>
                  <th className="text-left py-3 px-4">Payout Email</th>
                  <th className="text-left py-3 px-4">Pending Amount</th>
                  <th className="text-left py-3 px-4">Sales Count</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {creatorsNeedingPayout.map((creator) => (
                  <tr key={creator.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold">
                      {creator.display_name}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {creator.payout_method || 'Not set'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {creator.payout_email}
                    </td>
                    <td className="py-3 px-4 font-bold text-brand-green-600">
                      ${(creator.pendingEarnings / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {creator.pendingSales.length} unpaid
                    </td>
                    <td className="py-3 px-4">
                      <MarkPaidButton
                        creatorId={creator.id}
                        amount={creator.pendingEarnings}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* All Creators Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">All Creators</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Creator</th>
                <th className="text-left py-3 px-4">Total Earnings</th>
                <th className="text-left py-3 px-4">Paid Out</th>
                <th className="text-left py-3 px-4">Pending</th>
                <th className="text-left py-3 px-4">Last Payout</th>
              </tr>
            </thead>
            <tbody>
              {creatorsWithEarnings.map((creator) => (
                <tr key={creator.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-semibold">
                    {creator.display_name}
                  </td>
                  <td className="py-3 px-4">
                    ${(creator.totalEarnings / 100).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-brand-green-600">
                    ${(creator.paidEarnings / 100).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-yellow-600">
                    ${(creator.pendingEarnings / 100).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-sm text-black">
                    {creator.lastPayoutDate
                      ? new Date(creator.lastPayoutDate).toLocaleDateString()
                      : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Instructions */}
      <div className="mt-8 bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-brand-blue-900 mb-3">
          Manual Payout Process
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-brand-blue-800">
          <li>Review creators ready for payout (minimum $50)</li>
          <li>Process payment via their preferred method (ACH/PayPal/Zelle)</li>
          <li>Click "Mark as Paid" to update records</li>
          <li>Creator will see updated balance in their dashboard</li>
        </ol>
        <p className="mt-4 text-sm text-brand-blue-700">
          <strong>Future:</strong> Upgrade to Stripe Connect for automatic
          payouts. See STRIPE_CONNECT_UPGRADE.md for details.
        </p>
      </div>
    </div>
  );
}
