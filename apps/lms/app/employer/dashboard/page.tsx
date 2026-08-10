import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, Users, FileText, Shield, Building2, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { getEmployerRecord } from '@/lib/employer/employer-context';
import { MARKETING_HOST } from '@/lib/routing/portal-map';
import { safeFormatDate } from '@/lib/format-utils';
import { getEmployerState } from '@/lib/orchestration/state-machine';
import { StateAwareDashboard, SectionCard } from '@/components/dashboards/StateAwareDashboard';
import WorkforceLiveWidget from '@/components/employer/WorkforceLiveWidget';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Employer Dashboard',
  description: 'Employer hiring, apprenticeship, and workforce operations.',
  robots: { index: false, follow: false },
};

export default async function EmployerDashboardOrchestrated() {
  const { user, effectiveRoles } = await requireRole(['employer', 'sponsor', 'admin']);
  const supabase = await createClient();
  const db = await requireAdminClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, company_name, verified')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) redirect('/unauthorized');

  const isEmployer = effectiveRoles.includes('employer') || effectiveRoles.includes('sponsor');
  const isAdmin = effectiveRoles.includes('admin');
  const employer = await getEmployerRecord(supabase, user.id);

  if (isEmployer && !isAdmin && !employer) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-amber-700" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Complete Employer Onboarding</h1>
          <p className="text-slate-600 mb-6">
            Your login is active, but no employer organization record is linked to this account yet.
          </p>
          <Link
            href={`${MARKETING_HOST}/onboarding/employer`}
            className="inline-flex items-center justify-center bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700"
          >
            Continue Employer Setup
          </Link>
        </div>
      </div>
    );
  }

  const employerId = employer?.id ?? null;
  const isVerified = Boolean(employer?.approved || profile.verified || isAdmin);

  if (isEmployer && !isAdmin && !isVerified) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <section className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Building2 className="h-8 w-8 text-blue-700" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Application Under Review</h1>
          <p className="text-slate-600 mb-6">
            Your employer record is pending approval. Hiring and apprenticeship controls unlock after verification.
          </p>
          <p className="text-sm text-slate-500 mb-6">
            We will use <strong>{profile.email}</strong> for account notifications.
          </p>
          <a
            href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, '')}`}
            className="inline-flex items-center justify-center border border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-semibold hover:bg-slate-50"
          >
            Call {PLATFORM_DEFAULTS.supportPhone}
          </a>
        </div>
      </div>
    );
  }

  const { data: postings } = employerId
    ? await supabase
        .from('job_postings')
        .select('id, title, status, created_at')
        .eq('employer_id', employerId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
    : { data: [] };

  const jobIds = (postings ?? []).map((posting: any) => posting.id);
  const { data: applications } = jobIds.length
    ? await supabase
        .from('job_applications')
        .select('id, job_posting_id, status, applied_at')
        .in('job_posting_id', jobIds)
        .eq('status', 'pending')
    : { data: [] };

  const { data: apprenticeships } = employerId
    ? await supabase
        .from('apprenticeships')
        .select('id, status')
        .eq('employer_id', employerId)
    : { data: [] };

  const apprenticeshipCount = apprenticeships?.length || 0;
  const stateData = getEmployerState({
    isVerified,
    activePostings: postings?.length || 0,
    hasApprenticeshipProgram: apprenticeshipCount > 0,
    pendingApplications: applications?.length || 0,
  });

  const companyName = employer?.company_name || employer?.business_name || profile.company_name || 'Your Company';

  return (
    <StateAwareDashboard
      dominantAction={stateData.dominantAction}
      availableSections={stateData.availableSections}
      lockedSections={stateData.lockedSections}
      alerts={stateData.alerts}
    >
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <MetricCard
              label="Active Job Postings"
              value={postings?.length || 0}
              icon={<Briefcase className="h-11 w-11 text-brand-blue-600" />}
            />
            <MetricCard
              label="Pending Applications"
              value={applications?.length || 0}
              icon={<Users className="h-11 w-11 text-brand-green-600" />}
            />
            <MetricCard
              label="Apprenticeship Programs"
              value={apprenticeshipCount}
              icon={<TrendingUp className="h-11 w-11 text-brand-blue-600" />}
            />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-black mb-6">Available Actions</h3>
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
                  description={`${postings?.length || 0} active posting${(postings?.length || 0) === 1 ? '' : 's'}`}
                  href="/employer/jobs"
                  icon={<Briefcase className="h-10 w-10" />}
                />
              )}
              {stateData.availableSections.includes('candidates') && (
                <SectionCard
                  title="View Candidates"
                  description="Review applicants and trained candidates"
                  href="/employer/applications"
                  icon={<Users className="h-10 w-10" />}
                  badge={(applications?.length || 0) > 0 ? `${applications?.length} New` : undefined}
                />
              )}
              {stateData.availableSections.includes('apprenticeship') && (
                <SectionCard
                  title={apprenticeshipCount > 0 ? 'Manage Apprenticeships' : 'Start Apprenticeship Program'}
                  description={apprenticeshipCount > 0 ? 'Review employer apprenticeship records' : 'Create a draft for review'}
                  href="/employer/apprenticeships"
                  icon={<TrendingUp className="h-10 w-10" />}
                  badge={apprenticeshipCount > 0 ? 'Active' : undefined}
                />
              )}
              {stateData.availableSections.includes('compliance') && (
                <SectionCard
                  title="Compliance Dashboard"
                  description="Track employer and apprenticeship requirements"
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
            {apprenticeship.mappedPrograms.length ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {apprenticeship.mappedPrograms.map((program) => (
                  <div key={program.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-bold text-slate-950">{program.name}</p>
                    <p className="mt-1 text-xs text-slate-600">{program.slug || 'Program record'}</p>
                  </div>
                ))}
              </div>
            ) : apprenticeship.sourceState !== 'unavailable' ? (
              <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-700">
                No apprenticeship program is currently mapped to this employer. This no longer means the platform catalog is empty.
              </div>
            ) : null}
          </div>

          {(postings?.length || 0) > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-black mb-4">Active Job Postings</h3>
              <div className="space-y-3">
                {postings?.slice(0, 5).map((posting: any) => (
                  <div key={posting.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <div className="font-semibold text-black">{posting.title}</div>
                      <div className="text-sm text-slate-600">Posted: {safeFormatDate(posting.created_at)}</div>
                    </div>
                    <Link
                      href={`/employer/postings/${posting.id}`}
                      className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 text-sm"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          <WorkforceLiveWidget />
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="h-11 w-11 text-brand-blue-600" />
              <div>
                <h3 className="font-bold text-black">{companyName}</h3>
                <div className="text-sm text-brand-green-700 font-semibold">Verified employer</div>
              </div>
            </div>
            <Link href="/employer/company" className="text-sm text-brand-blue-700 hover:underline">
              View company profile
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-black mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/employer/post-job"
                className="block w-full text-center px-4 py-3 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700"
              >
                Post New Job
              </Link>
              <Link
                href="/employer/applications"
                className="block w-full text-center px-4 py-3 bg-slate-200 text-black rounded-lg font-semibold hover:bg-slate-300"
              >
                Review Applications
              </Link>
              <Link
                href="/employer/apprenticeships"
                className="block w-full text-center px-4 py-3 bg-slate-200 text-black rounded-lg font-semibold hover:bg-slate-300"
              >
                Apprenticeships
              </Link>
            </div>
          </div>

          <div className="bg-brand-blue-50 rounded-lg border-2 border-brand-blue-600 p-6">
            <h3 className="text-lg font-bold text-brand-blue-900 mb-3">Need Help?</h3>
            <p className="text-brand-blue-800 mb-4 text-sm">Our workforce team can assist with hiring and apprenticeship setup.</p>
            <a
              href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, '')}`}
              className="block w-full text-center px-4 py-3 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700"
            >
              Call {PLATFORM_DEFAULTS.supportPhone}
            </a>
          </div>
        </div>
      </div>
    </StateAwareDashboard>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-2">
        {icon}
        <span className="text-3xl font-bold text-black">{value}</span>
      </div>
      <div className="text-sm text-black">{label}</div>
    </div>
  );
}
