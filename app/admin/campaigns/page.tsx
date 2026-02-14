export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Mail, Plus, BarChart3, Users, Calendar, Send, Eye, MousePointer } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { EmailCampaignManager } from '@/components/EmailCampaignManager';
import { SMSNotificationSystem } from '@/components/SMSNotificationSystem';

export const metadata: Metadata = {
  title: 'Campaigns | Admin | Elevate For Humanity',
  description: 'Manage marketing campaigns and outreach.',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-orange-100 text-orange-800',
  completed: 'bg-brand-blue-100 text-brand-blue-800',
};

const typeIcons: Record<string, typeof Mail> = {
  email: Mail,
  sms: Send,
  social: Users,
  event: Calendar,
};

export default async function AdminCampaignsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin/campaigns');
  }

  // Fetch campaigns from database
  let campaigns: any[] | null = null;
  let error: any = null;
  let totalCampaigns = 0;
  let activeCampaigns = 0;

  try {
    const result = await supabase
      .from('marketing_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    campaigns = result.data;
    error = result.error;

    if (!error) {
      const { count: total } = await supabase
        .from('marketing_campaigns')
        .select('*', { count: 'exact', head: true });
      totalCampaigns = total || 0;

      const { count: active } = await supabase
        .from('marketing_campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      activeCampaigns = active || 0;
    }
  } catch (e) {
    error = { message: 'Table not found. Please run the migration.' };
  }

  // Calculate totals from campaign stats
  let totalSent = 0;
  let totalOpened = 0;
  let totalClicked = 0;
  
  campaigns?.forEach(c => {
    const stats = c.stats as { sent?: number; opened?: number; clicked?: number } | null;
    if (stats) {
      totalSent += stats.sent || 0;
      totalOpened += stats.opened || 0;
      totalClicked += stats.clicked || 0;
    }
  });

  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0';
  const clickRate = totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Campaigns' }]} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-gray-600 mt-1">Manage marketing campaigns and outreach</p>
          </div>
          <Link
            href="/admin/campaigns/new"
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Campaign
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-blue-100 rounded-lg">
                <Mail className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalCampaigns || 0}</p>
                <p className="text-sm text-gray-600">Total Campaigns</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Send className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeCampaigns || 0}</p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-blue-100 rounded-lg">
                <Eye className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{openRate}%</p>
                <p className="text-sm text-gray-600">Avg Open Rate</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MousePointer className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{clickRate}%</p>
                <p className="text-sm text-gray-600">Avg Click Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {error ? (
            <div className="p-8 text-center">
              <div className="text-red-600 mb-4">Database table not found</div>
              <p className="text-gray-600 mb-4">
                Run the migration in Supabase Dashboard SQL Editor:
              </p>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                supabase/migrations/20260125_admin_tables.sql
              </code>
            </div>
          ) : !campaigns || campaigns.length === 0 ? (
            <div className="p-8 text-center">
              <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-gray-500 mb-4">Create your first marketing campaign</p>
              <Link
                href="/admin/campaigns/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
              >
                <Plus className="w-5 h-5" />
                New Campaign
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Campaign</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Type</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Sent</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Opened</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Clicked</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {campaigns.map((campaign) => {
                  const TypeIcon = typeIcons[campaign.campaign_type] || Mail;
                  
                  return (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link href={`/admin/campaigns/${campaign.id}`} className="font-medium text-gray-900 hover:text-brand-blue-600">
                          {campaign.name}
                        </Link>
                        {campaign.subject && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">{campaign.subject}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 capitalize">{campaign.campaign_type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[campaign.status] || 'bg-gray-100 text-gray-800'}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {campaign.sent_at ? 'Sent' : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        -
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        -
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Email Campaign Manager */}
        <div className="mt-8">
          <EmailCampaignManager />
        </div>

        {/* SMS Notification System */}
        <div className="mt-8">
          <SMSNotificationSystem />
        </div>
      </div>
    </div>
  );
}
