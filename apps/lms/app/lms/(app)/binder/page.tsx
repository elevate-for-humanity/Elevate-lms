import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { loadLearnerWorkspace } from '@/lib/learner/workspace';

export const dynamic = 'force-dynamic';

export default async function LearnerBinderPage() {
  const { user } = await requireRole(['student', 'learner', 'admin']);
  const workspace = await loadLearnerWorkspace(user.id);
  return <div className="mx-auto max-w-5xl"><h1 className="text-3xl font-black">Digital Binder</h1><p className="mt-2 text-slate-700">Your enrollment requirements, agreements, and verified evidence.</p>{workspace.binder ? <div className="mt-6 rounded-2xl border border-emerald-300 bg-emerald-50 p-6"><h2 className="font-black text-emerald-950">Binder active</h2><p className="mt-2 text-emerald-900">Status: {workspace.binder.status}</p><div className="mt-4 flex flex-wrap gap-3"><Link href="/lms/documents" className="rounded-xl bg-emerald-800 px-4 py-2 font-black text-white">Documents</Link><Link href="/lms/agreements" className="rounded-xl border border-emerald-700 bg-white px-4 py-2 font-black text-emerald-950">Agreements</Link></div></div> : <div role="alert" className="mt-6 rounded-2xl border-2 border-red-300 bg-red-50 p-6"><h2 className="font-black text-red-950">Digital binder not provisioned</h2><p className="mt-2 text-red-900">Learner support must connect a binder to your enrollment.</p><Link href="/lms/support" className="mt-4 inline-flex rounded-xl bg-red-700 px-4 py-2 font-black text-white">Get help</Link></div>}</div>;
}
