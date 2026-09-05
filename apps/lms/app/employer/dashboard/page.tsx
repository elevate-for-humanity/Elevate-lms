import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, Users, FileText, Shield, Building2, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { getEmployerRecord } from '@/lib/employer/employer-context';
import { loadEmployerApprenticeshipData } from '@/lib/employer/apprenticeship-dashboard-data';
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, company_name, verified')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile) redirect('/unauthorized');

  const isEmployer = effectiveRoles.includes('employer') || effectiveRoles.includes('sponsor');
  const isAdmin = effectiveRoles.includes('admin') || effectiveRoles.includes('super_admin');
  if (isAdmin) return <NeutralEmployerPortalPreview />;
  const employer = await getEmployerRecord(supabase, user.id);

  if (isEmployer && !isAdmin && !employer) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <Building2 className="w-12 h-12 text-amber-700 mx-auto mb-4" />
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
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <Building2 className="w-12 h-12 text-brand-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Application Under Review</h1>
          <p className="text-slate-600 mb-6">
            Your employer record is pending approval. Hiring and apprenticeship controls unlock
            after verification.
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

  const apprenticeshipData = employerId
    ? await loadEmployerApprenticeshipData(supabase, employerId)
    : { partnerships: [], mappedPrograms: [], availablePrograms: [], draftProposals: [] };

  const mappedProgramCount = apprenticeshipData.mappedPrograms.length;
  const availableProgramCount = apprenticeshipData.availablePrograms.length;
  const stateData = getEmployerState({
    isVerified,
    activePostings: postings?.length || 0,
    hasApprenticeshipProgram: mappedProgramCount > 0,
    pendingApplications: applications?.length || 0,
  });

  const companyName =
    employer?.company_name || employer?.business_name || profile.company_name || 'Your Company';

  return (
    <StateAwareDashboard
      dominantAction={stateData.dominantAction}
      availableSections={stateData.availableSections}
      lockedSections={stateData.lockedSections}
      alerts={stateData.alerts}
    >
      <section className="mb-7 rounded-2xl border border-cyan-300 bg-gradient-to-r from-slate-950 to-blue-950 p-5 text-white shadow-lg sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
              Indiana Employer Talent Network
            </p>
            <h2 className="mt-2 text-2xl font-black">Recruit across six industry pathways.</h2>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-200">
              Explore HVAC, CDL, bookkeeping, business administration, web development, and IT help
              desk talent pathways, then use this dashboard to post openings and manage candidates.
              Candidate availability, hiring, funding, and reimbursement are not guaranteed.
            </p>
          </div>
          <a
            href={`${MARKETING_HOST}/employers/talent-network`}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950"
          >
            View Employer Network
          </a>
        </div>
      </section>
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
              label="Mapped Apprenticeship Programs"
              value={mappedProgramCount}
              note={`${availableProgramCount} active apprenticeship pathways available`}
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
                  badge={
                    (applications?.length || 0) > 0 ? `${applications?.length} New` : undefined
                  }
                />
              )}
              {stateData.availableSections.includes('apprenticeship') && (
                <SectionCard
                  title={
                    mappedProgramCount > 0
                      ? 'Manage Apprenticeships'
                      : 'Explore Apprenticeship Programs'
                  }
                  description={
                    mappedProgramCount > 0
                      ? `${mappedProgramCount} employer program mapping${mappedProgramCount === 1 ? '' : 's'}`
                      : `${availableProgramCount} active pathways available for employer mapping`
                  }
                  href="/employer/apprenticeships"
                  icon={<TrendingUp className="h-10 w-10" />}
                  badge={mappedProgramCount > 0 ? 'Mapped' : undefined}
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
          </div>

          {(postings?.length || 0) > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-black mb-4">Active Job Postings</h3>
              <div className="space-y-3">
                {postings?.slice(0, 5).map((posting: any) => (
                  <div
                    key={posting.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <div className="font-semibold text-black">{posting.title}</div>
                      <div className="text-sm text-slate-600">
                        Posted: {safeFormatDate(posting.created_at)}
                      </div>
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
        </div>
      </div>
    </StateAwareDashboard>
  );
}

function NeutralEmployerPortalPreview() {
  const modules = [
    'Job Postings',
    'Applications',
    'Apprenticeships',
    'Company Profile',
    'Live Workforce',
    'Reports',
  ];
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
            Administrator portal preview
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Employer PWA</h1>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-700">
            This neutral preview confirms that the Employer PWA is operational. No employer,
            posting, applicant, workforce, or apprenticeship record is attached to the administrator
            session.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="https://admin.elevateforhumanity.org/employers"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
            >
              Select an employer in Admin
            </a>
            <a
              href="https://admin.elevateforhumanity.org/dashboard"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-950"
            >
              Return to Admin dashboard
            </a>
          </div>
        </section>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((label) => (
            <article
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <Building2 className="h-5 w-5 text-blue-700" />
              <h2 className="mt-3 font-black text-slate-950">{label}</h2>
              <p className="mt-1 text-sm text-slate-600">
                Available after an authorized employer is selected.
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  icon,
  note,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-2">
        {icon}
        <span className="text-3xl font-bold text-black">{value}</span>
      </div>
      <div className="text-sm font-semibold text-black">{label}</div>
      {note ? <div className="mt-1 text-xs text-slate-600">{note}</div> : null}
    </div>
  );
}
