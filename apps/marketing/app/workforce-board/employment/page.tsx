import { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, MapPin, DollarSign, Building2, ArrowRight } from 'lucide-react';
import PictureFirstPageHero from '@/components/site/PictureFirstPageHero';
import { getAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Employment Opportunities | Workforce Board',
  keywords: ['jobs', 'employment', 'careers', 'workforce', 'hiring'],
  description: 'View current employment opportunities and connect with employers and workforce partners.',
};

type JobRow = {
  id: string;
  title: string | null;
  name: string | null;
  company: string | null;
  location: string | null;
  type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  description: string | null;
  created_at: string | null;
};

function moneyRange(min: number | null, max: number | null) {
  if (min == null && max == null) return null;
  const fmt = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  if (min != null && max != null) return `${fmt(min)}–${fmt(max)}`;
  return min != null ? `From ${fmt(min)}` : `Up to ${fmt(max as number)}`;
}

export default async function WorkforceEmploymentPage() {
  let jobs: JobRow[] = [];
  try {
    const db = await getAdminClient();
    if (db) {
      const { data } = await db
        .from('jobs')
        .select('id,title,name,company,location,type,salary_min,salary_max,description,created_at')
        .in('status', ['active', 'open', 'published'])
        .order('created_at', { ascending: false })
        .limit(50);
      jobs = (data ?? []) as JobRow[];
    }
  } catch {
    jobs = [];
  }

  return (
    <div className="min-h-screen bg-white">
      <PictureFirstPageHero
        image="/images/pages/workforce-board-page-1.webp"
        alt="Workforce employment and employer connection services"
        eyebrow="Workforce Employment"
        title="Employment Opportunities"
        description="Current openings are loaded from the platform job database. If no jobs are published, career services can still help with employer referrals and job-search support."
        actions={(
          <>
            <Link href="/career-services/contact" className="inline-flex items-center rounded-lg bg-brand-red-600 px-7 py-3 font-bold text-white transition-colors hover:bg-brand-red-700">Get Job-Search Help</Link>
            <Link href="/apply/employer" className="inline-flex items-center rounded-lg border-2 border-slate-300 bg-white px-7 py-3 font-bold text-slate-900 transition-colors hover:border-slate-500">Employer Partnership</Link>
          </>
        )}
      />

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-slate-950">Published Positions</h2>
            <span className="text-sm font-semibold text-slate-600">{jobs.length} current listing{jobs.length === 1 ? '' : 's'}</span>
          </div>

          {jobs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center sm:p-12">
              <Briefcase className="mx-auto h-10 w-10 text-slate-500" />
              <h3 className="mt-4 text-xl font-black text-slate-950">No jobs are published right now</h3>
              <p className="mx-auto mt-3 max-w-xl text-slate-700">This page no longer displays fabricated sample jobs. Contact career services for current employer referrals or check again when new listings are published.</p>
              <Link href="/career-services/contact" className="mt-6 inline-flex items-center rounded-lg bg-brand-blue-700 px-6 py-3 font-bold text-white hover:bg-brand-blue-800">Contact Career Services <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => {
                const salary = moneyRange(job.salary_min, job.salary_max);
                return (
                  <article key={job.id} className="rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-brand-blue-200 hover:shadow-md">
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          {job.type ? <span className="rounded bg-brand-blue-100 px-2 py-1 text-xs font-semibold text-brand-blue-800">{job.type}</span> : null}
                        </div>
                        <h3 className="text-lg font-bold text-slate-950">{job.title || job.name || 'Employment Opportunity'}</h3>
                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-700">
                          {job.company ? <span className="inline-flex items-center gap-1"><Building2 className="h-4 w-4" /> {job.company}</span> : null}
                          {job.location ? <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location}</span> : null}
                          {salary ? <span className="inline-flex items-center gap-1"><DollarSign className="h-4 w-4" /> {salary}</span> : null}
                        </div>
                        {job.description ? <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-700">{job.description}</p> : null}
                      </div>
                      <Link href={`/career-services/contact?job=${encodeURIComponent(job.id)}`} className="inline-flex shrink-0 items-center rounded-lg bg-brand-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-brand-blue-800">Ask About This Job</Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-brand-blue-100 bg-brand-blue-50 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-950">Are You Hiring?</h2>
          <p className="mb-8 text-slate-700">Employer partners can submit their organization and hiring needs for review.</p>
          <Link href="/apply/employer" className="inline-flex items-center rounded-lg bg-brand-blue-700 px-8 py-4 font-bold text-white transition-colors hover:bg-brand-blue-800">Employer Application <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </div>
      </section>
    </div>
  );
}
