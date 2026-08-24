import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { loadLearnerWorkspace } from '@/lib/learner/workspace';
import { AgreementAcceptanceButton } from '@/components/lms/AgreementAcceptanceButton';

export const dynamic = 'force-dynamic';
export default async function AgreementsPage() {
  const { user, profile } = await requireRole(['student','learner','admin']);
  const workspace = await loadLearnerWorkspace(user.id, profile?.role || 'student');
  return <div className="mx-auto max-w-5xl space-y-6"><div><h1 className="text-3xl font-black">Required Agreements</h1><p className="mt-2 text-slate-700">Read and acknowledge every legal document required for participation.</p></div>{workspace.agreements.map((agreement) => <article key={agreement.type} className={`rounded-2xl border-l-4 p-6 ${agreement.signed ? 'border-emerald-500 bg-emerald-50' : 'border-red-600 bg-red-50'}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-black">{agreement.title}</h2><p className="mt-1 text-sm">{agreement.description}</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-black">{agreement.signed ? 'Complete' : 'Required'}</span></div><div className="mt-4 flex flex-wrap items-center gap-3"><Link href={agreement.documentUrl} target="_blank" className="font-black text-blue-800 underline">Read document</Link>{!agreement.signed ? <AgreementAcceptanceButton type={agreement.type} version={agreement.version} /> : <span className="text-sm font-bold text-emerald-900">Accepted {agreement.acceptedAt ? new Date(agreement.acceptedAt).toLocaleDateString() : ''}</span>}</div></article>)}</div>;
}
