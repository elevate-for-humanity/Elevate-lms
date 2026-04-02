import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/authGuards';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { DollarSign, Plus, Building2, Calendar, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Deals | CRM | Admin | Elevate For Humanity',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

// Pipeline stage config — UI metadata only, not business data
const PIPELINE_STAGES = [
  { name: 'Discovery',    color: 'bg-brand-blue-500',   dot: 'bg-blue-500'   },
  { name: 'Proposal',     color: 'bg-brand-blue-400',   dot: 'bg-blue-400'   },
  { name: 'Negotiation',  color: 'bg-brand-orange-500', dot: 'bg-orange-500' },
  { name: 'Closed Won',   color: 'bg-brand-green-500',  dot: 'bg-green-500'  },
];

const STAGE_BADGE: Record<string, string> = {
  'Discovery':   'bg-blue-100 text-blue-700 border-blue-200',
  'Proposal':    'bg-blue-100 text-blue-700 border-blue-200',
  'Negotiation': 'bg-orange-100 text-orange-700 border-orange-200',
  'Closed Won':  'bg-green-100 text-green-700 border-green-200',
};

export default async function DealsPage() {
  await requireAdmin();
  const db = createAdminClient();

  const { data: deals, error } = await db
    .from('crm_deals')
    .select(`
      id, title, stage, value, probability,
      expected_close_date, notes, created_at,
      contact:contact_id ( id ),
      assignee:assigned_to ( id )
    `)
    .order('created_at', { ascending: false });

  // Pipeline aggregates from real data
  const stageStats = PIPELINE_STAGES.map((s) => {
    const stageDeals = (deals ?? []).filter((d) => d.stage === s.name);
    const total = stageDeals.reduce((sum, d) => sum + Number(d.value ?? 0), 0);
    return { ...s, count: stageDeals.length, total };
  });

  const totalPipelineValue = (deals ?? []).reduce((sum, d) => sum + Number(d.value ?? 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <DollarSign className="w-7 h-7 text-green-600" />
                <h1 className="text-3xl font-bold text-gray-900">Deals</h1>
              </div>
              <p className="text-gray-500 text-sm">
                {error ? 'Error loading deals' : `${(deals ?? []).length} deal${(deals ?? []).length !== 1 ? 's' : ''} · Pipeline value $${totalPipelineValue.toLocaleString()}`}
              </p>
            </div>
            <Link
              href="/admin/crm/deals/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              New Deal
            </Link>
          </div>
        </div>
      </section>

      {/* Error state */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-medium">Failed to load deals</p>
            <p className="text-red-500 text-sm mt-1">{error.message}</p>
          </div>
        </div>
      )}

      {!error && (
        <>
          {/* Pipeline overview — real aggregates */}
          <section className="border-b bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Pipeline Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stageStats.map((stage) => (
                  <div key={stage.name} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${stage.dot}`} />
                      <span className="font-medium text-gray-900 text-sm">{stage.name}</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      ${stage.total.toLocaleString()}
                    </p>
                    <p className="text-gray-500 text-sm">{stage.count} deal{stage.count !== 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Deals list */}
          <section className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {(deals ?? []).length === 0 ? (
                // Empty state — honest, not fake
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                  <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No deals yet</h3>
                  <p className="text-gray-500 mb-6">Create your first deal to start tracking your sales pipeline.</p>
                  <Link
                    href="/admin/crm/deals/new"
                    className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" /> Add Deal
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {(deals ?? []).map((deal: any) => (
                    <div key={deal.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">{deal.title}</h3>
                            {deal.stage && (
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${STAGE_BADGE[deal.stage] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                {deal.stage}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                            {deal.expected_close_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Close: {deal.expected_close_date}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-2xl font-bold text-gray-900">
                            ${Number(deal.value ?? 0).toLocaleString()}
                          </p>
                          {deal.probability != null && (
                            <div className="flex items-center gap-2 mt-1 justify-end">
                              <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${deal.probability === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                  style={{ width: `${deal.probability}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">{deal.probability}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                        <Link
                          href={`/admin/crm/deals/${deal.id}`}
                          className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          View Deal
                        </Link>
                        {deal.stage !== 'Closed Won' && (
                          <button className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
                            <ArrowRight className="w-4 h-4" />
                            Move Stage
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
