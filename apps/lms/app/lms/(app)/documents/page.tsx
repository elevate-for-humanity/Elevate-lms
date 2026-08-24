import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { loadLearnerWorkspace } from '@/lib/learner/workspace';

export const dynamic = 'force-dynamic';

export default async function LearnerDocumentsPage() {
  const { user } = await requireRole(['student', 'learner', 'admin']);
  const workspace = await loadLearnerWorkspace(user.id);
  return <div className="mx-auto max-w-5xl"><h1 className="text-3xl font-black">Required Documents</h1><p className="mt-2 text-slate-700">Review missing, submitted, rejected, and verified enrollment evidence.</p>
    {workspace.requirements.length === 0 ? <div role="alert" className="mt-6 rounded-2xl border-2 border-red-300 bg-red-50 p-6"><h2 className="font-black text-red-950">Document requirements are not configured</h2><p className="mt-2 text-red-900">This does not mean onboarding is complete. Learner support must configure the requirements for your program.</p><Link href="/lms/support" className="mt-4 inline-flex rounded-xl bg-red-700 px-5 py-3 font-black text-white">Contact learner support</Link></div> : <div className="mt-6 space-y-4">{workspace.requirements.map((requirement) => { const complete = ['verified','completed'].includes(requirement.status); const urgent = !complete && (requirement.priority === 'high' || requirement.priority === 'urgent' || (requirement.due_date && new Date(requirement.due_date) < new Date())); return <article key={requirement.id} className={`rounded-2xl border-l-4 p-5 ${complete ? 'border-emerald-500 bg-emerald-50' : urgent ? 'border-red-600 bg-red-50' : 'border-amber-500 bg-amber-50'}`}><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-black">{requirement.title}</h2><span className="rounded-full bg-white px-3 py-1 text-xs font-black capitalize">{requirement.status.replace(/_/g,' ')}</span></div>{requirement.description ? <p className="mt-2 text-sm">{requirement.description}</p> : null}{requirement.due_date ? <p className="mt-2 text-sm font-bold">Due {new Date(requirement.due_date).toLocaleDateString()}</p> : null}{!complete ? <Link href={`/lms/documents/upload?requirement=${requirement.id}`} className="mt-4 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">{requirement.status === 'rejected' ? 'Replace document' : 'Upload document'}</Link> : null}</article>; })}</div>}
  </div>;
}
