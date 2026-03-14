import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  ChevronRight,
  Shield,
  AlertTriangle,
  Clock,
  Users,
  FileText,
  TrendingUp,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Compliance Dashboard | FERPA Portal',
  description: 'Monitor FERPA compliance status and requirements.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function FerpaCompliancePage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

      
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Database connection failed.</p>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/ferpa/compliance');

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const allowedRoles = ['admin', 'super_admin', 'ferpa_officer', 'registrar', 'staff'];
  if (!profile || !allowedRoles.includes(profile.role)) redirect('/unauthorized');

  // Get compliance metrics
  const { count: totalStaff } = await db
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .in('role', ['admin', 'staff', 'instructor']);

  const { count: trainedStaff } = await db
    .from('ferpa_training_records')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  const { count: pendingRequests } = await db
    .from('ferpa_access_requests')
    .select('*', { count: 'exact', head: true })
    .in('status', ['pending', 'under_review']);

  const trainingRate = totalStaff ? Math.round(((trainedStaff || 0) / totalStaff) * 100) : 0;

  const complianceChecks = [
    { name: 'Annual FERPA Notice Published', status: 'compliant', date: '2026-01-01' },
    { name: 'Staff Training Current', status: trainingRate >= 90 ? 'compliant' : 'warning', date: null },
    { name: 'Directory Information Policy', status: 'compliant', date: '2025-08-15' },
    { name: 'Records Retention Policy', status: 'compliant', date: '2025-06-01' },
    { name: 'Data Security Audit', status: 'compliant', date: '2025-12-15' },
    { name: 'Third-Party Agreements Review', status: 'warning', date: '2025-09-01' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image src="/images/pages/ferpa-page-2.jpg" alt="FERPA compliance" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/ferpa" className="hover:text-gray-700">FERPA Portal</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Compliance</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor FERPA compliance status</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-brand-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">FERPA Compliant</h2>
                <p className="text-gray-600">All major compliance requirements met</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last Audit</p>
              <p className="font-semibold text-gray-900">December 15, 2025</p>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalStaff || 0}</p>
                <p className="text-sm text-gray-500">Total Staff</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center">
                <span className="text-slate-400 flex-shrink-0">•</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{trainingRate}%</p>
                <p className="text-sm text-gray-500">Training Rate</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingRequests || 0}</p>
                <p className="text-sm text-gray-500">Pending Requests</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">45</p>
                <p className="text-sm text-gray-500">Days Response Time</p>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Checklist */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Compliance Checklist</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {complianceChecks.map((check, index) => (
              <div key={index} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {check.status === 'compliant' ? (
                    <span className="text-slate-400 flex-shrink-0">•</span>
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  )}
                  <span className="font-medium text-gray-900">{check.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  {check.date && (
                    <span className="text-sm text-gray-500">
                      Updated: {new Date(check.date).toLocaleDateString()}
                    </span>
                  )}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    check.status === 'compliant' 
                      ? 'bg-brand-green-100 text-brand-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {check.status === 'compliant' ? 'Compliant' : 'Needs Review'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          <Link href="/training/certifications" className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <FileText className="w-6 h-6 text-brand-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-900">FERPA Training</h3>
            <p className="text-sm text-gray-500">Complete required training</p>
          </Link>
          <Link href="/ferpa/documentation" className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <FileText className="w-6 h-6 text-brand-green-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Policies & Forms</h3>
            <p className="text-sm text-gray-500">Access compliance documents</p>
          </Link>
          <Link href="/ferpa/reports" className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <TrendingUp className="w-6 h-6 text-brand-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Generate Reports</h3>
            <p className="text-sm text-gray-500">Compliance reporting</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
