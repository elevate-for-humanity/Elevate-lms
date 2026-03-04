import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Target, Search, Filter, Plus, Mail, Phone, Calendar,
  MoreVertical, TrendingUp, Clock, ArrowRight
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Leads | CRM | Admin | Elevate For Humanity',
  description: 'Manage and track sales leads.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    redirect('/login?redirect=/admin/crm/leads');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin/crm/leads');
  }

  // Fetch real leads from CRM
  const { data: leadData } = await db
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  const leads = (leadData || []).map((l: any) => ({
    id: l.id,
    name: l.company_name || 'Lead',
    contact: l.contact_name || '',
    email: l.email || '',
    source: l.source || 'Website',
    value: l.estimated_value ? `$${l.estimated_value.toLocaleString()}` : '--',
    stage: l.stage || 'Initial Contact',
    probability: l.probability || 0,
    nextAction: l.next_action || 'Follow up',
    dueDate: l.due_date ? new Date(l.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '--',
  }));

  const stages = ['All Stages', 'Initial Contact', 'Discovery', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won'];

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Initial Contact': return 'bg-gray-100 text-gray-700';
      case 'Discovery': return 'bg-brand-blue-100 text-brand-blue-700';
      case 'Qualified': return 'bg-yellow-100 text-yellow-700';
      case 'Proposal': return 'bg-brand-blue-100 text-brand-blue-700';
      case 'Negotiation': return 'bg-brand-orange-100 text-brand-orange-700';
      case 'Closed Won': return 'bg-brand-green-100 text-brand-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const totalValue = leads.reduce((sum, l) => {
    const val = l.value.replace(/[$,]/g, '');
    return sum + (parseInt(val) || 0);
  }, 0);
  const avgDeal = leads.length > 0 ? Math.round(totalValue / leads.length) : 0;

  const stats = [
    { label: 'Total Leads', value: String(leads.length), change: 'All time' },
    { label: 'Pipeline Value', value: `$${totalValue.toLocaleString()}`, change: 'Total' },
    { label: 'Avg. Deal Size', value: `$${avgDeal.toLocaleString()}`, change: 'Average' },
    { label: 'Win Rate', value: '32%', change: '+3%' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/admin-crm-leads-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      {/* Header */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-8 h-8 text-brand-orange-600" />
                <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
              </div>
              <p className="text-gray-600">Track and manage your sales pipeline</p>
            </div>
            <Link
              href="/admin/crm/leads/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-orange-600 text-white font-semibold rounded-lg hover:bg-brand-orange-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Lead
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index}>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-gray-500 text-sm">{stat.label}</p>
                <p className="text-brand-green-600 text-sm font-medium">{stat.change}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
              />
            </div>
            <div className="flex gap-3">
              <select className="px-4 py-2 border border-gray-300 rounded-lg">
                {stages.map((stage) => (
                  <option key={stage}>{stage}</option>
                ))}
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-lg">
                <option>All Sources</option>
                <option>Website</option>
                <option>Referral</option>
                <option>Conference</option>
                <option>Cold Outreach</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Leads Table */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Probability</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{lead.name}</p>
                        <p className="text-gray-500 text-sm">{lead.contact}</p>
                        <p className="text-gray-400 text-sm">{lead.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{lead.value}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStageColor(lead.stage)}`}>
                        {lead.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-orange-500 rounded-full"
                            style={{ width: `${lead.probability}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{lead.probability}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-gray-900 text-sm">{lead.nextAction}</p>
                        <p className="text-gray-500 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Due: {lead.dueDate}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/crm/leads/${lead.id}`}
                        className="text-brand-orange-600 hover:text-brand-orange-700 font-medium text-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
