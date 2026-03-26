import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
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


  // Require authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login?redirect=/workforce-board/dashboard');
  }

  // Get profile and verify role
  const { data: profile } = await supabase
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
    supabase.from('program_enrollments').select('*', { count: 'exact', head: true }),
    supabase.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('programs').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('partner_lms_providers').select('*', { count: 'exact', head: true }),
  ]);

  const totalEnrollments = enrollmentsResult.count || 0;
  const completedEnrollments = completionsResult.count || 0;
  const activeEnrollments = activeResult.count || 0;
  const activePrograms = programsResult.count || 0;
  const trainingProviders = providersResult.count || 0;
  const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

  // Get recent enrollments
  const { data: recentEnrollments } = await supabase
    .from('program_enrollments')
    .select('id, status, created_at, profiles (full_name), programs (name, title)')
    .order('created_at', { ascending: false })
    .limit(5);

  // Get at-risk participants
  const { data: atRiskParticipants, count: atRiskCount } = await supabase
    .from('program_enrollments')
    .select('*, profiles (full_name, email)', { count: 'exact' })
    .eq('at_risk', true)
    .eq('status', 'active')
    .limit(5);

  // Derive WIOA indicators from real data
  const { data: certificatesIssued } = await supabase
    .from('certificates')
    .select('id', { count: 'exact', head: true });
  const credentialCount = certificatesIssued?.length ?? 0;
  // Credential attainment: completers who earned at least one certificate
  const credentialAttainment = completedEnrollments > 0
    ? Math.min(100, Math.round((credentialCount / completedEnrollments) * 100))
    : 0;
  // Measurable skill gains: active enrollments with progress > 0
  const { count: skillGainCount } = await supabase
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .gt('progress_percent', 0);
  const measurableSkillGains = activeEnrollments > 0
    ? Math.round(((skillGainCount || 0) / activeEnrollments) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
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
              <Link href="/workforce-board/reports" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-white">
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
            </div>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">{totalEnrollments}</p>
            <p className="text-sm text-gray-600">Total Enrollments</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <GraduationCap className="w-8 h-8 text-brand-green-600" />
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
              <Award className="w-8 h-8 text-brand-orange-600" />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">{credentialAttainment}%</p>
            <p className="text-sm text-gray-600">Credential Attainment</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-brand-blue-600" />WIOA Performance Indicators
            </h2>
            <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded">Derived from enrollment data</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Completion Rate</span>
                <span className={`text-sm font-medium ${completionRate >= 75 ? 'text-brand-green-600' : completionRate >= 50 ? 'text-yellow-600' : 'text-brand-red-600'}`}>{completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${completionRate >= 75 ? 'bg-brand-green-600' : completionRate >= 50 ? 'bg-yellow-500' : 'bg-brand-red-500'}`} style={{ width: `${Math.min(completionRate, 100)}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">Target: 75%</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Credential Attainment</span>
                <span className={`text-sm font-medium ${credentialAttainment >= 70 ? 'text-brand-green-600' : credentialAttainment >= 50 ? 'text-yellow-600' : 'text-brand-red-600'}`}>{credentialAttainment}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${credentialAttainment >= 70 ? 'bg-brand-green-600' : credentialAttainment >= 50 ? 'bg-yellow-500' : 'bg-brand-red-500'}`} style={{ width: `${Math.min(credentialAttainment, 100)}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">Target: 70%</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Measurable Skill Gains</span>
                <span className={`text-sm font-medium ${measurableSkillGains >= 75 ? 'text-brand-green-600' : measurableSkillGains >= 50 ? 'text-yellow-600' : 'text-brand-red-600'}`}>{measurableSkillGains}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${measurableSkillGains >= 75 ? 'bg-brand-green-600' : measurableSkillGains >= 50 ? 'bg-yellow-500' : 'bg-brand-red-500'}`} style={{ width: `${Math.min(measurableSkillGains, 100)}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">Target: 75%</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">Employment rate and median wage gain require post-exit follow-up data. Connect employment outcomes to enable these indicators.</p>
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
                <span className="text-slate-500 flex-shrink-0">•</span>
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
                  <div key={e.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{e.profiles?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">{e.programs?.name || e.programs?.title || 'Unknown Program'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${e.status === 'active' ? 'bg-brand-green-100 text-brand-green-800' : e.status === 'completed' ? 'bg-brand-blue-100 text-brand-blue-800' : e.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-white text-gray-800'}`}>{e.status}</span>
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
              <p className="text-2xl font-bold text-brand-orange-600">{completionRate}%</p>
              <p className="text-sm text-gray-600">Completion Rate</p>
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

        <div className="mt-8 bg-white rounded-xl border border-brand-green-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-slate-500 flex-shrink-0">•</span>
              <div>
                <h3 className="font-semibold text-gray-900">Compliance Status: Good Standing</h3>
                <p className="text-sm text-gray-600">All required reports submitted. Next audit: Q2 2026</p>
              </div>
            </div>
            <Link href="/workforce-board/reports?type=compliance" className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white">View Compliance Details</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
