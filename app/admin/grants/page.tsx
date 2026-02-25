import Image from 'next/image';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { DollarSign, Clock, Circle, FileText, Plus, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Grant Management | Admin',
  description: 'Manage grant opportunities and applications',
};

export default async function GrantsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  // Fetch grant opportunities
  const { data: grants } = await db
    .from('grant_opportunities')
    .select('*')
    .order('deadline', { ascending: true });

  // Fetch grant applications
  const { data: applications } = await db
    .from('grant_applications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  const allGrants = grants || [];
  const allApps = applications || [];

  // Calculate stats
  const openGrants = allGrants.filter(g => g.status === 'open').length;
  const totalFunding = allGrants
    .filter(g => g.status === 'open')
    .reduce((sum, g) => sum + (parseFloat(g.amount_max) || 0), 0);
  const pendingApps = allApps.filter(a => ['submitted', 'under_review'].includes(a.status)).length;
  const approvedAmount = allApps
    .filter(a => a.status === 'approved' && a.amount_awarded)
    .reduce((sum, a) => sum + (parseFloat(a.amount_awarded) || 0), 0);

  const stats = [
    { label: 'Open Opportunities', value: openGrants.toString(), icon: FileText, color: 'text-brand-blue-600', bgColor: 'bg-brand-blue-100' },
    { label: 'Available Funding', value: `$${(totalFunding / 1000).toFixed(0)}K`, icon: DollarSign, color: 'text-brand-green-600', bgColor: 'bg-brand-green-100' },
    { label: 'Pending Applications', value: pendingApps.toString(), icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    { label: 'Awarded This Year', value: `$${approvedAmount.toLocaleString()}`, icon: Circle, color: 'text-brand-blue-600', bgColor: 'bg-brand-blue-100' },
  ];

  const statusColors: Record<string, string> = {
    open: 'bg-brand-green-100 text-brand-green-700',
    closed: 'bg-gray-100 text-gray-600',
    upcoming: 'bg-brand-blue-100 text-brand-blue-700',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/about-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Grant Management</h1>
            <p className="text-gray-600">Track grant opportunities and manage applications</p>
          </div>
          <Link
            href="/admin/grants/new"
            className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Opportunity
          </Link>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Grant Opportunities */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Grant Opportunities</h2>
              <span className="text-sm text-gray-500">{allGrants.length} total</span>
            </div>
            
            {allGrants.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Grant Opportunities</h3>
                <p className="text-gray-600 mb-6">Add grant opportunities to track funding sources.</p>
                <Link
                  href="/admin/grants/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Opportunity
                </Link>
              </div>
            ) : (
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {allGrants.map((grant) => (
                  <div key={grant.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{grant.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${statusColors[grant.status] || 'bg-gray-100'}`}>
                        {grant.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{grant.funder}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-brand-green-600 font-medium">
                        ${(grant.amount_min / 1000).toFixed(0)}K - ${(grant.amount_max / 1000).toFixed(0)}K
                      </span>
                      {grant.deadline && (
                        <span className="flex items-center gap-1 text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {new Date(grant.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {grant.focus_areas && grant.focus_areas.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {grant.focus_areas.slice(0, 3).map((area: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            {area}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grant Applications */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Applications</h2>
              <span className="text-sm text-gray-500">{allApps.length} total</span>
            </div>
            
            {allApps.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications</h3>
                <p className="text-gray-600">Grant applications will appear here once submitted.</p>
              </div>
            ) : (
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {allApps.map((app) => (
                  <div key={app.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">Application #{app.id.slice(0, 8)}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        app.status === 'approved' ? 'bg-brand-green-100 text-brand-green-700' :
                        app.status === 'denied' ? 'bg-brand-red-100 text-brand-red-700' :
                        app.status === 'under_review' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-brand-blue-100 text-brand-blue-700'
                      }`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {app.amount_requested && (
                        <span className="text-gray-600">
                          Requested: ${parseFloat(app.amount_requested).toLocaleString()}
                        </span>
                      )}
                      {app.amount_awarded && (
                        <span className="text-brand-green-600 font-medium">
                          Awarded: ${parseFloat(app.amount_awarded).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
