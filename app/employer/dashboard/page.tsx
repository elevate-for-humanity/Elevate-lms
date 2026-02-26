import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Employer Dashboard | Elevate For Humanity',
  description: 'Elevate For Humanity - Career training and workforce development',
};

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { safeFormatDate } from '@/lib/format-utils';
import { getEmployerState } from '@/lib/orchestration/state-machine';
import {
  StateAwareDashboard,
  SectionCard,
} from '@/components/dashboards/StateAwareDashboard';
import {
  Briefcase,
  Users,
  FileText,
  Shield,
  Building2,
  TrendingUp,
} from 'lucide-react';
import EmployerWorkforceAnalytics from '@/components/EmployerWorkforceAnalytics';

/**
 * EMPLOYER PORTAL - PROGRESSION LOGIC
 *
 * This is not a feature list. This is an operator.
 *
 * Rules:
 * - Verification gates everything
 * - Hiring tools unlock progressively
 * - Apprenticeship is optional but guided
 * - Platform protects from compliance errors
 */

export default async function EmployerDashboardOrchestrated() {
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get employer profile
  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'employer') {
    redirect('/');
  }

  // Get job postings
  const { data: postings } = await db
    .from('job_postings')
    .select('*')
    .eq('employer_id', user.id)
    .eq('status', 'active');

  // Get pending applications
  const { data: applications } = await db
    .from('job_applications')
    .select('*')
    .eq('employer_id', user.id)
    .eq('status', 'pending');

  // Check apprenticeship program
  const { data: apprenticeshipProgram } = await db
    .from('apprenticeships')
    .select('*')
    .eq('employer_id', user.id)
    .single();

  // Calculate state
  const stateData = getEmployerState({
    isVerified: profile.verified || false,
    activePostings: postings?.length || 0,
    hasApprenticeshipProgram: !!apprenticeshipProgram,
    pendingApplications: applications?.length || 0,
  });

  return (
    <StateAwareDashboard
      dominantAction={stateData.dominantAction}
      availableSections={stateData.availableSections}
      lockedSections={stateData.lockedSections}
      alerts={stateData.alerts}
    >
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metrics Dashboard */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <Briefcase className="h-11 w-11 text-brand-blue-600" />
                <span className="text-3xl font-bold text-black">
                  {postings?.length || 0}
                </span>
              </div>
              <div className="text-sm text-black">Active Job Postings</div>
            </div>

            <div
              className={`rounded-lg shadow-sm border p-6 ${
                (applications?.length || 0) > 0
                  ? 'bg-brand-green-50 border-brand-green-600'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Users
                  className={`h-11 w-11 ${
                    (applications?.length || 0) > 0
                      ? 'text-brand-green-600'
                      : 'text-slate-400'
                  }`}
                />
                <span
                  className={`text-3xl font-bold ${
                    (applications?.length || 0) > 0
                      ? 'text-brand-green-900'
                      : 'text-black'
                  }`}
                >
                  {applications?.length || 0}
                </span>
              </div>
              <div
                className={`text-sm ${
                  (applications?.length || 0) > 0
                    ? 'text-brand-green-900'
                    : 'text-black'
                }`}
              >
                Pending Applications
              </div>
            </div>

            <div
              className={`rounded-lg shadow-sm border p-6 ${
                apprenticeshipProgram
                  ? 'bg-brand-blue-50 border-brand-blue-600'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <TrendingUp
                  className={`h-11 w-11 ${
                    apprenticeshipProgram ? 'text-brand-blue-600' : 'text-slate-400'
                  }`}
                />
                <span
                  className={`text-3xl font-bold ${
                    apprenticeshipProgram ? 'text-brand-blue-900' : 'text-black'
                  }`}
                >
                  {apprenticeshipProgram ? '1' : '0'}
                </span>
              </div>
              <div
                className={`text-sm ${
                  apprenticeshipProgram ? 'text-brand-blue-900' : 'text-black'
                }`}
              >
                Apprenticeship Programs
              </div>
            </div>
          </div>

          {/* Available Sections */}
          <div>
            <h3 className="text-2xl font-bold text-black mb-6">
              Available Actions
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {stateData.availableSections.includes('verification') && (
                <SectionCard
                  title="Complete Verification"
                  description="Required before posting jobs"
                  href="/employer/verification"
                  icon={<Shield className="h-10 w-10" />}
                  badge="Required"
                />
              )}

              {stateData.availableSections.includes('postings') && (
                <SectionCard
                  title="Manage Job Postings"
                  description={`${postings?.length || 0} active posting${(postings?.length || 0) !== 1 ? 's' : ''}`}
                  href="/employer/dashboard"
                  icon={<Briefcase className="h-10 w-10" />}
                />
              )}

              {stateData.availableSections.includes('candidates') && (
                <SectionCard
                  title="View Candidates"
                  description="Browse trained workers"
                  href="/employer/candidates"
                  icon={<Users className="h-10 w-10" />}
                  badge={
                    (applications?.length || 0) > 0
                      ? `${applications?.length} New`
                      : undefined
                  }
                />
              )}

              {stateData.availableSections.includes('apprenticeship') && (
                <SectionCard
                  title={
                    apprenticeshipProgram
                      ? 'Manage Apprenticeship'
                      : 'Start Apprenticeship Program'
                  }
                  description={
                    apprenticeshipProgram
                      ? 'Track apprentices and compliance'
                      : 'Build your talent pipeline'
                  }
                  href="/employer/dashboard"
                  icon={<TrendingUp className="h-10 w-10" />}
                  badge={apprenticeshipProgram ? 'Active' : undefined}
                />
              )}

              {stateData.availableSections.includes('compliance') && (
                <SectionCard
                  title="Compliance Dashboard"
                  description="Track apprenticeship requirements"
                  href="/employer/compliance"
                  icon={<Shield className="h-10 w-10" />}
                />
              )}

              {stateData.availableSections.includes('reports') && (
                <SectionCard
                  title="Reports & Analytics"
                  description="View hiring metrics"
                  href="/employer/reports"
                  icon={<FileText className="h-10 w-10" />}
                />
              )}
            </div>
          </div>

          {/* Recent Postings */}
          {(postings?.length || 0) > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-black mb-4">
                Active Job Postings
              </h3>
              <div className="space-y-3">
                {postings?.slice(0, 5).map((posting) => (
                  <div
                    key={posting.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <div className="font-semibold text-black">
                        {posting.title}
                      </div>
                      <div className="text-sm text-black">
                        Posted:{' '}
                        {safeFormatDate(posting.created_at)}
                      </div>
                    </div>
                    <a
                      href={`/employer/postings/${posting.id}`}
                      className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 transition text-sm"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="space-y-6">
          {/* Company Info */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="h-11 w-11 text-brand-blue-600" />
              <div>
                <h3 className="font-bold text-black">
                  {profile.company_name || 'Your Company'}
                </h3>
                <div className="text-sm text-black">
                  {profile.verified ? (
                    <span className="text-brand-green-600 font-semibold">
                      • Verified
                    </span>
                  ) : (
                    <span className="text-yellow-600 font-semibold">
                      Pending Verification
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-black mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              {profile.verified && (
                <a
                  href="/employer/dashboard"
                  className="block w-full text-center px-4 py-3 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 transition"
                >
                  Post New Job
                </a>
              )}
              <a
                href="/employer/candidates"
                className="block w-full text-center px-4 py-3 bg-slate-200 text-black rounded-lg font-semibold hover:bg-slate-300 transition"
              >
                Browse Candidates
              </a>
            </div>
          </div>

          {/* Apprenticeship CTA */}
          {!apprenticeshipProgram && profile.verified && (
            <div className="bg-brand-blue-50 rounded-lg border-2 border-brand-blue-600 p-6">
              <h3 className="text-lg font-bold text-brand-blue-900 mb-3">
                Build Your Talent Pipeline
              </h3>
              <p className="text-brand-blue-800 mb-4 text-sm">
                Start an apprenticeship program and train workers specifically
                for your needs.
              </p>
              <a
                href="/employer/dashboard"
                className="block w-full text-center px-4 py-3 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 transition"
              >
                Learn More
              </a>
            </div>
          )}

          {/* Support Card */}
          <div className="bg-brand-blue-50 rounded-lg border-2 border-brand-blue-600 p-6">
            <h3 className="text-lg font-bold text-brand-blue-900 mb-3">Need Help?</h3>
            <p className="text-brand-blue-800 mb-4 text-sm">
              Our team is here to help you find the right candidates.
            </p>
            <a
              href="/support"
              className="block w-full text-center px-4 py-3 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 transition"
            >
              Call Get Help Online
            </a>
          </div>

          {/* Employer Tools */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-black mb-4">
              Employer Tools
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link
                href="/employer/jobs"
                aria-label="Link"
                className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
              >
                My Jobs
              </Link>
              <Link
                href="/employer/post-job"
                aria-label="Link"
                className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
              >
                Post Job
              </Link>
              <Link
                href="/employer/candidates"
                aria-label="Link"
                className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
              >
                Candidates
              </Link>
              <Link
                href="/employer/placements"
                aria-label="Link"
                className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
              >
                Placements
              </Link>
              <Link
                href="/employer/opportunities"
                aria-label="Link"
                className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
              >
                Opportunities
              </Link>
              <Link
                href="/employer/analytics"
                aria-label="Link"
                className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
              >
                Analytics
              </Link>
              <Link
                href="/employer/settings"
                aria-label="Link"
                className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm"
              >
                Settings
              </Link>
            </div>
          </div>

          {/* Workforce Analytics */}
          <div className="mt-8">
            <EmployerWorkforceAnalytics />
          </div>
        </div>
      </div>
    </StateAwareDashboard>
  );
}
