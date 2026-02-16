import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Mail,
  TrendingUp,
  Calendar,
  Clock,
  DollarSign,
  Target,
CheckCircle, } from 'lucide-react';

export const metadata = {
  title: 'CRM Hub | Admin Dashboard',
  description: 'Manage contacts, campaigns, leads, and customer relationships',
};

export default async function CRMHubPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Crm" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check admin access
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard');
  }

  // Get CRM metrics
  const [
    { count: totalContacts },
    { count: activeLeads },
    { count: pendingFollowUps },
    { count: scheduledMeetings },
    { data: recentCampaigns },
    { data: openDeals },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('license_leads').select('*', { count: 'exact', head: true }),
    supabase
      .from('follow_up_reminders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('appointment_date', new Date().toISOString()),
    supabase
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('deals')
      .select('*')
      .in('stage', ['prospecting', 'qualification', 'proposal', 'negotiation'])
      .limit(10),
  ]);

  // Calculate total pipeline value
  const pipelineValue =
    openDeals?.reduce((sum, deal) => sum + (Number(deal.amount) || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Crm" }]} />
        </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">CRM Hub</h1>
          <p className="text-black mt-2">
            Manage all customer relationships and campaigns
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link
            href="/admin/crm/contacts"
            aria-label="Link"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-brand-blue-600" />
              </div>
              <span className="text-2xl font-bold text-black">
                {totalContacts || 0}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-black">
              Total Contacts
            </h3>
          </Link>

          <Link
            href="/admin/crm/leads"
            aria-label="Link"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-black">
                {activeLeads || 0}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-black">
              Active Leads
            </h3>
          </Link>

          <Link
            href="/admin/crm/follow-ups"
            aria-label="Link"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-2xl font-bold text-black">
                {pendingFollowUps || 0}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-black">
              Pending Follow-ups
            </h3>
          </Link>

          <Link
            href="/admin/crm/appointments"
            aria-label="Link"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-brand-blue-600" />
              </div>
              <span className="text-2xl font-bold text-black">
                {scheduledMeetings || 0}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-black">
              Upcoming Meetings
            </h3>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/admin/crm/campaigns/new"
            className="bg-zinc-900   text-white rounded-xl p-6 hover:shadow-lg transition-shadow"
          >
            <Mail className="w-8 h-8 mb-4" />
            <h3 className="text-xl font-bold mb-2">Send Campaign</h3>
            <p className="text-brand-blue-100 text-sm">Email your contacts in bulk</p>
          </Link>

          <Link
            href="/admin/crm/deals/new"
            className="bg-zinc-900   text-white rounded-xl p-6 hover:shadow-lg transition-shadow"
          >
            <DollarSign className="w-8 h-8 mb-4" />
            <h3 className="text-xl font-bold mb-2">Create Deal</h3>
            <p className="text-green-100 text-sm">
              Track new sales opportunity
            </p>
          </Link>

          <Link
            href="/admin/crm/appointments/new"
            className="bg-zinc-900   text-white rounded-xl p-6 hover:shadow-lg transition-shadow"
          >
            <Calendar className="w-8 h-8 mb-4" />
            <h3 className="text-xl font-bold mb-2">Schedule Meeting</h3>
            <p className="text-brand-blue-100 text-sm">
              Book appointment with Zoom
            </p>
          </Link>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Campaigns */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-black">
                Recent Campaigns
              </h2>
              <Link
                href="/admin/crm/campaigns"
                aria-label="Link"
                className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-semibold"
              >
                View All →
              </Link>
            </div>
            {recentCampaigns && recentCampaigns.length > 0 ? (
              <div className="space-y-4">
                {recentCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-brand-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-black truncate">
                        {campaign.name}
                      </h3>
                      <p className="text-sm text-black mt-1">
                        {campaign.subject}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-black">
                        <span>Sent: {campaign.sent_count || 0}</span>
                        <span>Opened: {campaign.opened_count || 0}</span>
                        <span>Clicked: {campaign.clicked_count || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-black">
                <Mail className="w-12 h-12 mx-auto mb-4 text-black" />
                <p>No campaigns yet</p>
                <Link
                  href="/admin/crm/campaigns/new"
                  aria-label="Link"
                  className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-semibold mt-2 inline-block"
                >
                  Create your first campaign
                </Link>
              </div>
            )}
          </div>

          {/* Open Deals */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-black">Open Deals</h2>
                <p className="text-sm text-black mt-1">
                  Pipeline Value:{' '}
                  <span className="font-bold text-green-600">
                    ${pipelineValue.toLocaleString()}
                  </span>
                </p>
              </div>
              <Link
                href="/admin/crm/deals"
                aria-label="Link"
                className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-semibold"
              >
                View All →
              </Link>
            </div>
            {openDeals && openDeals.length > 0 ? (
              <div className="space-y-4">
                {openDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-black truncate">
                        {deal.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-lg font-bold text-black">
                          ${Number(deal.amount).toLocaleString()}
                        </span>
                        <span className="px-2 py-2 bg-brand-blue-100 text-brand-blue-700 text-xs font-semibold rounded capitalize">
                          {deal.stage}
                        </span>
                      </div>
                      {deal.expected_close_date && (
                        <p className="text-xs text-black mt-1">
                          Expected close:{' '}
                          {new Date(
                            deal.expected_close_date
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-black">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-black" />
                <p>No open deals</p>
                <Link
                  href="/admin/crm/deals/new"
                  aria-label="Link"
                  className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-semibold mt-2 inline-block"
                >
                  Create your first deal
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
