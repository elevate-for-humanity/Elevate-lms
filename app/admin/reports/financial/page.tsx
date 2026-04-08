import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, DollarSign, FileText, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Financial Report | Admin',
  description: 'View WOTC credits and grant funding overview',
};

export default async function FinancialReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/reports/financial');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) redirect('/unauthorized');

  const [
    { data: wotcApps },
    { data: grantApps },
    { data: grants },
  ] = await Promise.all([
    supabase
      .from('wotc_applications')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('grant_applications')
      .select('*, grant_opportunities(title)')
      .order('created_at', { ascending: false }),
    supabase
      .from('grant_opportunities')
      .select('*')
      .eq('status', 'open'),
  ]);

  // WOTC stats
  const approvedWOTC = wotcApps?.filter(a => a.status === 'approved') || [];
  const pendingWOTC = wotcApps?.filter(a => ['submitted', 'pending_review'].includes(a.status)) || [];
  const totalWOTCCredits = approvedWOTC.reduce((sum, app) => 
    sum + (parseFloat(app.tax_credit_amount) || 0), 0);

  // Grant stats
  const approvedGrants = grantApps?.filter(a => a.status === 'approved') || [];
  const pendingGrants = grantApps?.filter(a => ['submitted', 'under_review'].includes(a.status)) || [];
  const totalGrantsAwarded = approvedGrants.reduce((sum, app) => 
    sum + (parseFloat(app.amount_awarded) || 0), 0);

  // Available grant funding
  const availableFunding = grants?.reduce((sum, g) => 
    sum + (parseFloat(g.amount_max) || 0), 0) || 0;

  const wotcStatusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    submitted: 'bg-brand-blue-100 text-brand-blue-700',
    pending_review: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-brand-green-100 text-brand-green-700',
    denied: 'bg-brand-red-100 text-brand-red-700',
  };

  return (
    <div className="min-h-screen bg-white p-8">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/admin/reports"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Financial Report</h1>
          <p className="text-gray-600">WOTC credits, grants, and funding overview</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-brand-green-600" />
              </div>
              <span className="text-sm text-gray-600">WOTC Credits</span>
            </div>
            <p className="text-3xl font-bold text-brand-green-600">${totalWOTCCredits.toLocaleString()}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-blue-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-brand-blue-600" />
              </div>
              <span className="text-sm text-gray-600">Grants Awarded</span>
            </div>
            <p className="text-3xl font-bold text-brand-blue-600">${totalGrantsAwarded.toLocaleString()}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-brand-blue-600" />
              </div>
              <span className="text-sm text-gray-600">Available Grants</span>
            </div>
            <p className="text-3xl font-bold text-brand-blue-600">${(availableFunding / 1000).toFixed(0)}K</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-brand-orange-600" />
              </div>
              <span className="text-sm text-gray-600">Pending Apps</span>
            </div>
            <p className="text-3xl font-bold text-brand-orange-600">{pendingWOTC.length + pendingGrants.length}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* WOTC Applications */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">WOTC Applications</h2>
              <Link href="/admin/wotc" className="text-sm text-brand-blue-600 hover:text-brand-blue-700">
                View All
              </Link>
            </div>
            {wotcApps && wotcApps.length > 0 ? (
              <div className="space-y-3">
                {wotcApps.slice(0, 8).map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {app.employee_first_name} {app.employee_last_name}
                      </p>
                      <p className="text-sm text-gray-500">{app.employer_name}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs rounded-full ${wotcStatusColors[app.status] || 'bg-gray-100'}`}>
                        {app.status.replace('_', ' ')}
                      </span>
                      {app.tax_credit_amount && (
                        <p className="text-sm font-medium text-brand-green-600 mt-1">
                          ${parseFloat(app.tax_credit_amount).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No WOTC applications</p>
            )}
          </div>

          {/* Grant Applications */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Grant Applications</h2>
              <Link href="/admin/grants" className="text-sm text-brand-blue-600 hover:text-brand-blue-700">
                View All
              </Link>
            </div>
            {grantApps && grantApps.length > 0 ? (
              <div className="space-y-3">
                {grantApps.slice(0, 8).map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {(app.grant_opportunities as { title: string })?.title || 'Grant Application'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Requested: ${parseFloat(app.amount_requested || '0').toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        app.status === 'approved' ? 'bg-brand-green-100 text-brand-green-700' :
                        app.status === 'denied' ? 'bg-brand-red-100 text-brand-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {app.status.replace('_', ' ')}
                      </span>
                      {app.amount_awarded && (
                        <p className="text-sm font-medium text-brand-green-600 mt-1">
                          ${parseFloat(app.amount_awarded).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No grant applications</p>
            )}
          </div>
        </div>

        {/* Open Grant Opportunities */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Open Grant Opportunities</h2>
            <Link href="/admin/grants/new" className="text-sm text-brand-blue-600 hover:text-brand-blue-700">
              Add New
            </Link>
          </div>
          {grants && grants.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grants.map((grant) => (
                <div key={grant.id} className="p-4 border rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-1">{grant.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">{grant.funder}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-brand-green-600 font-medium">
                      ${(grant.amount_min / 1000).toFixed(0)}K - ${(grant.amount_max / 1000).toFixed(0)}K
                    </span>
                    {grant.deadline && (
                      <span className="text-xs text-gray-500">
                        Due: {new Date(grant.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No open grant opportunities</p>
          )}
        </div>
      </div>
    </div>
  );
}
