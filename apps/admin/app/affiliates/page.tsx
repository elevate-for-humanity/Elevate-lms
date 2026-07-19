import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { Metadata } from 'next';
import Link from 'next/link';
import {
  Users,
  DollarSign,
  TrendingUp,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
} from 'lucide-react';
import { requireAdminClient } from '@/lib/supabase/admin';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: `Affiliate Management | Admin | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Manage affiliate partners and track referral performance',
};

async function getAffiliateData() {
  const supabase = await requireAdminClient();

  // Total registered affiliates
  const { count: totalCount } = await supabase
    .from('affiliates')
    .select('*', { count: 'exact', head: true });

  // Applications list (most recent 10)
  const { data: applications } = await supabase
    .from('affiliate_applications')
    .select('id, company_name, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  // Active application count
  const { count: activeCount } = await supabase
    .from('affiliate_applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved');

  // Pending application count (used as "referrals" proxy)
  const { count: pendingCount } = await supabase
    .from('affiliate_applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // Commissions paid
  const { data: payouts } = await supabase
    .from('affiliate_payouts')
    .select('amount')
    .eq('status', 'paid');

  const totalPaid = payouts?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

  return {
    applications: applications || [],
    stats: {
      total: totalCount || 0,
      active: activeCount || 0,
      pending: pendingCount || 0,
      totalPaid,
    },
  };
}

export default async function AffiliatesPage() {
  await requireRole(['admin', 'staff']);
  const { applications: dbApplications, stats: dbStats } = await getAffiliateData();

  const stats = [
    { label: 'Total Affiliates', value: String(dbStats.total), icon: Users },
    { label: 'Approved', value: String(dbStats.active), icon: TrendingUp },
    { label: 'Pending Applications', value: String(dbStats.pending), icon: UserPlus },
    {
      label: 'Commissions Paid',
      value: `$${dbStats.totalPaid.toLocaleString()}`,
      icon: DollarSign,
    },
  ];

  const affiliates =
    dbApplications.length > 0
      ? dbApplications.map((a: any) => ({
          id: a.id,
          name: a.company_name || 'Unknown',
          status: a.status || 'pending',
          appliedAt: a.created_at ? new Date(a.created_at).toLocaleDateString() : '—',
        }))
      : [{ id: 'empty', name: 'No applications yet', status: 'pending', appliedAt: '—' }];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Hero Image */}
      <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Affiliates' }]} />
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Affiliate Management</h1>
          <p className="text-slate-700 mt-1">
            Manage affiliate partners and track referral performance
          </p>
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
            </div>
            <p className="text-2xl font-bold mt-4">{stat.value}</p>
            <p className="text-slate-700 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700" />
            <input
              type="text"
              placeholder="Search affiliates..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50">
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>
      </div>

      {/* Affiliates Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Company</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Applied</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {affiliates.map((affiliate) => (
              <tr key={affiliate.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-900">{affiliate.name}</p>
                </td>
                <td className="px-6 py-4 text-slate-700 text-sm">{affiliate.appliedAt}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      affiliate.status === 'approved'
                        ? 'bg-brand-green-100 text-brand-green-800'
                        : affiliate.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {affiliate.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="p-2 hover:bg-slate-100 rounded-lg">
                    <MoreVertical className="w-5 h-5 text-slate-700" />
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
