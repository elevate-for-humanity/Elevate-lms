import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  Briefcase,
  Building2,
  TrendingUp,
  AlertTriangle,
  FileText,
  Shield,
  ArrowRight,
CheckCircle, } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SystemStatusPanel } from '@/components/admin/SystemStatusPanel';
import ModerationDashboard from '@/components/ModerationDashboard';
import OrchestratorAdmin from '@/components/OrchestratorAdmin';
import DataExportDialog from '@/components/DataExportDialog';
import PageManager from '@/components/PageManager';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Elevate For Humanity',
  description: 'System oversight and compliance monitoring',
};

/**
 * ADMIN OVERSIGHT DASHBOARD
 *
 * This is not a feature list. This is instrumentation.
 *
 * What agencies/funders/regulators need to see:
 * - Volume (counts, status)
 * - Progress (bottlenecks, at-risk)
 * - Outcomes (placements, completions)
 * - Control (without micromanagement)
 *
 * This dashboard screams: "This system can be audited."
 */

export default async function AdminDashboardOrchestrated() {
  const supabase = await createClient();

  // Require authentication - redirect to login if not authenticated
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login?redirect=/admin/dashboard');
  }

  // Get admin profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, email, full_name')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    redirect('/login?redirect=/admin/dashboard');
  }

  if (!['admin', 'super_admin', 'org_admin'].includes(profile.role)) {
    redirect('/unauthorized');
  }

  // SNAPSHOT METRICS

  // Students
  const { count: totalStudents } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');

  const { count: activeStudents } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: atRiskStudents } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('at_risk', true);

  const { count: completedStudents } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  // Partner Enrollments
  const { count: partnerEnrollmentsTotal } = await supabase
    .from('partner_lms_enrollments')
    .select('*', { count: 'exact', head: true });

  const { count: partnerEnrollmentsActive } = await supabase
    .from('partner_lms_enrollments')
    .select('*', { count: 'exact', head: true })
    .in('status', ['active', 'enrolled', 'in_progress']);

  // Hybrid/Apprenticeship Enrollments
  const { count: studentEnrollmentsTotal } = await supabase
    .from('student_enrollments')
    .select('*', { count: 'exact', head: true });

  const { count: studentEnrollmentsActive } = await supabase
    .from('student_enrollments')
    .select('*', { count: 'exact', head: true })
    .in('status', ['active', 'enrolled', 'in_progress']);

  // Program Holders
  const { count: totalProgramHolders } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'program_holder');

  const { count: verifiedProgramHolders } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'program_holder')
    .eq('verified', true);

  const { count: overdueReports } = await supabase
    .from('compliance_reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'overdue');

  // Employers
  const { count: totalEmployers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'employer');

  const { count: activeJobPostings } = await supabase
    .from('job_postings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: jobPlacements } = await supabase
    .from('job_placements')
    .select('*', { count: 'exact', head: true });

  // Programs
  const { count: totalPrograms } = await supabase
    .from('programs')
    .select('*', { count: 'exact', head: true });

  const { count: activePrograms } = await supabase
    .from('programs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Compliance
  const { data: lowComplianceHolders } = await supabase
    .from('compliance_scores')
    .select('*, profiles(*)')
    .lt('score', 70);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Dashboard' }]} />
        </div>
      </div>

      {/* Header */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-slate-900">
            System Oversight Dashboard
          </h1>
          <p className="text-slate-700 mt-2">
            Real-time monitoring and compliance tracking
          </p>
        </div>
      </section>

      {/* System Governance Panel */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* This space intentionally left for main content flow */}
          </div>
          <div>
            <SystemStatusPanel 
              lastComplianceReview="2026-01-15"
              environment="Production"
            />
          </div>
        </div>
      </section>

      {/* Critical Alerts */}
      {((atRiskStudents || 0) > 0 ||
        (overdueReports || 0) > 0 ||
        (lowComplianceHolders?.length || 0) > 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="bg-brand-red-50 border-2 border-brand-red-600 rounded-lg p-4 sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-brand-red-600 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-brand-red-900 mb-2 sm:mb-3">
                  Critical Issues Requiring Attention
                </h2>
                <div className="space-y-2">
                  {(atRiskStudents || 0) > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-3 bg-white rounded-lg">
                      <span className="text-sm sm:text-base text-brand-red-900 font-semibold">
                        {atRiskStudents} student
                        {(atRiskStudents || 0) > 1 ? 's' : ''} at risk of
                        dropping out
                      </span>
                      <Link
                        href="/admin/students?filter=at-risk"
                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-brand-red-600 text-white rounded-lg font-semibold hover:bg-brand-red-700 transition text-center"
                      >
                        Review
                      </Link>
                    </div>
                  )}
                  {(overdueReports || 0) > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-3 bg-white rounded-lg">
                      <span className="text-sm sm:text-base text-brand-red-900 font-semibold">
                        {overdueReports} overdue compliance report
                        {(overdueReports || 0) > 1 ? 's' : ''}
                      </span>
                      <Link
                        href="/admin/compliance?filter=overdue"
                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-brand-red-600 text-white rounded-lg font-semibold hover:bg-brand-red-700 transition text-center"
                      >
                        Review
                      </Link>
                    </div>
                  )}
                  {(lowComplianceHolders?.length || 0) > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-3 bg-white rounded-lg">
                      <span className="text-sm sm:text-base text-brand-red-900 font-semibold">
                        {lowComplianceHolders?.length} program holder
                        {(lowComplianceHolders?.length || 0) > 1
                          ? 's'
                          : ''}{' '}
                        below 70% compliance
                      </span>
                      <Link
                        href="/admin/program-holders?filter=low-compliance"
                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-brand-red-600 text-white rounded-lg font-semibold hover:bg-brand-red-700 transition text-center"
                      >
                        Review
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Snapshot Metrics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h2 className="text-xl sm:text-2xl font-bold text-black mb-4 sm:mb-6">
          System Snapshot
        </h2>

        {/* Students */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-bold text-black mb-3 sm:mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-brand-blue-600" />
            Students
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl font-bold text-black mb-1 sm:mb-2">
                {totalStudents || 0}
              </div>
              <div className="text-xs sm:text-sm text-black">
                Total Enrolled
              </div>
            </div>
            <div className="bg-brand-green-50 rounded-lg shadow-sm border border-brand-green-600 p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl font-bold text-brand-green-900 mb-1 sm:mb-2">
                {activeStudents || 0}
              </div>
              <div className="text-xs sm:text-sm text-brand-green-900">Active</div>
            </div>
            <div
              className={`rounded-lg shadow-sm border p-4 sm:p-6 ${
                (atRiskStudents || 0) > 0
                  ? 'bg-yellow-50 border-yellow-600'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div
                className={`text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 ${
                  (atRiskStudents || 0) > 0
                    ? 'text-yellow-900'
                    : 'text-black'
                }`}
              >
                {atRiskStudents || 0}
              </div>
              <div
                className={`text-xs sm:text-sm ${
                  (atRiskStudents || 0) > 0
                    ? 'text-yellow-900'
                    : 'text-black'
                }`}
              >
                At Risk
              </div>
            </div>
            <div className="bg-brand-blue-50 rounded-lg shadow-sm border border-brand-blue-600 p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl font-bold text-brand-blue-900 mb-1 sm:mb-2">
                {completedStudents || 0}
              </div>
              <div className="text-xs sm:text-sm text-brand-blue-900">Completed</div>
            </div>
          </div>
        </div>

        {/* Partner & Hybrid Enrollments */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-bold text-black mb-3 sm:mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-brand-blue-600" />
            Partner & Hybrid Enrollments
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-brand-blue-50 rounded-lg shadow-sm border border-brand-blue-200 p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl font-bold text-brand-blue-900 mb-1 sm:mb-2">
                {partnerEnrollmentsTotal || 0}
              </div>
              <div className="text-xs sm:text-sm text-brand-blue-900">Partner Total</div>
            </div>
            <div className="bg-brand-blue-50 rounded-lg shadow-sm border border-brand-blue-600 p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl font-bold text-brand-blue-900 mb-1 sm:mb-2">
                {partnerEnrollmentsActive || 0}
              </div>
              <div className="text-xs sm:text-sm text-brand-blue-900">Partner Active</div>
            </div>
            <div className="bg-brand-orange-50 rounded-lg shadow-sm border border-brand-orange-200 p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl font-bold text-brand-orange-900 mb-1 sm:mb-2">
                {studentEnrollmentsTotal || 0}
              </div>
              <div className="text-xs sm:text-sm text-brand-orange-900">Apprenticeship Total</div>
            </div>
            <div className="bg-brand-orange-50 rounded-lg shadow-sm border border-brand-orange-600 p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl font-bold text-brand-orange-900 mb-1 sm:mb-2">
                {studentEnrollmentsActive || 0}
              </div>
              <div className="text-xs sm:text-sm text-brand-orange-900">Apprenticeship Active</div>
            </div>
          </div>
        </div>

        {/* Program Holders */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-bold text-black mb-3 sm:mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-brand-blue-600" />
            Program Holders
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl font-bold text-black mb-1 sm:mb-2">
                {totalProgramHolders || 0}
              </div>
              <div className="text-xs sm:text-sm text-black">
                Total Registered
              </div>
            </div>
            <div className="bg-brand-green-50 rounded-lg shadow-sm border border-brand-green-600 p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl font-bold text-brand-green-900 mb-1 sm:mb-2">
                {verifiedProgramHolders || 0}
              </div>
              <div className="text-xs sm:text-sm text-brand-green-900">Verified</div>
            </div>
            <div
              className={`rounded-lg shadow-sm border p-4 sm:p-6 ${
                (overdueReports || 0) > 0
                  ? 'bg-brand-red-50 border-brand-red-600'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div
                className={`text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 ${
                  (overdueReports || 0) > 0 ? 'text-brand-red-900' : 'text-black'
                }`}
              >
                {overdueReports || 0}
              </div>
              <div
                className={`text-xs sm:text-sm ${
                  (overdueReports || 0) > 0 ? 'text-brand-red-900' : 'text-black'
                }`}
              >
                Overdue Reports
              </div>
            </div>
            <div
              className={`rounded-lg shadow-sm border p-4 sm:p-6 ${
                (lowComplianceHolders?.length || 0) > 0
                  ? 'bg-yellow-50 border-yellow-600'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div
                className={`text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 ${
                  (lowComplianceHolders?.length || 0) > 0
                    ? 'text-yellow-900'
                    : 'text-black'
                }`}
              >
                {lowComplianceHolders?.length || 0}
              </div>
              <div
                className={`text-xs sm:text-sm ${
                  (lowComplianceHolders?.length || 0) > 0
                    ? 'text-yellow-900'
                    : 'text-black'
                }`}
              >
                Low Compliance
              </div>
            </div>
          </div>
        </div>

        {/* Employers & Placements */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-bold text-black mb-3 sm:mb-4 flex items-center gap-2">
            <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-brand-green-600" />
            Employers & Placements
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl font-bold text-black mb-1 sm:mb-2">
                {totalEmployers || 0}
              </div>
              <div className="text-xs sm:text-sm text-black">
                Total Employers
              </div>
            </div>
            <div className="bg-brand-blue-50 rounded-lg shadow-sm border border-brand-blue-600 p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl font-bold text-brand-blue-900 mb-1 sm:mb-2">
                {activeJobPostings || 0}
              </div>
              <div className="text-xs sm:text-sm text-brand-blue-900">
                Active Job Postings
              </div>
            </div>
            <div className="bg-brand-green-50 rounded-lg shadow-sm border border-brand-green-600 p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl font-bold text-brand-green-900 mb-1 sm:mb-2">
                {jobPlacements || 0}
              </div>
              <div className="text-xs sm:text-sm text-brand-green-900">
                Total Placements
              </div>
            </div>
          </div>
        </div>

        {/* Programs */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-bold text-black mb-3 sm:mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-brand-orange-600" />
            Programs
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl font-bold text-black mb-1 sm:mb-2">
                {totalPrograms || 0}
              </div>
              <div className="text-xs sm:text-sm text-black">
                Total Programs
              </div>
            </div>
            <div className="bg-brand-green-50 rounded-lg shadow-sm border border-brand-green-600 p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl font-bold text-brand-green-900 mb-1 sm:mb-2">
                {activePrograms || 0}
              </div>
              <div className="text-xs sm:text-sm text-brand-green-900">
                Active Programs
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions with Images */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h2 className="text-xl sm:text-2xl font-bold text-black mb-4 sm:mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/students"
            className="group bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden border border-gray-100"
          >
            <div className="relative h-32 overflow-hidden">
              <Image
                src="/hero-images/healthcare-category.jpg"
                alt="Manage Students"
                fill
                className="object-cover group-hover:scale-105 transition duration-300"
              />
              <h3 className="absolute bottom-3 left-3 font-bold text-white">
                Manage Students
              </h3>
            </div>
            <div className="p-3">
              <p className="text-slate-600 text-sm">View all enrollments</p>
              <span className="inline-flex items-center gap-1 text-brand-blue-600 font-medium text-sm mt-1 group-hover:gap-2 transition-all">
                Open <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          <Link
            href="/admin/program-holders"
            className="group bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden border border-gray-100"
          >
            <div className="relative h-32 overflow-hidden">
              <Image
                src="/hero-images/skilled-trades-category.jpg"
                alt="Program Holders"
                fill
                className="object-cover group-hover:scale-105 transition duration-300"
              />
              <h3 className="absolute bottom-3 left-3 font-bold text-white">
                Program Holders
              </h3>
            </div>
            <div className="p-3">
              <p className="text-slate-600 text-sm">Monitor compliance</p>
              <span className="inline-flex items-center gap-1 text-brand-blue-600 font-medium text-sm mt-1 group-hover:gap-2 transition-all">
                Open <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          <Link
            href="/admin/employers"
            className="group bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden border border-gray-100"
          >
            <div className="relative h-32 overflow-hidden">
              <Image
                src="/hero-images/technology-category.jpg"
                alt="Employers"
                fill
                className="object-cover group-hover:scale-105 transition duration-300"
              />
              <h3 className="absolute bottom-3 left-3 font-bold text-white">
                Employers
              </h3>
            </div>
            <div className="p-3">
              <p className="text-slate-600 text-sm">Track placements</p>
              <span className="inline-flex items-center gap-1 text-brand-green-600 font-medium text-sm mt-1 group-hover:gap-2 transition-all">
                Open <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          <Link
            href="/admin/reports"
            className="group bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden border border-gray-100"
          >
            <div className="relative h-32 overflow-hidden">
              <Image
                src="/images/heroes-hq/about-hero.jpg"
                alt="Generate Reports"
                fill
                className="object-cover group-hover:scale-105 transition duration-300"
              />
              <h3 className="absolute bottom-3 left-3 font-bold text-white">
                Generate Reports
              </h3>
            </div>
            <div className="p-3">
              <p className="text-slate-600 text-sm">Export data</p>
              <span className="inline-flex items-center gap-1 text-brand-orange-600 font-medium text-sm mt-1 group-hover:gap-2 transition-all">
                Open <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Compliance Snapshot */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-6 w-6 text-brand-green-600" />
            <h2 className="text-xl font-bold text-black">Compliance Snapshot</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-brand-green-50 rounded-lg border border-brand-green-200">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div>
                <div className="text-sm font-medium text-brand-green-900">Audit Logging</div>
                <div className="text-xs text-brand-green-700">Enabled</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-brand-green-50 rounded-lg border border-brand-green-200">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div>
                <div className="text-sm font-medium text-brand-green-900">Route Access</div>
                <div className="text-xs text-brand-green-700">Role-gated</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <Shield className="h-5 w-5 text-slate-600 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-slate-900">Environment</div>
                <div className="text-xs text-slate-600">
                  {process.env.CONTEXT === 'production' ? 'Production' : 
                   process.env.CONTEXT === 'deploy-preview' ? 'Preview' : 'Development'}
                </div>
              </div>
            </div>
          </div>
          <Link
            href="/admin/audit-logs"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition"
          >
            <FileText className="h-4 w-4" />
            View Audit Logs
          </Link>
        </div>
      </section>

      {/* ALL ADMIN FEATURES - Gitpod-style Control Panel */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h2 className="text-xl sm:text-2xl font-bold text-black mb-4 sm:mb-6">
          Platform Management
        </h2>

        {/* Content & Courses */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-lg font-semibold text-black mb-4">
            Content & Courses
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Link
              href="/admin/course-builder"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Course Builder
            </Link>
            <Link
              href="/admin/courses"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Courses
            </Link>
            <Link
              href="/admin/programs"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Programs
            </Link>
            <Link
              href="/admin/curriculum"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Curriculum
            </Link>
            <Link
              href="/admin/modules"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Modules
            </Link>
            <Link
              href="/admin/quiz-builder"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Quiz Builder
            </Link>
            <Link
              href="/admin/syllabus-generator"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Syllabus Generator
            </Link>
            <Link
              href="/admin/course-templates"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Templates
            </Link>
            <Link
              href="/admin/course-import"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Import Courses
            </Link>
          </div>
        </div>

        {/* Users & Access */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-black mb-4">
            Users & Access
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Link
              href="/admin/students"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Students
            </Link>
            <Link
              href="/admin/instructors"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Instructors
            </Link>
            <Link
              href="/admin/program-holders"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Program Holders
            </Link>
            <Link
              href="/admin/employers"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Employers
            </Link>
            <Link
              href="/admin/users"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              All Users
            </Link>
            <Link
              href="/admin/delegates"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Delegates
            </Link>
            <Link
              href="/admin/hr"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              HR
            </Link>
          </div>
        </div>

        {/* Analytics & Monitoring */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-black mb-4">
            Analytics & Monitoring
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Link
              href="/admin/analytics"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Analytics
            </Link>
            <Link
              href="/admin/analytics-dashboard"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Analytics Dashboard
            </Link>
            <Link
              href="/admin/performance-dashboard"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Performance
            </Link>
            <Link
              href="/admin/compliance-dashboard"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Compliance
            </Link>
            <Link
              href="/admin/system-health"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              System Health
            </Link>
            <Link
              href="/admin/site-health"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Site Health
            </Link>
            <Link
              href="/admin/audit-logs"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Audit Logs
            </Link>
            <Link
              href="/admin/audits"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Audits
            </Link>
          </div>
        </div>

        {/* Operations & Automation */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-black mb-4">
            Operations & Automation
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Link
              href="/admin/workflows"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Workflows
            </Link>
            <Link
              href="/admin/autopilot"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Autopilot
            </Link>
            <Link
              href="/admin/autopilots"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Autopilots
            </Link>
            <Link
              href="/admin/copilot"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Copilot
            </Link>
            <Link
              href="/admin/operations"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Operations
            </Link>
            <Link
              href="/admin/enrollment-jobs"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Enrollment Jobs
            </Link>
            <Link
              href="/admin/data-processor"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Data Processor
            </Link>
          </div>
        </div>

        {/* Sales & Marketing */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-black mb-4">
            Sales & Marketing
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Link
              href="/admin/promo-codes"
              aria-label="Promo Codes"
              className="p-3 bg-brand-blue-50 border border-brand-blue-200 rounded-lg hover:border-brand-blue-500 hover:shadow text-sm font-medium text-brand-blue-900"
            >
              Promo Codes
            </Link>
            <Link
              href="/admin/career-courses/create"
              aria-label="Course Creator"
              className="p-3 bg-brand-blue-50 border border-brand-blue-200 rounded-lg hover:border-brand-blue-500 hover:shadow text-sm font-medium text-brand-blue-900"
            >
              Course Creator (AI)
            </Link>
            <Link
              href="/career-services/courses"
              aria-label="Career Courses"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Career Courses Shop
            </Link>
            <Link
              href="/admin/marketing"
              aria-label="Marketing"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Marketing
            </Link>
            <Link
              href="/admin/campaigns"
              aria-label="Campaigns"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Campaigns
            </Link>
            <Link
              href="/admin/leads"
              aria-label="Leads"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Leads
            </Link>
          </div>
        </div>

        {/* Development & Integration */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-black mb-4">
            Development & Integration
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Link
              href="/admin/dev-studio"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Dev Studio
            </Link>
            <Link
              href="/admin/editor"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Editor
            </Link>
            <Link
              href="/admin/integrations"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Integrations
            </Link>
            <Link
              href="/admin/migrations"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Migrations
            </Link>
            <Link
              href="/admin/external-modules"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              External Modules
            </Link>
          </div>
        </div>

        {/* Media & Content */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-black mb-4">
            Media & Content
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Link
              href="/admin/video-manager"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Video Manager
            </Link>
            <Link
              href="/admin/videos"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Videos
            </Link>
            <Link
              href="/admin/media-studio"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Media Studio
            </Link>
            <Link
              href="/admin/document-center"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Document Center
            </Link>
            <Link
              href="/admin/documents"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Documents
            </Link>
            <Link
              href="/admin/files"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Files
            </Link>
            <Link
              href="/admin/blog"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Blog
            </Link>
          </div>
        </div>

        {/* Communication */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-black mb-4">
            Communication
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Link
              href="/admin/email-marketing"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Email Marketing
            </Link>
            <Link
              href="/admin/crm"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              CRM
            </Link>
            <Link
              href="/admin/inbox"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Inbox
            </Link>
            <Link
              href="/admin/live-chat"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Live Chat
            </Link>
            <Link
              href="/admin/notifications"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Notifications
            </Link>
            <Link
              href="/admin/social-media"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Social Media
            </Link>
            <Link
              href="/admin/contacts"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Contacts
            </Link>
          </div>
        </div>

        {/* Compliance & Reporting */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-black mb-4">
            Compliance & Reporting
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Link
              href="/admin/compliance"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Compliance
            </Link>
            <Link
              href="/admin/reports"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Reports
            </Link>
            <Link
              href="/admin/reporting"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Reporting
            </Link>
            <Link
              href="/admin/accreditation"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Accreditation
            </Link>
            <Link
              href="/admin/ferpa"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              FERPA
            </Link>
            <Link
              href="/admin/etpl-alignment"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              ETPL Alignment
            </Link>
            <Link
              href="/admin/sap"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              SAP
            </Link>
          </div>
        </div>

        {/* Funding & Finance */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-black mb-4">
            Funding & Finance
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Link
              href="/admin/funding"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Funding
            </Link>
            <Link
              href="/admin/grants"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Grants
            </Link>
            <Link
              href="/admin/payroll"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Payroll
            </Link>
            <Link
              href="/admin/payroll-cards"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Payroll Cards
            </Link>
            <Link
              href="/admin/cash-advances"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Cash Advances
            </Link>
            <Link
              href="/admin/incentives"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Incentives
            </Link>
            <Link
              href="/admin/tax-filing"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Tax Filing
            </Link>
          </div>
        </div>

        {/* Marketplace & Shop */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-black mb-4">
            Marketplace & Shop
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Link
              href="/admin/marketplace"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Marketplace
            </Link>
            <Link
              href="/admin/shops"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Shops
            </Link>
            <Link
              href="/admin/store"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Store
            </Link>
            <Link
              href="/admin/moderation"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Moderation
            </Link>
          </div>
        </div>

        {/* Student Support */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-black mb-4">
            Student Support
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Link
              href="/admin/at-risk"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              At-Risk Students
            </Link>
            <Link
              href="/admin/barriers"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Barriers
            </Link>
            <Link
              href="/admin/retention"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Retention
            </Link>
            <Link
              href="/admin/progress"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Progress
            </Link>
            <Link
              href="/admin/external-progress"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              External Progress
            </Link>
            <Link
              href="/admin/transfer-hours"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Transfer Hours
            </Link>
            <Link
              href="/admin/hours-export"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Hours Export
            </Link>
          </div>
        </div>

        {/* Credentials & Certificates */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-black mb-4">
            Credentials & Certificates
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Link
              href="/admin/certificates"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Certificates
            </Link>
            <Link
              href="/admin/certifications"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Certifications
            </Link>
            <Link
              href="/admin/completions"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Completions
            </Link>
            <Link
              href="/admin/signatures"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Signatures
            </Link>
            <Link
              href="/admin/license"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              License
            </Link>
            <Link
              href="/admin/license-requests"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              License Requests
            </Link>
          </div>
        </div>

        {/* Programs & Partnerships */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-black mb-4">
            Programs & Partnerships
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Link
              href="/admin/jri"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              JRI
            </Link>
            <Link
              href="/admin/apprenticeships"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Apprenticeships
            </Link>
            <Link
              href="/admin/partners"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Partners
            </Link>
            <Link
              href="/admin/partner-inquiries"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Partner Inquiries
            </Link>
            <Link
              href="/admin/mou"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              MOU
            </Link>
            <Link
              href="/admin/program-generator"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Program Generator
            </Link>
          </div>
        </div>

        {/* System & Settings */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-black mb-4">
            System & Settings
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Link
              href="/admin/settings"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Settings
            </Link>
            <Link
              href="/admin/security"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Security
            </Link>
            <Link
              href="/admin/tenants"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Tenants
            </Link>
            <Link
              href="/admin/portal-map"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Portal Map
            </Link>
            <Link
              href="/admin/mobile-sync"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Mobile Sync
            </Link>
          </div>
        </div>

        {/* Documentation & Help */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-black mb-4">
            Documentation & Help
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Link
              href="/admin/docs"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Docs
            </Link>
            <Link
              href="/admin/internal-docs"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Internal Docs
            </Link>
            <Link
              href="/admin/funding-playbook"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Funding Playbook
            </Link>
            <Link
              href="/admin/employers-playbook"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Employers Playbook
            </Link>
            <Link
              href="/admin/program-holder-documents"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              PH Documents
            </Link>
            <Link
              href="/admin/program-holder-acknowledgements"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              PH Acknowledgements
            </Link>
          </div>
        </div>

        {/* Testing & Development */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-black mb-4">
            Testing & Development
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Link
              href="/admin/test-payments"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Test Payments
            </Link>
            <Link
              href="/admin/test-emails"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Test Emails
            </Link>
            <Link
              href="/admin/test-webhook"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Test Webhook
            </Link>
            <Link
              href="/admin/test-funding"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Test Funding
            </Link>
          </div>
        </div>

        {/* Outcomes & Impact */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-black mb-4">
            Outcomes & Impact
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Link
              href="/admin/outcomes"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Outcomes
            </Link>
            <Link
              href="/admin/impact"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Impact
            </Link>
            <Link
              href="/admin/success"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Success
            </Link>
            <Link
              href="/admin/next-steps"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Next Steps
            </Link>
            <Link
              href="/admin/learner"
              aria-label="Link"
              className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
            >
              Learner
            </Link>
          </div>
        </div>
      </section>

      {/* Moderation Dashboard */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <ModerationDashboard />
      </section>

      {/* Orchestrator Admin */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <OrchestratorAdmin />
      </section>

      {/* Data Export */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <DataExportDialog />
      </section>

      {/* Page Manager */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <PageManager />
      </section>
    </div>
  );
}
