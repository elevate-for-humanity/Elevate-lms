import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { 
  Shield, FileText, Users, AlertTriangle, 
  Clock, Download, Eye, Search, Filter
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'FERPA Compliance | Admin | Elevate For Humanity',
  description: 'Manage FERPA compliance, student records access, and privacy controls.',
};

export default async function AdminFerpaPage() {
  const supabase = await createClient();

  // Query real counts from documents table (consent forms are documents)
  const { count: consentCount } = await supabase.from('documents').select('*', { count: 'exact', head: true }).eq('document_type', 'consent');
  const { count: pendingDocs } = await supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'pending');
  const { count: totalStudents } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');

  const complianceStats = [
    { label: 'Active Consent Forms', value: String(consentCount || 0), icon: FileText, color: 'green' },
    { label: 'Pending Reviews', value: String(pendingDocs || 0), icon: Clock, color: 'yellow' },
    { label: 'Student Records', value: String(totalStudents || 0), icon: Eye, color: 'blue' },
    { label: 'Violations (YTD)', value: '0', icon: AlertTriangle, color: 'green' },
  ];

  // Query recent audit activity
  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('action, target_type, created_at, actor_id')
    .order('created_at', { ascending: false })
    .limit(5);

  const recentActivity = (auditLogs || []).map((log: any) => ({
    action: log.action || 'Activity',
    student: log.target_type || 'Record',
    date: log.created_at ? new Date(log.created_at).toLocaleDateString() : '',
    status: 'complete',
  }));


  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin/ferpa');
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'staff') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Admin', href: '/admin' },
            { label: 'FERPA Compliance' }
          ]} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="w-8 h-8 text-brand-blue-600" />
              FERPA Compliance Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Manage student privacy, consent forms, and records access
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/ferpa"
              className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
            >
              Audit Log
            </Link>
            <Link
              href="/admin/ferpa/training"
              className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 font-medium"
            >
              Staff Training
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {complianceStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`w-8 h-8 ${
                  stat.color === 'green' ? 'text-brand-green-600' :
                  stat.color === 'yellow' ? 'text-yellow-600' :
                  stat.color === 'blue' ? 'text-brand-blue-600' : 'text-gray-600'
                }`} />
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  stat.color === 'green' ? 'bg-brand-green-100 text-brand-green-700' :
                  stat.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                  stat.color === 'blue' ? 'bg-brand-blue-100 text-brand-blue-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {stat.color === 'green' ? 'Good' : stat.color === 'yellow' ? 'Action Needed' : 'Info'}
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-gray-600 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  href="/admin/ferpa"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FileText className="w-5 h-5 text-brand-blue-600" />
                  <span className="text-gray-700">Manage Consent Forms</span>
                </Link>
                <Link
                  href="/admin/ferpa"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Eye className="w-5 h-5 text-brand-blue-600" />
                  <span className="text-gray-700">Review Access Requests</span>
                </Link>
                <Link
                  href="/admin/ferpa"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Users className="w-5 h-5 text-brand-green-600" />
                  <span className="text-gray-700">Directory Information</span>
                </Link>
                <Link
                  href="/admin/ferpa"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-5 h-5 text-brand-orange-600" />
                  <span className="text-gray-700">Generate Reports</span>
                </Link>
              </div>
            </div>

            {/* Compliance Checklist */}
            <div className="bg-white rounded-xl p-6 shadow-sm border mt-6">
              <h2 className="font-semibold text-gray-900 mb-4">Annual Compliance</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span className="text-gray-700 text-sm">Annual FERPA notice sent</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span className="text-gray-700 text-sm">Staff training completed</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span className="text-gray-700 text-sm">Directory opt-out period closed</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span className="text-gray-700 text-sm">Q1 audit pending</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Recent Activity</h2>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search..."
                        className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                      />
                    </div>
                    <button className="p-2 border rounded-lg hover:bg-gray-50">
                      <Filter className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="divide-y">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{activity.action}</div>
                        <div className="text-sm text-gray-600">Student: {activity.student}</div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          activity.status === 'complete' ? 'bg-brand-green-100 text-brand-green-700' :
                          activity.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-brand-blue-100 text-brand-blue-700'
                        }`}>
                          {activity.status}
                        </span>
                        <div className="text-sm text-gray-500 mt-1">{activity.date}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t">
                <Link
                  href="/admin/ferpa"
                  className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium"
                >
                  View All Activity →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
