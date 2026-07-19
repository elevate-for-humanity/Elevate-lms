import Link from 'next/link';
import { getActiveJobs, formatSalary, jobTypeLabel } from '@/lib/data/jobs';
import { logger } from '@/lib/logger';

interface LiveJobPostingsProps {
  limit?: number;
  heading?: string;
  className?: string;
  programSlug?: string;
}

/** Live employer postings from `job_postings` — not the legacy empty `jobs` table. */
export default async function LiveJobPostings({
  limit = 6,
  heading = 'Open Positions',
  className = '',
  programSlug,
}: LiveJobPostingsProps) {
  let jobs: Awaited<ReturnType<typeof getActiveJobs>> = [];
  
  try {
    jobs = await getActiveJobs({ limit });
  } catch (error) {
    // Circuit breaker or connection error - return empty array gracefully
    logger.warn('[LiveJobPostings] Failed to fetch jobs, showing empty state', { error });
  }

  return (
    <section className={`py-12 px-4 bg-slate-50 ${className}`.trim()}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-8">
          <h2 className="text-2xl font-bold text-slate-800">{heading}</h2>
          <Link
            href="/jobs"
            className="text-sm font-medium text-brand-blue-600 hover:text-brand-blue-700 shrink-0"
          >
            View full job board →
          </Link>
        </div>
        {jobs.length === 0 ? (
          <p className="text-slate-600">
            No employer postings right now. Browse the{' '}
            <Link href="/jobs" className="text-brand-blue-600 font-medium hover:underline">
              job board
            </Link>{' '}
            for government and partner listings, or check back soon.
          </p>
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
