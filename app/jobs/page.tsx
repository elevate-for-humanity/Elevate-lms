import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/public';
import { Briefcase, MapPin, Clock, ExternalLink, BadgeCheck, Zap, Building2, ChevronRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 900; // 15 min

export const metadata: Metadata = {
  title: `Job Board | ${PLATFORM_DEFAULTS.orgName}`,
  description:
    'Browse job openings from Elevate employer partners, OJT opportunities, apprenticeship positions, and WIOA-approved placements in Indiana.',
  openGraph: {
    title: `Job Board | ${PLATFORM_DEFAULTS.orgName}`,
    description: 'Workforce-aligned job openings — OJT, apprenticeships, and WIOA-approved positions.',
  },
};

async function getJobs() {
  const db = createPublicClient();

  // Internal employer-posted jobs
  const { data: internalJobs } = await db
    .from('public_job_board')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(60);

  // Government feed jobs (most recent 40)
  const { data: govJobs } = await db
    .from('government_job_feed')
    .select('id,source,title,organization,location,salary_range,job_type,remote_type,application_url,posted_at,closes_at')
    .order('imported_at', { ascending: false })
    .limit(40);

  return {
    internal: internalJobs ?? [],
    government: govJobs ?? [],
  };
}

const SOURCE_LABEL: Record<string, string> = {
  usajobs: 'USAJobs.gov',
  careeronestop: 'CareerOneStop',
  indiana_career_connect: 'Indiana Career Connect',
};

const SOURCE_COLOR: Record<string, string> = {
  usajobs: 'bg-blue-50 text-blue-700 border-blue-200',
  careeronestop: 'bg-brand-green-50 text-brand-green-700 border-brand-green-200',
  indiana_career_connect: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default async function JobBoardPage() {
  const { internal, government } = await getJobs();
  const totalJobs = internal.length + government.length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-brand-blue-900 text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Jobs' }]} />
          <h1 className="text-3xl md:text-4xl font-extrabold mt-4 mb-3">
            Workforce Job Board
          </h1>
          <p className="text-brand-blue-200 text-lg max-w-2xl">
            Job openings from Elevate employer partners, federal and state government sources,
            OJT opportunities, and WIOA-approved positions — all in one place.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <span className="bg-brand-blue-800/40 text-white text-sm font-semibold px-3 py-1.5 rounded-full">
              {totalJobs} open positions
            </span>
            <span className="bg-brand-blue-800/40 text-white text-sm font-semibold px-3 py-1.5 rounded-full">
              USAJobs · CareerOneStop · Indiana Career Connect
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">

        {/* Employer CTA */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-900">Are you an employer?</p>
            <p className="text-sm text-slate-500 mt-0.5">
              Post a job, OJT position, or apprenticeship opening — reach Elevate graduates directly.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link
              href="/apply/employer"
              className="text-sm font-semibold text-brand-blue-700 border border-brand-blue-300 hover:bg-brand-blue-50 px-4 py-2 rounded-lg transition-colors"
            >
              Employer Application
            </Link>
            <Link
              href="/employer/post-job"
              className="text-sm font-semibold text-white bg-brand-blue-700 hover:bg-brand-blue-800 px-4 py-2 rounded-lg transition-colors"
            >
              Post a Job →
            </Link>
          </div>
        </div>

        {/* Internal jobs — employer partners */}
        {internal.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-brand-green-600" />
                Elevate Employer Partners
              </h2>
              <Link href="/employers" className="text-sm font-semibold text-brand-blue-600 hover:underline flex items-center gap-1">
                View all employers <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {internal.map((job: any) => (
                <JobCard key={job.id} job={job} isInternal />
              ))}
            </div>
          </section>
        )}

        {/* Government feed */}
        {government.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Government Job Feed
              </h2>
              {/* CareerOneStop logo — required by API terms */}
              <a
                href="https://www.careeronestop.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700"
                title="Powered by CareerOneStop"
              >
                <span className="font-semibold">Powered by</span>
                <span className="font-bold text-brand-green-700 bg-brand-green-50 border border-brand-green-200 px-2 py-0.5 rounded">
                  CareerOneStop
                </span>
              </a>
            </div>
            <div className="space-y-3">
              {government.map((job: any) => (
                <GovJobCard key={job.id} job={job} />
              ))}
            </div>
          </section>
        )}

        {totalJobs === 0 && (
          <div className="text-center py-20">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-semibold">No jobs posted yet.</p>
            <p className="text-slate-400 text-sm mt-1">
              Check back soon — or{' '}
              <Link href="/apply/employer" className="text-brand-blue-600 hover:underline">
                become an employer partner
              </Link>
              .
            </p>
          </div>
        )}

        {/* Indiana Career Connect link-out */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h3 className="font-bold text-amber-900 mb-1">Indiana Career Connect</h3>
          <p className="text-sm text-amber-800 mb-4">
            Browse thousands of additional jobs on Indiana&apos;s official workforce portal,
            powered by the Indiana Department of Workforce Development.
          </p>
          <a
            href="https://www.indianacareerconnect.com/jobs/search"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 px-4 py-2 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Search Indiana Career Connect →
          </a>
        </div>

        {/* USAJobs link-out */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-bold text-blue-900 mb-1">Federal Jobs — USAJobs.gov</h3>
          <p className="text-sm text-blue-800 mb-4">
            Search federal government job openings across all agencies. Many positions qualify
            for WIOA-funded training and OJT reimbursement.
          </p>
          <a
            href="https://www.usajobs.gov/Search/Results?l=Indiana"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-900 bg-blue-100 hover:bg-blue-200 px-4 py-2 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Search USAJobs.gov →
          </a>
        </div>

        {/* CareerOneStop required attribution */}
        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-400 max-w-lg">
            Some job listings are sourced from{' '}
            <a
              href="https://www.careeronestop.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-slate-500 hover:underline"
            >
              CareerOneStop
            </a>
            , sponsored by the U.S. Department of Labor, Employment and Training Administration.
            CareerOneStop is an equal opportunity employer/program. Auxiliary aids and services
            are available upon request to individuals with disabilities.
          </p>
          <a
            href="https://www.careeronestop.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 hover:border-slate-300 transition-colors"
            title="CareerOneStop — Sponsored by the U.S. Department of Labor"
          >
            <Image
              src="https://www.careeronestop.org/images/careeronestop-logo.png"
              alt="CareerOneStop"
              width={140}
              height={32}
              sizes="140px"
              placeholder="empty"
              className="h-8 w-auto"
              unoptimized
            />
          </a>
        </div>

      </div>
    </div>
  );
}

function JobCard({ job, isInternal }: { job: any; isInternal?: boolean }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-brand-blue-300 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-slate-900 text-sm">{job.title}</h3>
            {isInternal && (
              <span className="text-xs font-semibold text-brand-green-700 bg-brand-green-50 border border-brand-green-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <BadgeCheck className="w-3 h-3" /> Partner
              </span>
            )}
            {job.is_ojt && (
              <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">OJT</span>
            )}
            {job.is_apprenticeship && (
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">Apprenticeship</span>
            )}
            {job.wotc_eligible && (
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">WOTC</span>
            )}
            {job.wioa_approved && (
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">WIOA</span>
            )}
          </div>
          <p className="text-sm text-slate-600 font-medium">{job.employer_name}</p>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 flex-wrap">
            {job.location && (
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
            )}
            {job.salary_range && (
              <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.salary_range}</span>
            )}
            {job.remote_type && job.remote_type !== 'onsite' && (
              <span className="capitalize">{job.remote_type}</span>
            )}
          </div>
        </div>
        <a
          href={job.application_url ?? `/careers/${job.id}`}
          target={job.application_url ? '_blank' : undefined}
          rel={job.application_url ? 'noopener noreferrer' : undefined}
          className="flex-shrink-0 text-xs font-bold text-white bg-brand-blue-700 hover:bg-brand-blue-800 px-4 py-2 rounded-lg transition-colors"
        >
          Apply →
        </a>
      </div>
    </div>
  );
}

function GovJobCard({ job }: { job: any }) {
  const sourceLabel = SOURCE_LABEL[job.source] ?? job.source;
  const sourceColor = SOURCE_COLOR[job.source] ?? 'bg-slate-50 text-slate-600 border-slate-200';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-slate-900 text-sm">{job.title}</h3>
            <span className={`text-xs font-semibold border px-2 py-0.5 rounded-full ${sourceColor}`}>
              {sourceLabel}
            </span>
          </div>
          {job.organization && (
            <p className="text-sm text-slate-600 font-medium">{job.organization}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 flex-wrap">
            {job.location && (
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
            )}
            {job.salary_range && (
              <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.salary_range}</span>
            )}
            {job.posted_at && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(job.posted_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <a
          href={job.application_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
        >
          Apply <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
