export const dynamic = 'force-dynamic';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Users, Clock, AlertTriangle, Download, Search, Circle, } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata: Metadata = {
  title: 'WIOA Compliance | Admin | Elevate for Humanity',
  description: 'Manage WIOA compliance, eligibility verification, and reporting',
};

async function getWIOAData() {
  const supabase = createAdminClient();
  if (!supabase) {
    return { enrollments: [], count: 0, verified: 0, pending: 0, issues: 0 };
  }
  
  // Get enrollments with WIOA funding
  const { data: enrollments, count } = await supabase
    .from('program_enrollments')
    .select(`
      *,
      profiles:user_id (full_name, email),
      programs:program_id (name)
    `, { count: 'exact' })
    .eq('funding_source', 'WIOA')
    .order('created_at', { ascending: false })
    .limit(10);

  const verified = enrollments?.filter(e => e.wioa_verified === true).length || 0;
  const pending = enrollments?.filter(e => e.wioa_verified === null).length || 0;
  const needsAttention = enrollments?.filter(e => e.wioa_verified === false).length || 0;

  return {
    participants: enrollments || [],
    stats: {
      total: count || 0,
      verified,
      pending,
      needsAttention,
    }
  };
}

export default async function WIOAPage() {
  const { participants: dbParticipants, stats: dbStats } = await getWIOAData();

  const stats = [
    { label: 'Total WIOA Participants', value: String(dbStats.total), icon: Users, color: 'blue' },
    { label: 'Pending Verification', value: String(dbStats.pending), icon: Clock, color: 'yellow' },
    { label: 'Verified Eligible', value: String(dbStats.verified), icon: Circle, color: 'green' },
    { label: 'Needs Attention', value: String(dbStats.needsAttention), icon: AlertTriangle, color: 'red' },
  ];

  const participants = dbParticipants.length > 0 ? dbParticipants.map((p: any) => ({
    id: p.id,
    name: p.profiles?.full_name || 'Unknown',
    program: p.programs?.name || 'Unknown Program',
    status: p.wioa_verified === true ? 'verified' : p.wioa_verified === false ? 'needs_docs' : 'pending',
    eligibility: p.wioa_eligibility_type || 'Not specified',
    date: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : 'N/A',
  })) : [
    { id: 1, name: 'No WIOA participants yet', program: '', status: 'pending', eligibility: '', date: '' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <span className="px-2 py-2 bg-brand-green-100 text-brand-green-800 rounded-full text-xs font-medium">Verified</span>;
      case 'pending':
        return <span className="px-2 py-2 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Pending</span>;
      case 'needs_docs':
        return <span className="px-2 py-2 bg-brand-red-100 text-brand-red-800 rounded-full text-xs font-medium">Needs Docs</span>;
      default:
        return <span className="px-2 py-2 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Hero Image */}
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Wioa" }]} />
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">WIOA Compliance</h1>
          <p className="text-gray-600 mt-1">Manage WIOA eligibility verification and compliance reporting</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Report
          </button>
          <Link
            href="/admin/wioa/verify"
            className="px-4 py-2 bg-brand-orange-600 text-white rounded-lg hover:bg-brand-orange-700 transition flex items-center gap-2"
          >
            <FileText className="w-5 h-5" />
            New Verification
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm border p-6">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
              stat.color === 'blue' ? 'bg-brand-blue-100' :
              stat.color === 'yellow' ? 'bg-yellow-100' :
              stat.color === 'green' ? 'bg-brand-green-100' : 'bg-brand-red-100'
            }`}>
              <stat.icon className={`w-6 h-6 ${
                stat.color === 'blue' ? 'text-brand-blue-600' :
                stat.color === 'yellow' ? 'text-yellow-600' :
                stat.color === 'green' ? 'text-brand-green-600' : 'text-brand-red-600'
              }`} />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-gray-600 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/admin/wioa/eligibility" className="bg-white rounded-xl shadow-sm border p-4 hover:border-brand-orange-300 transition">
          <h3 className="font-semibold text-gray-900">Eligibility Criteria</h3>
          <p className="text-sm text-gray-600 mt-1">View and manage WIOA eligibility requirements</p>
        </Link>
        <Link href="/admin/wioa/reports" className="bg-white rounded-xl shadow-sm border p-4 hover:border-brand-orange-300 transition">
          <h3 className="font-semibold text-gray-900">Compliance Reports</h3>
          <p className="text-sm text-gray-600 mt-1">Generate quarterly and annual reports</p>
        </Link>
        <Link href="/admin/wioa/documents" className="bg-white rounded-xl shadow-sm border p-4 hover:border-brand-orange-300 transition">
          <h3 className="font-semibold text-gray-900">Document Templates</h3>
          <p className="text-sm text-gray-600 mt-1">Access required forms and templates</p>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search participants..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500"
            />
          </div>
          <select className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500">
            <option value="">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="needs_docs">Needs Documents</option>
          </select>
          <select className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500">
            <option value="">All Programs</option>
            <option value="healthcare">Healthcare</option>
            <option value="hvac">HVAC</option>
            <option value="cdl">CDL</option>
            <option value="barber">Barber</option>
          </select>
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Participant</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Program</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Eligibility Type</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Status</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Date</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {participants.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                <td className="px-6 py-4 text-gray-600">{p.program}</td>
                <td className="px-6 py-4 text-gray-600">{p.eligibility}</td>
                <td className="px-6 py-4">{getStatusBadge(p.status)}</td>
                <td className="px-6 py-4 text-gray-600">{p.date}</td>
                <td className="px-6 py-4">
                  <Link href={`/admin/wioa/${p.id}`} className="text-brand-orange-600 hover:text-brand-orange-700 font-medium">
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
