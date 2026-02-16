import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import {
  Users,
  FileText,
  Clock,
  TrendingUp,
  Award,
  Building,
  AlertCircle,
  Calendar,
  DollarSign,
  BarChart3,
  Shield,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FERPA Portal | Student Privacy & Records Management',
  description:
    'Manage student education records, privacy compliance, and data protection under FERPA',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/ferpa',
  },
};

export default async function FERPAPortal() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/ferpa');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  // Check if user has FERPA access
  const allowedRoles = [
    'admin',
    'super_admin',
    'ferpa_officer',
    'registrar',
    'staff',
  ];
  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect('/unauthorized');
  }

  // Fetch FERPA metrics
  const { count: totalStudents } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');

  const { count: activeEnrollments } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: pendingRequests } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">
                FERPA Portal
              </h1>
              <p className="text-black mt-1">
                Family Educational Rights and Privacy Act Compliance
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="px-4 py-2 text-black hover:text-black font-medium"
              >
                Admin Dashboard
              </Link>
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-brand-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-brand-blue-600" />
              </div>
              <span className="text-sm text-slate-500">Total</span>
            </div>
            <div className="text-3xl font-bold text-black">
              {totalStudents || 0}
            </div>
            <div className="text-sm text-black mt-1">Student Records</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-brand-orange-600" />
              </div>
              <span className="text-sm text-slate-500">Pending</span>
            </div>
            <div className="text-3xl font-bold text-black">
              {pendingRequests || 0}
            </div>
            <div className="text-sm text-black mt-1">Access Requests</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-brand-green-100 rounded-lg">
                <FileText className="w-6 h-6 text-brand-green-600" />
              </div>
              <span className="text-sm text-slate-500">Active</span>
            </div>
            <div className="text-3xl font-bold text-black">
              {activeEnrollments || 0}
            </div>
            <div className="text-sm text-black mt-1">Enrollments</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-brand-blue-100 rounded-lg">
                <Shield className="w-6 h-6 text-brand-blue-600" />
              </div>
              <span className="text-sm text-slate-500">Status</span>
            </div>
            <div className="text-3xl font-bold text-brand-green-600">•</div>
            <div className="text-sm text-black mt-1">Compliant</div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Student Records */}
          <Link href="/ferpa/records" aria-label="Link" className="group">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:shadow-lg hover:border-brand-blue-300 transition">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-brand-blue-100 rounded-lg group-hover:bg-brand-blue-200 transition">
                  <FileText className="w-8 h-8 text-brand-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black">
                    Student Records
                  </h3>
                  <p className="text-sm text-black">
                    Manage education records
                  </p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-black">
                <li className="flex items-center gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  View student records
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  Update information
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  Access history
                </li>
              </ul>
            </div>
          </Link>

          {/* Privacy Requests */}
          <Link href="/ferpa/requests" aria-label="Link" className="group">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:shadow-lg hover:border-green-300 transition">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-brand-green-100 rounded-lg group-hover:bg-green-200 transition">
                  <Users className="w-8 h-8 text-brand-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black">
                    Privacy Requests
                  </h3>
                  <p className="text-sm text-black">
                    Handle access requests
                  </p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-black">
                <li className="flex items-center gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  Student access requests
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  Parent/guardian requests
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  Third-party disclosures
                </li>
              </ul>
            </div>
          </Link>

          {/* FERPA Compliance */}
          <Link
            href="/ferpa/compliance"
            className="group"
            aria-label="FERPA Compliance and Standards"
          >
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:shadow-lg hover:border-brand-blue-300 transition">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-brand-blue-100 rounded-lg group-hover:bg-brand-blue-200 transition">
                  <Shield className="w-8 h-8 text-brand-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black">
                    FERPA Compliance
                  </h3>
                  <p className="text-sm text-black">
                    Privacy standards & audits
                  </p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-black">
                <li className="flex items-center gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  Compliance monitoring
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  Privacy audits
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  Training & policies
                </li>
              </ul>
            </div>
          </Link>

          {/* Reports & Analytics */}
          <Link
            href="/ferpa/reports"
            className="group"
            aria-label="FERPA Reports and Analytics"
          >
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:shadow-lg hover:border-orange-300 transition">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition">
                  <BarChart3 className="w-8 h-8 text-brand-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black">
                    Reports & Analytics
                  </h3>
                  <p className="text-sm text-black">Performance metrics</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-black">
                <li className="flex items-center gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  Access logs
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  Disclosure tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  Compliance metrics
                </li>
              </ul>
            </div>
          </Link>

          {/* Documentation */}
          <Link
            href="/ferpa/documentation"
            className="group"
            aria-label="FERPA Documentation and Forms"
          >
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:shadow-lg hover:border-indigo-300 transition">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition">
                  <FileText className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black">
                    Documentation
                  </h3>
                  <p className="text-sm text-black">Forms & templates</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-black">
                <li className="flex items-center gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  Consent forms
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  Release forms
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  Policy templates
                </li>
              </ul>
            </div>
          </Link>

          {/* Calendar & Deadlines */}
          <Link
            href="/ferpa/calendar"
            className="group"
            aria-label="FERPA Calendar and Important Deadlines"
          >
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:shadow-lg hover:border-red-300 transition">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 rounded-lg group-hover:bg-red-200 transition">
                  <Calendar className="w-8 h-8 text-brand-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black">
                    Calendar & Deadlines
                  </h3>
                  <p className="text-sm text-black">Important dates</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-black">
                <li className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-brand-orange-600" />
                  Request deadlines
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-brand-orange-600" />
                  Training schedules
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-brand-orange-600" />
                  Audit dates
                </li>
              </ul>
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-black mb-4">
            Quick Actions
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            <Link
              href="/ferpa/records/search"
              className="px-4 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition text-center font-medium"
              aria-label="Search Student Records"
            >
              Search Records
            </Link>
            <Link
              href="/ferpa/requests/new"
              className="px-4 py-3 bg-brand-green-600 text-white rounded-lg hover:bg-green-700 transition text-center font-medium"
              aria-label="Process New Access Request"
            >
              Process Request
            </Link>
            <Link
              href="/ferpa/reports/generate"
              className="px-4 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition text-center font-medium"
              aria-label="Generate FERPA Report"
            >
              Generate Report
            </Link>
            <Link
              href="/ferpa/help"
              className="px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition text-center font-medium"
              aria-label="FERPA Help and Resources"
            >
              Help & Resources
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
