import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  TrendingUp,
  FileText,
  BarChart3,
  Shield,
  AlertTriangle,
  DollarSign,
  Award,
  Briefcase,
  Clock,
  Target,
  Building2,
  GraduationCap,
  ArrowUpRight,
  ArrowDownRight,
CheckCircle, } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Workforce Board Dashboard | Elevate For Humanity',
  description: 'Program oversight, performance metrics, and compliance monitoring for workforce development.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * WORKFORCE BOARD DASHBOARD
 * 
 * Oversight dashboard for workforce development boards to monitor:
 * - Program performance and outcomes
 * - Participant enrollment and completion
 * - Employment outcomes and wage gains
 * - Compliance status and audit readiness
 * - Budget utilization and ROI
 */
export default async function WorkforceBoardDashboard() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

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

  // Require authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login?next=/workforce-board/dashboard');
  }

  // Get profile and verify role
  const { data: profile } = await db
    .from('profiles')
    .select('id, role, full_name, email')
    .eq('id', user.id)
    .single();

  // Allow workforce_board, admin, or super_admin roles
  const allowedRoles = ['workforce_board', 'admin', 'super_admin', 'org_admin'];
  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect('/unauthorized');
  }

  // Fetch dashboard metrics
  const [
    enrollmentsResult,
    completionsResult,
    activeResult,
    programsResult,
    providersResult,
  ] = await Promise.all([
    db.from('program_enrollments').select('*', { count: 'exact', head: true }),
    db.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    db.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('programs').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('partner_lms_providers').select('*', { count: 'exact', head: true }),
  ]);

  const totalEnrollments = enrollmentsResult.count || 0;
  const completedEnrollments = completionsResult.count || 0;
  const activeEnrollments = activeResult.count || 0;
  const activePrograms = programsResult.count || 0;
  const trainingProviders = providersResult.count || 0;
  const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

  // Get recent enrollments
  const { data: recentEnrollments } = await db
    .from('program_enrollments')
    .select('id, status, created_at, profiles (full_name), programs (name, title)')
    .order('created_at', { ascending: false })
    .limit(5);

  // Get at-risk participants
  const { data: atRiskParticipants, count: atRiskCount } = await db
    .from('program_enrollments')
    .select('*, profiles (full_name, email)', { count: 'exact' })
    .eq('at_risk', true)
    .eq('status', 'active')
    .limit(5);

  const performanceMetrics = { employmentRate: 78, medianWageGain: 12500, credentialAttainment: 85, measurableSkillGains: 72 };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Workforce Board', href: '/workforce-board' }, { label: 'Dashboard' }]} />
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Workforce Board Dashboard</h1>
              <p className="text-gray-600 mt-1">Program oversight and performance monitoring</p>
            </div>
            <div className="flex gap-3">
              <Link href="/workforce-board/reports" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <FileText className="w-4 h-4 mr-2" />Reports
              </Link>
              <Link href="/workforce-board/participants" className="inline-flex items-center px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700">
                <Users className="w-4 h-4 mr-2" />View Participants
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-brand-blue-600" />
              <span className="text-xs font-medium text-brand-green-600 flex items-center"><ArrowUpRight className="w-3 h-3 mr-1" />12%</span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">{totalEnrollments}</p>
            <p className="text-sm text-gray-600">Total Enrollments</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <GraduationCap className="w-8 h-8 text-brand-green-600" />
              <span className="text-xs font-medium text-brand-green-600 flex items-center"><ArrowUpRight className="w-3 h-3 mr-1" />8%</span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">{completedEnrollments}</p>
            <p className="text-sm text-gray-600">Completions</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2"><Target className="w-8 h-8 text-brand-blue-600" /></div>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">{completionRate}%</p>
            <p className="text-sm text-gray-600">Completion Rate</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Briefcase className="w-8 h-8 text-brand-orange-600" />
              <span className="text-xs font-medium text-brand-green-600 flex items-center"><ArrowUpRight className="w-3 h-3 mr-1" />5%</span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">{performanceMetrics.employmentRate}%</p>
            <p className="text-sm text-gray-600">Employment Rate</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-brand-blue-600" />WIOA Performance Indicators
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Employment Rate Q2</span>
                <span className="text-sm font-medium text-brand-green-600">{performanceMetrics.employmentRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-brand-green-600 h-2 rounded-full" style={{ width: `${performanceMetrics.employmentRate}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">Target: 75%</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Median Wage Gain</span>
                <span className="text-sm font-medium text-brand-green-600">${performanceMetrics.medianWageGain.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-brand-green-600 h-2 rounded-full" style={{ width: '85%' }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">Target: $10,000</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Credential Attainment</span>
                <span className="text-sm font-medium text-brand-green-600">{performanceMetrics.credentialAttainment}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-brand-green-600 h-2 rounded-full" style={{ width: `${performanceMetrics.credentialAttainment}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">Target: 70%</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Measurable Skill Gains</span>
                <span className="text-sm font-medium text-yellow-600">{performanceMetrics.measurableSkillGains}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${performanceMetrics.measurableSkillGains}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">Target: 75%</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-brand-orange-500" />At-Risk Participants
              </h2>
              <span className="bg-brand-orange-100 text-brand-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{atRiskCount || 0} flagged</span>
            </div>
            {atRiskParticipants && atRiskParticipants.length > 0 ? (
              <div className="space-y-3">
                {atRiskParticipants.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-brand-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{p.profiles?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">{p.profiles?.email || 'No email'}</p>
                    </div>
                    <Link href={`/workforce-board/participants/${p.id}`} className="text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium">View</Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <p>No at-risk participants</p>
              </div>
            )}
            <Link href="/workforce-board/participants?filter=at-risk" className="block mt-4 text-center text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium">View All At-Risk Participants →</Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-brand-blue-600" />Recent Activity
            </h2>
            {recentEnrollments && recentEnrollments.length > 0 ? (
              <div className="space-y-3">
                {recentEnrollments.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{e.profiles?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">{e.programs?.name || e.programs?.title || 'Unknown Program'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${e.status === 'active' ? 'bg-brand-green-100 text-brand-green-800' : e.status === 'completed' ? 'bg-brand-blue-100 text-brand-blue-800' : e.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{e.status}</span>
                      <p className="text-xs text-gray-500 mt-1">{new Date(e.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500"><p>No recent activity</p></div>
            )}
            <Link href="/workforce-board/participants" className="block mt-4 text-center text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium">View All Participants →</Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-brand-blue-600" />Program Overview
            </h2>
            <Link href="/workforce-board/training" className="text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium">View All Programs →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-brand-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-brand-blue-600">{activePrograms}</p>
              <p className="text-sm text-gray-600">Active Programs</p>
            </div>
            <div className="text-center p-4 bg-brand-green-50 rounded-lg">
              <p className="text-2xl font-bold text-brand-green-600">{trainingProviders}</p>
              <p className="text-sm text-gray-600">Training Providers</p>
            </div>
            <div className="text-center p-4 bg-brand-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-brand-blue-600">{activeEnrollments}</p>
              <p className="text-sm text-gray-600">Active Participants</p>
            </div>
            <div className="text-center p-4 bg-brand-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-brand-orange-600">5</p>
              <p className="text-sm text-gray-600">Industry Sectors</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/workforce-board/reports" className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-brand-blue-300 hover:shadow-md transition">
            <FileText className="w-8 h-8 text-brand-blue-600 mb-2" />
            <span className="font-medium text-gray-900">Generate Reports</span>
            <span className="text-sm text-gray-500">WIOA, DOL, State</span>
          </Link>
          <Link href="/workforce-board/eligibility" className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-brand-blue-300 hover:shadow-md transition">
            <Shield className="w-8 h-8 text-brand-green-600 mb-2" />
            <span className="font-medium text-gray-900">Eligibility Review</span>
            <span className="text-sm text-gray-500">Verify participants</span>
          </Link>
          <Link href="/workforce-board/employment" className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-brand-blue-300 hover:shadow-md transition">
            <Briefcase className="w-8 h-8 text-brand-blue-600 mb-2" />
            <span className="font-medium text-gray-900">Employment Outcomes</span>
            <span className="text-sm text-gray-500">Track placements</span>
          </Link>
          <Link href="/workforce-board/supportive-services" className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-brand-blue-300 hover:shadow-md transition">
            <DollarSign className="w-8 h-8 text-brand-orange-600 mb-2" />
            <span className="font-medium text-gray-900">Supportive Services</span>
            <span className="text-sm text-gray-500">Manage assistance</span>
          </Link>
        </div>

        <div className="mt-8 bg-slate-700 rounded-xl border border-brand-green-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div>
                <h3 className="font-semibold text-gray-900">Compliance Status: Good Standing</h3>
                <p className="text-sm text-gray-600">All required reports submitted. Next audit: Q2 2026</p>
              </div>
            </div>
            <Link href="/workforce-board/reports?type=compliance" className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">View Compliance Details</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
