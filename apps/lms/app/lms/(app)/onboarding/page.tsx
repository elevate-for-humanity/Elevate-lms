import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { loadLearnerWorkspace } from '@/lib/learner/workspace';
import { LearnerStatusBadge } from '@/components/lms/LearnerStatusBadge';

export const dynamic = 'force-dynamic';

export default async function LearnerOnboardingPage() {
  const { user, profile } = await requireRole(['student', 'learner', 'admin']);
  const workspace = await loadLearnerWorkspace(user.id, profile?.role || 'student');
  const complete = workspace.onboardingSteps.filter((step) => step.status === 'complete').length;

  return <div className="mx-auto max-w-5xl space-y-6">
    <section className="rounded-3xl bg-slate-950 p-7 text-white">
      <p className="text-xs font-black uppercase tracking-widest text-blue-300">Learner onboarding</p>
      <h1 className="mt-2 text-3xl font-black">Complete your requirements</h1>
      <p className="mt-3 text-slate-200">{complete} of {workspace.onboardingSteps.length} required steps complete.</p>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-700" role="progressbar" aria-valuenow={workspace.onboardingPercent} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-blue-500" style={{ width: `${workspace.onboardingPercent}%` }} /></div>
      <p className="mt-2 text-right text-sm font-bold">{workspace.onboardingPercent}%</p>
    </section>

    {workspace.warnings.length > 0 ? <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-5 text-red-950"><h2 className="font-black">Some records need staff review</h2><ul className="mt-2 list-disc pl-5 text-sm">{workspace.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div> : null}

    {workspace.nextRequiredAction ? <section className="rounded-2xl border-2 border-red-400 bg-red-50 p-6"><p className="text-xs font-black uppercase tracking-wide text-red-800">Next required action</p><h2 className="mt-2 text-xl font-black text-red-950">{workspace.nextRequiredAction.title}</h2><p className="mt-2 text-red-900">{workspace.nextRequiredAction.description}</p><Link href={workspace.nextRequiredAction.href} className="mt-4 inline-flex rounded-xl bg-red-700 px-5 py-3 font-black text-white">Complete this step</Link></section> : null}

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-5"><h2 className="text-xl font-black">Onboarding checklist</h2></div>
      <div className="divide-y divide-slate-100">{workspace.onboardingSteps.map((step) => <div key={step.id} className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-center ${step.status === 'missing' || step.status === 'blocked' ? 'bg-red-50/60' : ''}`}><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-slate-950">{step.title}</h3><LearnerStatusBadge status={step.status} /></div><p className="mt-1 text-sm text-slate-700">{step.description}</p>{step.completedAt ? <p className="mt-1 text-xs text-slate-500">Completed {new Date(step.completedAt).toLocaleDateString()}</p> : null}</div>{step.status !== 'complete' ? <Link href={step.href} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-400 bg-white px-4 py-2 text-sm font-black text-slate-950">Take action</Link> : null}</div>)}</div>
    </section>
  </div>;
}
