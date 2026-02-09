import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { DollarSign, Clock, CheckCircle, Search, FileText, TrendingUp, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'WOTC Management | Admin',
  description: 'Manage Work Opportunity Tax Credit applications and certifications.',
  robots: { index: false, follow: false },
};

export default async function WOTCAdminPage() {
  const supabase = await createClient();

  // Fetch WOTC applications
  const { data: applications } = await supabase
    .from('wotc_applications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  const allApps = applications || [];
  
  // Calculate stats from real data
  const totalCredits = allApps
    .filter(a => a.status === 'approved' && a.tax_credit_amount)
    .reduce((sum, a) => sum + (parseFloat(a.tax_credit_amount) || 0), 0);
  
  const pendingCount = allApps.filter(a => a.status === 'pending_review').length;
  const activeCount = allApps.filter(a => ['submitted', 'pending_review'].includes(a.status)).length;
  const approvedThisMonth = allApps.filter(a => {
    if (a.status !== 'approved') return false;
    const approvedDate = new Date(a.updated_at);
    const now = new Date();
    return approvedDate.getMonth() === now.getMonth() && 
           approvedDate.getFullYear() === now.getFullYear();
  }).length;

  const stats = [
    { label: 'Total Credits', value: `$${totalCredits.toLocaleString()}`, icon: DollarSign, color: 'green' },
    { label: 'Active Applications', value: activeCount.toString(), icon: FileText, color: 'blue' },
    { label: 'Pending Review', value: pendingCount.toString(), icon: Clock, color: 'yellow' },
    { label: 'Approved This Month', value: approvedThisMonth.toString(), icon: CheckCircle, color: 'blue' },
  ];
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Wotc" }]} />
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WOTC Management</h1>
            <p className="text-gray-600">Work Opportunity Tax Credit applications and certifications</p>
          </div>
          <Link
            href="/admin/wotc/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Application
          </Link>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`w-8 h-8 text-${stat.color}-600`} />
                <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search applications..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              <option>All Categories</option>
              <option>Veteran</option>
              <option>SNAP Recipient</option>
              <option>Ex-Felon</option>
              <option>Long-term Unemployed</option>
            </select>
            <select className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              <option>All Status</option>
              <option>Pending</option>
              <option>Processing</option>
              <option>Certified</option>
              <option>Denied</option>
            </select>
          </div>

          {allApps.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No WOTC Applications</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first WOTC application.</p>
              <Link
                href="/admin/wotc/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                Create Application
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target Groups</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {allApps.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{app.employer_name}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {app.employee_first_name} {app.employee_last_name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(app.target_groups || []).slice(0, 2).map((group: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {group}
                          </span>
                        ))}
                        {(app.target_groups || []).length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{app.target_groups.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-green-600">
                      {app.tax_credit_amount ? `$${parseFloat(app.tax_credit_amount).toLocaleString()}` : '--'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                        app.status === 'approved' ? 'bg-green-100 text-green-700' :
                        app.status === 'pending_review' ? 'bg-yellow-100 text-yellow-700' :
                        app.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                        app.status === 'denied' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {app.status === 'approved' && <CheckCircle className="w-4 h-4" />}
                        {app.status === 'pending_review' && <Clock className="w-4 h-4" />}
                        {app.status === 'submitted' && <TrendingUp className="w-4 h-4" />}
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/wotc/${app.id}`}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
