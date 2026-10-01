import Link from 'next/link';
import Image from 'next/image';
import { BriefcaseBusiness, ClipboardCheck, GraduationCap } from 'lucide-react';
import JobCard from '@/components/jobs/JobCard';
import { getActiveJobs } from '@/lib/data/jobs';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Program Holder Career Feed',
  description: 'Career opportunities and placement workflow for Program Holders.',
};

export default async function ProgramHolderCareerPage() {
  const jobs = await getActiveJobs({ limit: 12 });
  return (
    <main className="space-y-6 px-4 py-6 sm:px-6">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
        <Image src="/images/pages/community-page-2.webp" alt="" fill priority sizes="100vw" className="object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-blue-950/65" />
        <div className="relative p-6 sm:p-9">
        <BriefcaseBusiness className="h-9 w-9 text-blue-200" />
        <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-blue-200">Career and placement</p>
        <h1 className="mt-2 break-words text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">Opportunities to share with your learners</h1>
        <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-100 sm:text-base">
          Review current opportunities, discuss readiness with the learner, and document placement progress in the learner record.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/program-holder/students" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-slate-950">
            <GraduationCap className="h-4 w-4" /> Open student roster
          </Link>
          <Link href="/program-holder/reports" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/50 bg-blue-900/60 px-4 text-sm font-black text-white">
            <ClipboardCheck className="h-4 w-4" /> Record outcomes
          </Link>
        </div>
        </div>
      </section>
      {jobs.length ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {jobs.map((job) => <JobCard key={job.id} job={job} href="/program-holder/career" />)}
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
          No active opportunities are published right now. Continue career-readiness coaching and check this feed again.
        </section>
      )}
    </main>
  );
}
