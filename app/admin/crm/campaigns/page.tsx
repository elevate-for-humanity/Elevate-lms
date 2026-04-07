import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Mail, Plus, TrendingUp, Users, Eye } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Email Campaigns | CRM',
  description: 'Manage and send bulk email campaigns',
};

export default async function CampaignsPage() {
  const supabase = await createClient();



  // Get all campaigns
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  // Calculate totals
  const totalSent =
    campaigns?.reduce((sum, c) => sum + (c.sent_count || 0), 0) || 0;
  const totalOpened =
    campaigns?.reduce((sum, c) => sum + (c.opened_count || 0), 0) || 0;
  const totalClicked =
    campaigns?.reduce((sum, c) => sum + (c.clicked_count || 0), 0) || 0;
  const openRate =
    totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : 0;
  const clickRate =
    totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-white py-8">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black">
              Email Campaigns
            </h1>
            <p className="text-black mt-2">
              Send and track bulk email campaigns
            </p>
          </div>
          <Link
            href="/admin/crm/campaigns/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Campaign
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-black">
                Total Sent
              </span>
              <Mail className="w-5 h-5 text-brand-blue-600" />
            </div>
            <p className="text-3xl font-bold text-black">
              {totalSent.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-black">
                Open Rate
              </span>
              <Eye className="w-5 h-5 text-brand-green-600" />
            </div>
            <p className="text-3xl font-bold text-black">{openRate}%</p>
            <p className="text-sm text-black mt-1">
              {totalOpened.toLocaleString()} opened
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-black">
                Click Rate
              </span>
              <TrendingUp className="w-5 h-5 text-brand-blue-600" />
            </div>
            <p className="text-3xl font-bold text-black">{clickRate}%</p>
            <p className="text-sm text-black mt-1">
              {totalClicked.toLocaleString()} clicked
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-black">
                Campaigns
              </span>
              <Users className="w-5 h-5 text-brand-orange-600" />
            </div>
            <p className="text-3xl font-bold text-black">
              {campaigns?.length || 0}
            </p>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-black">All Campaigns</h2>
          </div>

          {campaigns && campaigns.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/admin/crm/campaigns/${campaign.id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-black">
                        {campaign.name}
                      </h3>
                      <p className="text-sm text-black mt-1">
                        {campaign.subject}
                      </p>
                      <div className="flex items-center gap-6 mt-3 text-sm">
                        <span className="text-black">
                          Sent:{' '}
                          <span className="font-semibold text-black">
                            {campaign.sent_count || 0}
                          </span>
                        </span>
                        <span className="text-black">
                          Opened:{' '}
                          <span className="font-semibold text-brand-green-600">
                            {campaign.opened_count || 0}
                          </span>
                        </span>
                        <span className="text-black">
                          Clicked:{' '}
                          <span className="font-semibold text-brand-blue-600">
                            {campaign.clicked_count || 0}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-3 py-2 rounded-full text-xs font-semibold ${
                          campaign.status === 'sent'
                            ? 'bg-brand-green-100 text-brand-green-700'
                            : campaign.status === 'draft'
                              ? 'bg-gray-100 text-black'
                              : 'bg-brand-blue-100 text-brand-blue-700'
                        }`}
                      >
                        {campaign.status}
                      </span>
                      <p className="text-xs text-black mt-2">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Mail className="w-16 h-16 text-black mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-black mb-2">
                No campaigns yet
              </h3>
              <p className="text-black mb-6">
                Create your first email campaign to get started
              </p>
              <Link
                href="/admin/crm/campaigns/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Campaign
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
