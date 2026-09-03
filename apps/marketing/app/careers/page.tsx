import type { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, MapPin, ArrowRight } from 'lucide-react';
import { getActiveJobs, formatSalary, jobTypeLabel } from '@/lib/data/jobs';

export const metadata: Metadata = {
  title: 'Careers at Elevate for Humanity',
  description:
    'Review current job postings at Elevate for Humanity. Compensation, location, schedule, benefits, and employment terms are controlled by each active posting and written offer.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/careers' },
};

export const revalidate = 0;

export default async function CareersPage() {
  const openPositions = await getActiveJobs({ limit: 20 });

  return (
    <main className="min-h-screen bg-white">
      <section className="bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400">Employment</p>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Careers at Elevate for Humanity</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Current employment opportunities are listed below when available. Job duties,
            compensation, work location, schedule, benefits, eligibility, and other employment terms
            are controlled by the applicable posting and any written offer—not by generic website copy.
          </p>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl font-bold text-slate-900">Employment disclosure</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Elevate does not publish universal benefit promises or employee-outcome statistics on this
            page. An active role may have different employment, contractor, part-time, full-time,
            on-site, hybrid, or remote terms. Review the specific posting before applying.
          </p>
        </div>
      </section>

      <section id="positions" className="px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-red-700">Open roles</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-950">Current postings</h2>
            </div>
          </div>

          {openPositions.length ? (
            <div className="space-y-4">
              {openPositions.map((job) => (
                <article key={job.id} className="rounded-xl border border-slate-200 p-6">
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-slate-500" aria-hidden="true" />
                        <h3 className="text-xl font-bold text-slate-950">{job.title}</h3>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                        {job.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-4 w-4" aria-hidden="true" /> {job.location}
                          </span>
                        )}
                        {job.job_type && <span>{jobTypeLabel(job.job_type)}</span>}
                        <span>{formatSalary(job)}</span>
                      </div>
                      {job.description && (
                        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-700">
                          {job.description}
                        </p>
                      )}
                    </div>
                    <Link
                      href="/jobs"
                      className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
                    >
                      Open jobs board <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8">
              <h3 className="font-bold text-slate-900">No current posting is published</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This page does not create a standing employment offer. Check again when an active role
                is posted or use the contact page for general organizational inquiries.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 px-6 py-12 text-center">
        <h2 className="text-xl font-bold text-slate-900">Questions about a published role?</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
          Reference the exact job title or posting when contacting the organization so the response can
          be tied to the correct employment terms.
        </p>
        <Link href="/contact" className="mt-5 inline-flex rounded-lg bg-brand-red-700 px-6 py-3 font-bold text-white hover:bg-brand-red-800">
          Contact Us
        </Link>
      </section>
    </main>
  );
}
