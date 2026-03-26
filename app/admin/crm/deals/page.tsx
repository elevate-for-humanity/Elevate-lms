import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  DollarSign, Search, Filter, Plus, Building2, Calendar,
  MoreVertical, TrendingUp, ArrowRight
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Deals | CRM | Admin | Elevate For Humanity',
  description: 'Manage deals and opportunities.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function DealsPage() {
  const supabase = await createClient();


  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin/crm/deals');
  }

  const pipelineStages = [
    { name: 'Discovery', deals: 0, value: '$0', color: 'bg-brand-blue-500' },
    { name: 'Proposal', deals: 0, value: '$0', color: 'bg-brand-blue-500' },
    { name: 'Negotiation', deals: 0, value: '$0', color: 'bg-brand-orange-500' },
    { name: 'Closed Won', deals: 0, value: '$0', color: 'bg-brand-green-500' },
  ];

  // Deals will be loaded from database when CRM module is configured
  const deals: { id: number; name: string; company: string; value: string; stage: string; closeDate: string; owner: string; probability: number }[] = [];

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Discovery': return 'bg-brand-blue-100 text-brand-blue-700 border-brand-blue-200';
      case 'Proposal': return 'bg-brand-blue-100 text-brand-blue-700 border-brand-blue-200';
      case 'Negotiation': return 'bg-brand-orange-100 text-brand-orange-700 border-brand-orange-200';
      case 'Closed Won': return 'bg-brand-green-100 text-brand-green-700 border-brand-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      {/* Header */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-8 h-8 text-brand-green-600" />
                <h1 className="text-3xl font-bold text-gray-900">Deals</h1>
              </div>
              <p className="text-gray-600">Track and manage your sales opportunities</p>
            </div>
            <Link
              href="/admin/crm/deals/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-green-600 text-white font-semibold rounded-lg hover:bg-brand-green-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Deal
            </Link>
          </div>
        </div>
      </section>

      {/* Pipeline Overview */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {pipelineStages.map((stage, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                  <span className="font-medium text-gray-900">{stage.name}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stage.value}</p>
                <p className="text-gray-500 text-sm">{stage.deals} deals</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search deals..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green-500"
              />
            </div>
            <div className="flex gap-3">
              <select className="px-4 py-2 border border-gray-300 rounded-lg">
                <option>All Stages</option>
                <option>Discovery</option>
                <option>Proposal</option>
                <option>Negotiation</option>
                <option>Closed Won</option>
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-lg">
                <option>All Owners</option>
                <option>Admin User</option>
                <option>Sales Rep</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Deals List */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {deals.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No deals yet</h3>
                <p className="text-gray-500 mb-6">Create your first deal to start tracking your sales pipeline.</p>
                <button className="px-6 py-3 bg-brand-green-600 text-white font-medium rounded-lg hover:bg-brand-green-700 transition-colors inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Deal
                </button>
              </div>
            )}
            {deals.map((deal) => (
              <div key={deal.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{deal.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStageColor(deal.stage)}`}>
                        {deal.stage}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {deal.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Close: {deal.closeDate}
                      </span>
                      <span>Owner: {deal.owner}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{deal.value}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${deal.probability === 100 ? 'bg-brand-green-500' : 'bg-brand-blue-500'}`}
                          style={{ width: `${deal.probability}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500">{deal.probability}%</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                  <Link
                    href={`/admin/crm/deals/${deal.id}`}
                    className="px-4 py-2 bg-brand-green-600 text-white font-medium rounded-lg hover:bg-brand-green-700 transition-colors"
                  >
                    View Deal
                  </Link>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                    Edit
                  </button>
                  {deal.stage !== 'Closed Won' && (
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                      <ArrowRight className="w-4 h-4" />
                      Move Stage
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
