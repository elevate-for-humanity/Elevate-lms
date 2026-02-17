export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Megaphone, 
  Mail, 
  Users, 
  TrendingUp, 
  Calendar,
  BarChart3,
  Target,
  Send
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Marketing | Admin | Elevate For Humanity',
  description: 'Marketing dashboard and campaign management.',
};

export default async function AdminMarketingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin/marketing');
  }

  // Fetch leads stats
  const { count: totalLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });

  const { count: newLeadsThisMonth } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

  // Fetch campaigns
  const { data: campaigns } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  // Calculate campaign stats
  const totalCampaigns = campaigns?.length || 0;
  const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;

  // Get lead sources breakdown
  const { data: leadsBySource } = await supabase
    .from('leads')
    .select('source');

  const sourceCounts: Record<string, number> = {};
  leadsBySource?.forEach(lead => {
    const source = lead.source || 'unknown';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });

  const sourceData = Object.entries(sourceCounts)
    .map(([source, count]) => ({
      source: source.replace('_', ' '),
      count,
      percent: totalLeads ? Math.round((count / totalLeads) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Marketing' }]} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Marketing Dashboard</h1>
            <p className="text-gray-600 mt-1">Track campaigns and engagement metrics</p>
          </div>
          <Link 
            href="/admin/campaigns"
            className="flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 transition-colors"
          >
            <Megaphone className="w-5 h-5" />
            View Campaigns
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Leads</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalLeads || 0}</p>
                <p className="text-sm text-brand-green-600 mt-1">+{newLeadsThisMonth || 0} this month</p>
              </div>
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-brand-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Campaigns</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalCampaigns}</p>
                <p className="text-sm text-gray-500 mt-1">{activeCampaigns} active</p>
              </div>
              <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-brand-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">New This Month</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{newLeadsThisMonth || 0}</p>
                <p className="text-sm text-gray-500 mt-1">leads</p>
              </div>
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-brand-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Campaigns</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{activeCampaigns}</p>
                <p className="text-sm text-gray-500 mt-1">running now</p>
              </div>
              <div className="w-12 h-12 bg-brand-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-brand-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Campaigns */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Campaigns</h2>
              <Link href="/admin/campaigns" className="text-sm text-brand-blue-600 hover:text-brand-blue-700">
                View all
              </Link>
            </div>
            {!campaigns || campaigns.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No campaigns yet. Create your first campaign to get started.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {campaigns.map((campaign) => {
                  return (
                    <div key={campaign.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span>Type: {campaign.campaign_type}</span>
                            {campaign.subject && <span>Subject: {campaign.subject}</span>}
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          campaign.status === 'active' 
                            ? 'bg-brand-green-100 text-brand-green-800'
                            : campaign.status === 'completed'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {campaign.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link 
                  href="/admin/campaigns/new"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                    <Send className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Create Campaign</p>
                    <p className="text-sm text-gray-500">Send email or SMS</p>
                  </div>
                </Link>
                <Link 
                  href="/admin/leads"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-brand-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">View Leads</p>
                    <p className="text-sm text-gray-500">Manage prospects</p>
                  </div>
                </Link>
                <Link 
                  href="/admin/analytics"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Analytics</p>
                    <p className="text-sm text-gray-500">View detailed reports</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Lead Sources */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Sources</h2>
          {sourceData.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No lead data available yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {sourceData.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-brand-blue-600 h-2 rounded-full" 
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                  <p className="text-sm text-gray-500 capitalize">{item.source}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
