import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { ArrowLeft, Users, TrendingUp, Target, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Lead Generation Report | Admin',
  description: 'View lead sources and conversion metrics',
};

export default async function LeadsReportPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: leads },
    { count: totalLeads },
  ] = await Promise.all([
    db
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),
    db.from('leads').select('*', { count: 'exact', head: true }),
  ]);

  const recentLeads = leads?.filter(l => 
    new Date(l.created_at) > new Date(thirtyDaysAgo)
  ) || [];

  // Calculate stats
  const enrolled = leads?.filter(l => l.status === 'enrolled').length || 0;
  const qualified = leads?.filter(l => l.status === 'qualified').length || 0;
  const conversionRate = leads?.length ? ((enrolled / leads.length) * 100).toFixed(1) : '0';

  // Leads by source
  const leadsBySource: Record<string, number> = {};
  leads?.forEach(l => {
    const source = l.source || 'unknown';
    leadsBySource[source] = (leadsBySource[source] || 0) + 1;
  });

  // Leads by status
  const leadsByStatus: Record<string, number> = {};
  leads?.forEach(l => {
    leadsByStatus[l.status] = (leadsByStatus[l.status] || 0) + 1;
  });

  const statusColors: Record<string, string> = {
    new: 'bg-brand-blue-100 text-brand-blue-700',
    contacted: 'bg-yellow-100 text-yellow-700',
    qualified: 'bg-brand-blue-100 text-brand-blue-700',
    appointment_set: 'bg-indigo-100 text-indigo-700',
    application_started: 'bg-brand-orange-100 text-brand-orange-700',
    enrolled: 'bg-brand-green-100 text-brand-green-700',
    not_interested: 'bg-gray-100 text-gray-600',
    unqualified: 'bg-brand-red-100 text-brand-red-700',
  };

  const sourceLabels: Record<string, string> = {
    website: 'Website',
    referral: 'Referral',
    social_media: 'Social Media',
    job_fair: 'Job Fair',
    workforce_agency: 'Workforce Agency',
    community_event: 'Community Event',
    unknown: 'Unknown',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/admin/reports"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Lead Generation Report</h1>
          <p className="text-gray-600">Lead sources, conversion rates, and pipeline analysis</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-brand-blue-600" />
              </div>
              <span className="text-sm text-gray-600">Total Leads</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalLeads || 0}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-brand-green-600" />
              </div>
              <span className="text-sm text-gray-600">New This Month</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{recentLeads.length}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-blue-100 rounded-lg">
                <Target className="w-5 h-5 text-brand-blue-600" />
              </div>
              <span className="text-sm text-gray-600">Conversion Rate</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{conversionRate}%</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-600">Qualified</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{qualified}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Leads</h2>
            {leads && leads.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Name</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Interest</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Source</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.slice(0, 10).map((lead) => (
                      <tr key={lead.id} className="border-b last:border-0">
                        <td className="py-3 px-2">
                          <p className="font-medium text-gray-900">
                            {lead.first_name} {lead.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{lead.email}</p>
                        </td>
                        <td className="py-3 px-2 text-gray-600">
                          {lead.program_interest || 'N/A'}
                        </td>
                        <td className="py-3 px-2 text-gray-600">
                          {sourceLabels[lead.source] || lead.source}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${statusColors[lead.status] || 'bg-gray-100'}`}>
                            {lead.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No leads found</p>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Leads by Source</h2>
              {Object.keys(leadsBySource).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(leadsBySource)
                    .sort((a, b) => b[1] - a[1])
                    .map(([source, count]) => (
                      <div key={source}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{sourceLabels[source] || source}</span>
                          <span className="font-medium text-gray-900">{count}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div 
                            className="bg-brand-green-600 h-2 rounded-full" 
                            style={{ width: `${(count / (totalLeads || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No data available</p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Status</h2>
              {Object.keys(leadsByStatus).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(leadsByStatus)
                    .sort((a, b) => b[1] - a[1])
                    .map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[status] || 'bg-gray-100'}`}>
                          {status.replace('_', ' ')}
                        </span>
                        <span className="font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
