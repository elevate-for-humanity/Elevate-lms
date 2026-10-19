import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { getActiveJobs } from '@/lib/data/jobs';
import JobCard from '@/components/jobs/JobCard';

export const dynamic = 'force-dynamic';
export default async function CareerPage() {
  await requireRole(['student','learner','apprentice','barber_apprentice','cosmetology_apprentice','admin']);
  const jobs = await getActiveJobs({ limit: 8 });
  return <main className="mx-auto w-full min-w-0 max-w-5xl space-y-6 px-4 pb-24 pt-6 sm:px-6"><div><p className="text-xs font-black uppercase tracking-widest text-blue-700">Personalized career feed</p><h1 className="mt-2 text-3xl font-black">Career Services</h1><p className="mt-2 text-slate-700">Job opportunities, placement support, and practical next steps for your career.</p></div><div className="grid min-w-0 gap-4 sm:grid-cols-2">{jobs.map((job) => <JobCard key={job.id} job={job} showApply href="/lms/placement" />)}</div>{jobs.length === 0 ? <div className="rounded-2xl border border-dashed p-8 text-center"><h2 className="font-black">No current matches</h2><p className="mt-2 text-slate-600">New opportunities are added regularly. Career support remains available.</p></div> : null}<div className="flex flex-wrap gap-3"><Link href="/lms/resume-builder" className="inline-flex min-h-12 items-center rounded-xl bg-blue-700 px-5 py-3 font-black text-white">Open Resume Builder</Link><Link href="/lms/placement" className="inline-flex min-h-12 items-center rounded-xl bg-slate-950 px-5 py-3 font-black text-white">Open placement center</Link><Link href="/lms/certification/upload" className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 px-5 py-3 font-black text-slate-900">Upload credentials</Link></div></main>;
}
