import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Admin Marketplace Creators | Elevate For Humanity',
  description: 'Elevate For Humanity - Career training and workforce development',
};

import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';
import CreatorApprovalActions from './CreatorApprovalActions';

export const dynamic = 'force-dynamic';


export default async function AdminCreatorsPage() {
  await requireAdmin();

  const supabase = await createClient();


  const { data: creators } = await supabase
    .from('marketplace_creators')
    .select(
      `
      *,
      sales:marketplace_sales(
        creator_earnings_cents,
        paid_out
      )
    `
    )
    .order('created_at', { ascending: false });

  const pendingCreators = creators?.filter((c) => c.status === 'pending') || [];
  const approvedCreators =
    creators?.filter((c) => c.status === 'approved') || [];
  const suspendedCreators =
    creators?.filter((c) => c.status === 'suspended') || [];

  return (
    <div className="py-8">

      {/* Hero Image */}
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Creators" }]} />
      </div>
<div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manage Creators</h1>
        <p className="text-black">
          Approve applications, manage creator accounts, and track earnings
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">
          Pending Applications ({pendingCreators.length})
        </h2>

        {pendingCreators.length === 0 ? (
          <p className="text-black">No pending applications.</p>
        ) : (
          <div className="space-y-4">
            {pendingCreators.map((creator) => (
              <div
                key={creator.id}
                className="border rounded-lg p-4 flex justify-between items-start"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {creator.display_name}
                  </h3>
                  <p className="text-sm text-black mb-2">{creator.bio}</p>
                  <div className="text-sm text-black">
                    <p>Payout: {creator.payout_email}</p>
                    <p>Method: {creator.payout_method}</p>
                    <p>
                      Applied:{' '}
                      {new Date(creator.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <CreatorApprovalActions creatorId={creator.id} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">
          Approved Creators ({approvedCreators.length})
        </h2>

        {approvedCreators.length === 0 ? (
          <p className="text-black">No approved creators yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Creator</th>
                  <th className="text-left py-3 px-4">Payout Info</th>
                  <th className="text-left py-3 px-4">Revenue Split</th>
                  <th className="text-left py-3 px-4">Total Earnings</th>
                  <th className="text-left py-3 px-4">Pending</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvedCreators.map((creator) => {
                  const totalEarnings =
                    creator.sales?.reduce(
                      (sum, sale) =>
                        sum + (sale.creator_earnings_cents || 0),
                      0
                    ) || 0;
                  const pendingEarnings =
                    creator.sales
                      ?.filter((s) => !s.paid_out)
                      .reduce(
                        (sum, sale) =>
                          sum + (sale.creator_earnings_cents || 0),
                        0
                      ) || 0;

                  return (
                    <tr key={creator.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-semibold">
                          {creator.display_name}
                        </div>
                        <div className="text-sm text-black">
                          {creator.payout_email}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {creator.payout_method || 'Not set'}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {(creator.revenue_split * 100).toFixed(0)}% creator
                      </td>
                      <td className="py-3 px-4 font-semibold text-brand-green-600">
                        ${(totalEarnings / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-yellow-600">
                        ${(pendingEarnings / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-brand-orange-600 hover:underline text-sm" aria-label="Action button">
                          Suspend
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {suspendedCreators.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">
            Suspended Creators ({suspendedCreators.length})
          </h2>
          <div className="space-y-4">
            {suspendedCreators.map((creator) => (
              <div
                key={creator.id}
                className="border rounded-lg p-4 flex justify-between items-start"
              >
                <div>
                  <h3 className="font-semibold">{creator.display_name}</h3>
                </div>
                <button className="text-brand-green-600 hover:underline text-sm" aria-label="Action button">
                  Reactivate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
