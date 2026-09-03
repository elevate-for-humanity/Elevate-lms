import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { getActiveJobs } from '@/lib/data/jobs';
import JobCard from '@/components/jobs/JobCard';

export const dynamic = 'force-dynamic';
export default async function CareerPage() {
  await requireRole(['student','learner','admin']);
  const jobs = await getActiveJobs({ limit: 8 });
  return <div className="mx-auto max-w-5xl space-y-6"><div><p className="text-xs font-black uppercase tracking-widest text-blue-700">Personalized career feed</p><h1 className="mt-2 text-3xl font-black">Career Services</h1><p className="mt-2 text-slate-700">Job opportunities, placement support, and practical next steps for your career.</p></div><div className="grid gap-4 sm:grid-cols-2">{jobs.map((job) => <JobCard key={job.id} job={job} showApply href="/lms/placement" />)}</div>{jobs.length === 0 ? <div className="rounded-2xl border border-dashed p-8 text-center"><h2 className="font-black">No current matches</h2><p className="mt-2 text-slate-600">New opportunities are added regularly. Career support remains available.</p></div> : null}<Link href="/lms/placement" className="inline-flex rounded-xl bg-slate-950 px-5 py-3 font-black text-white">Open placement center</Link></div>;
}
