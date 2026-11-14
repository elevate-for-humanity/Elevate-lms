import Link from 'next/link';
import { getActiveJobs, formatSalary, jobTypeLabel } from '@/lib/data/jobs';
import { logger } from '@/lib/logger';

interface LiveJobPostingsProps {
  limit?: number;
  heading?: string;
  className?: string;
  programSlug?: string;
  showBoardLink?: boolean;
}

/** Live employer postings from `job_postings` — not the legacy empty `jobs` table. */
export default async function LiveJobPostings({
  limit = 6,
  heading = 'Open Positions',
  className = '',
  programSlug,
  showBoardLink = true,
}: LiveJobPostingsProps) {
  let jobs: Awaited<ReturnType<typeof getActiveJobs>> = [];
  let unavailable = false;

  try {
    jobs = await getActiveJobs({ limit, throwOnError: true });
  } catch (error) {
    unavailable = true;
    // Circuit breaker or connection error - return empty array gracefully
    logger.warn('[LiveJobPostings] Failed to fetch jobs, showing empty state', { error });
  }

  return (
    <section className={`py-12 px-4 bg-slate-50 ${className}`.trim()}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-8">
          <h2 className="text-2xl font-bold text-slate-800">{heading}</h2>
          {showBoardLink ? (
            <Link
              href="/jobs"
              className="text-sm font-medium text-brand-blue-600 hover:text-brand-blue-700 shrink-0"
            >
              View full job board →
            </Link>
          ) : null}
        </div>
        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <p className="text-slate-700">
              {unavailable
                ? 'Job listings are temporarily unavailable. Please check back.'
                : 'No active employer postings right now. Check back for new openings.'}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Hiring for your shop or business? Share an opening through the employer portal.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/employers/post-job"
                className="inline-flex min-h-11 items-center rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white"
              >
                Post an opening
              </Link>
              <Link
                href="/employers/directory"
                className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-900"
              >
                Explore participating employers
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/careers/jobs/${job.id}`}
                className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-xl hover:border-brand-blue-400 hover:shadow-md transition-all"
              >
                <div className="min-w-0 pr-4">
                  <h3 className="font-semibold text-slate-800">{job.title}</h3>
                  <p className="text-sm text-slate-500 truncate">
                    {job.location ?? 'Indiana'}
                    {job.job_type ? ` · ${jobTypeLabel(job.job_type)}` : ''}
                    {formatSalary(job) !== 'Salary not listed' ? ` · ${formatSalary(job)}` : ''}
                  </p>
                </div>
                <span className="text-brand-blue-600 text-sm font-medium shrink-0">Details →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
