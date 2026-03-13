import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { DollarSign, FileText, Users, TrendingUp, CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Funding Management | Elevate For Humanity',
  description: 'Manage funding sources, grants, and allocations.',
};

export default async function FundingPage() {
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;

  if (!supabase) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div>
    </div>
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/funding');

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const [
    { data: fundingTracking },
    { data: grantApplications, count: grantCount },
    { data: grantOpportunities, count: opportunityCount },
    { data: fundingPrograms },
    { data: recentTracking },
  ] = await Promise.all([
    db.from('funding_tracking').select('funding_source, amount, status').limit(1000),
    db.from('grant_applications').select('id, status, amount_requested, created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(500),
    db.from('grant_opportunities').select('id, title, amount, deadline, status', { count: 'exact' }).limit(10),
    db.from('funding_programs').select('id, name, funding_source, max_amount, status').limit(20),
    db.from('funding_tracking').select('id, funding_source, amount, status, created_at, profiles(full_name)').order('created_at', { ascending: false }).limit(12),
  ]);

  // Aggregate by source
  const bySource: Record<string, { total: number; count: number; active: number }> = {};
  for (const t of (fundingTracking || [])) {
    const src = (t as any).funding_source || 'Other';
    if (!bySource[src]) bySource[src] = { total: 0, count: 0, active: 0 };
    bySource[src].total += Number((t as any).amount || 0);
    bySource[src].count += 1;
    if ((t as any).status === 'active') bySource[src].active += 1;
  }

  const totalFunding = Object.values(bySource).reduce((s, v) => s + v.total, 0);
  const activeFunding = (fundingTracking || []).filter((t: any) => t.status === 'active').length;
  const pendingGrants = (grantApplications || []).filter((g: any) => g.status === 'pending' || g.status === 'submitted').length;
  const approvedGrants = (grantApplications || []).filter((g: any) => g.status === 'approved').length;
  const totalGrantRequested = (grantApplications || []).reduce((s: number, g: any) => s + Number(g.amount_requested || 0), 0);

  const statusBadge: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-brand-blue-100 text-brand-blue-700',
    expired: 'bg-gray-100 text-gray-600',
    approved: 'bg-green-100 text-green-700',
    submitted: 'bg-brand-blue-100 text-brand-blue-700',
    denied: 'bg-red-100 text-red-700',
  };

  const sourceColors: Record<string, string> = {
    WIOA: 'bg-brand-blue-500',
    WRG: 'bg-green-500',
    JRI: 'bg-purple-500',
    DOL: 'bg-brand-orange-500',
    Other: 'bg-gray-400',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Funding' }]} />
          <div className="flex justify-between items-center mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Funding Management</h1>
              <p className="text-gray-600 mt-1">WIOA, WRG, JRI, DOL, and grant tracking</p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/grants" className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm">
                Grants
              </Link>
              <Link href="/admin/wioa" className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 text-sm font-medium">
                WIOA Reports
              </Link>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">${totalFunding.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">Total Tracked</p>
            <p className="text-xs text-gray-400 mt-0.5">{(fundingTracking || []).length} records</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-brand-blue-50 rounded-lg flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5 text-brand-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{activeFunding}</p>
            <p className="text-sm text-gray-500 mt-1">Active Cases</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{pendingGrants}</p>
            <p className="text-sm text-gray-500 mt-1">Pending Grants</p>
            <p className="text-xs text-gray-400 mt-0.5">{approvedGrants} approved</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-brand-orange-50 rounded-lg flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-brand-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">${totalGrantRequested.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">Grants Requested</p>
            <p className="text-xs text-gray-400 mt-0.5">{grantCount || 0} applications</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Funding by Source */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Funding by Source</h2>
            {Object.keys(bySource).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(bySource).sort(([, a], [, b]) => b.total - a.total).map(([src, data]) => {
                  const pct = totalFunding > 0 ? Math.round((data.total / totalFunding) * 100) : 0;
                  return (
                    <div key={src}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{src}</span>
                        <span className="text-gray-900">${data.total.toLocaleString()} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${sourceColors[src] || 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{data.count} records · {data.active} active</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No funding records yet</p>
            )}
          </div>

          {/* Grant Opportunities */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-base font-semibold text-gray-900">Grant Opportunities</h2>
              <Link href="/admin/grants" className="text-sm text-brand-blue-600 hover:text-brand-blue-800 flex items-center gap-1">
                All grants <ArrowRight size={14} />
              </Link>
            </div>
            <div className="divide-y">
              {grantOpportunities && grantOpportunities.length > 0 ? grantOpportunities.map((g: any) => (
                <div key={g.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{g.title}</p>
                    <p className="text-xs text-gray-500">
                      {g.amount ? `$${Number(g.amount).toLocaleString()}` : 'Pending'}
                      {g.deadline ? ` · Due ${new Date(g.deadline).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusBadge[g.status] || 'bg-gray-100 text-gray-600'}`}>
                    {g.status || 'open'}
                  </span>
                </div>
              )) : (
                <div className="p-8 text-center text-gray-500 text-sm">No grant opportunities</div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Funding Activity */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-5 border-b flex justify-between items-center">
            <h2 className="text-base font-semibold text-gray-900">Recent Funding Activity</h2>
            <Link href="/admin/wioa" className="text-sm text-brand-blue-600 hover:text-brand-blue-800">WIOA Reports</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Participant</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentTracking && recentTracking.length > 0 ? recentTracking.map((t: any) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{(t.profiles as any)?.full_name || 'Participant'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${sourceColors[t.funding_source] ? `bg-${t.funding_source === 'WIOA' ? 'brand-blue' : t.funding_source === 'WRG' ? 'green' : 'gray'}-100 text-${t.funding_source === 'WIOA' ? 'brand-blue' : t.funding_source === 'WRG' ? 'green' : 'gray'}-700` : 'bg-gray-100 text-gray-700'}`}>
                        {t.funding_source || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">${Number(t.amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusBadge[t.status] || 'bg-gray-100 text-gray-600'}`}>
                        {t.status || 'active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No funding records yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
