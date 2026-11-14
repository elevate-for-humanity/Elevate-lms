import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { formatSalary, getJobById, jobTypeLabel } from '@/lib/data/jobs';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Career Opportunity' };

export default async function ProgramHolderJobPage({ params }: { params: Promise<{ id: string }> }) {
  await requireProgramHolder();
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const job = await getJobById(id, { throwOnError: true });
  if (!job) notFound();
  const expired = job.application_deadline && new Date(job.application_deadline).getTime() < Date.now();
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <Link href="/program-holder/career" className="font-bold text-blue-700 underline">Back to career feed</Link>
      <article className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="break-words text-3xl font-black text-slate-950">{job.title}</h1>
        <p>{job.location || 'Location not listed'} · {jobTypeLabel(job.job_type ?? job.employment_type)} · {formatSalary(job)}</p>
        {job.remote_allowed && <p>Remote work available</p>}
        {job.application_deadline && <p>{expired ? 'Applications closed' : 'Application deadline'}: {new Date(job.application_deadline).toLocaleDateString('en-US', { timeZone: 'UTC' })}</p>}
        <section><h2 className="text-xl font-bold">Opportunity</h2><p className="whitespace-pre-wrap break-words">{job.description || 'No description supplied by the employer.'}</p></section>
        {job.requirements && <section><h2 className="text-xl font-bold">Requirements</h2><p className="whitespace-pre-wrap break-words">{job.requirements}</p></section>}
        {!!job.skills_required?.length && <section><h2 className="text-xl font-bold">Skills</h2><ul className="list-inside list-disc">{job.skills_required.map(skill => <li key={skill}>{skill}</li>)}</ul></section>}
        <p className="rounded-xl bg-blue-50 p-4 text-sm">Review readiness with the learner and confirm the employer’s application instructions with Elevate before sharing. Record placement progress in the learner record.</p>
        <Link href="/program-holder/students" className="inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-4 font-bold text-white">Open student roster</Link>
      </article>
    </main>
  );
}
