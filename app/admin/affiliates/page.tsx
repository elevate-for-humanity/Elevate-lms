export const dynamic = 'force-dynamic';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { Metadata } from 'next';
import Link from 'next/link';
import { Users, DollarSign, TrendingUp, UserPlus, Search, Filter, MoreVertical } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata: Metadata = {
  title: 'Affiliate Management | Admin | Elevate for Humanity',
  description: 'Manage affiliate partners and track referral performance',
};

async function getAffiliateData() {
  const supabase = createAdminClient();
  if (!supabase) {
    return { affiliates: [], stats: { total: 0, active: 0, totalPaid: 0 } };
  }
  
  // Get affiliates from database
  const { data: affiliates, count } = await supabase
    .from('affiliate_applications')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(10);

  // Get payouts
  const { data: payouts } = await supabase
    .from('affiliate_payouts')
    .select('amount')
    .eq('status', 'paid');

  const totalPaid = payouts?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const activeCount = affiliates?.filter(a => a.status === 'approved').length || 0;

  return {
    affiliates: affiliates || [],
    stats: {
      total: count || 0,
      active: activeCount,
      totalPaid,
    }
  };
}

export default async function AffiliatesPage() {
  const { affiliates: dbAffiliates, stats: dbStats } = await getAffiliateData();

  const stats = [
    { label: 'Total Affiliates', value: String(dbStats.total), icon: Users, change: '+12%' },
    { label: 'Active', value: String(dbStats.active), icon: TrendingUp, change: '+8%' },
    { label: 'Total Referrals', value: '284', icon: UserPlus, change: '+23%' },
    { label: 'Commissions Paid', value: `$${dbStats.totalPaid.toLocaleString()}`, icon: DollarSign, change: '+15%' },
  ];

  const affiliates = dbAffiliates.length > 0 ? dbAffiliates.map((a: any) => ({
    id: a.id,
    name: a.company_name || a.contact_name || 'Unknown',
    email: a.email || '',
    referrals: a.referral_count || 0,
    earnings: `$${(a.total_earnings || 0).toLocaleString()}`,
    status: a.status || 'pending',
  })) : [
    { id: 1, name: 'No affiliates yet', email: '', referrals: 0, earnings: '$0', status: 'pending' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Hero Image */}
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Affiliates" }]} />
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Affiliate Management</h1>
          <p className="text-gray-600 mt-1">Manage affiliate partners and track referral performance</p>
        </div>
        <Link
          href="/admin/affiliates/new"
          className="px-4 py-2 bg-brand-orange-600 text-white rounded-lg hover:bg-brand-orange-700 transition flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Add Affiliate
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <stat.icon className="w-8 h-8 text-brand-orange-600" />
              <span className="text-brand-green-600 text-sm font-medium">{stat.change}</span>
            </div>
            <p className="text-2xl font-bold mt-4">{stat.value}</p>
            <p className="text-gray-600 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search affiliates..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>
      </div>

      {/* Affiliates Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Affiliate</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Referrals</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Earnings</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Status</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {affiliates.map((affiliate) => (
              <tr key={affiliate.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{affiliate.name}</p>
                    <p className="text-sm text-gray-500">{affiliate.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-900">{affiliate.referrals}</td>
                <td className="px-6 py-4 text-gray-900">{affiliate.earnings}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-2 rounded-full text-xs font-medium ${
                    affiliate.status === 'active' 
                      ? 'bg-brand-green-100 text-brand-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {affiliate.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
