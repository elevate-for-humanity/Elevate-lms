import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { loadLearnerWorkspace } from '@/lib/learner/workspace';
import { AgreementAcceptanceButton } from '@/components/lms/AgreementAcceptanceButton';

export const dynamic = 'force-dynamic';
export default async function HandbookPage() {
  const { user } = await requireRole(['student','learner','admin']);
  const handbook = (await loadLearnerWorkspace(user.id)).agreements.find((item) => item.type === 'handbook');
  return <div className="mx-auto max-w-4xl space-y-6"><div><p className="text-xs font-black uppercase tracking-widest text-blue-700">Learner policy</p><h1 className="mt-2 text-3xl font-black">Student Handbook</h1><p className="mt-2 text-slate-700">The handbook covers attendance, academic progress, conduct, accessibility, grievances, support, records, credentials, and completion requirements.</p></div><section className="rounded-2xl border bg-white p-6"><h2 className="text-xl font-black">Your responsibilities</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700"><li>Attend and participate in scheduled training.</li><li>Complete assigned work and maintain satisfactory progress.</li><li>Keep contact information and required documents current.</li><li>Follow safety, conduct, privacy, and academic-integrity policies.</li><li>Contact learner support promptly when barriers arise.</li></ul></section><div className="flex flex-wrap items-center gap-4"><Link href="/lms/legal/student-handbook" target="_blank" className="font-black text-blue-800 underline">Open complete handbook</Link>{handbook && !handbook.signed ? <AgreementAcceptanceButton type="handbook" version={handbook.version} /> : <span className="font-bold text-emerald-800">Handbook acknowledged</span>}</div></div>;
}
