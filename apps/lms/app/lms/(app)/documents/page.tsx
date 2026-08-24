import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, ExternalLink, FileText, Upload } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { generateInternalMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateInternalMetadata({
  title: 'Required Documents',
  description: 'Review learner agreements and document requirements.',
  path: '/lms/documents',
});
export const dynamic = 'force-dynamic';

export default async function LearnerDocumentsPage() {
  const { user } = await requireRole(['student', 'learner', 'admin']);
  const supabase = await createClient();
  const [handbookRes, signaturesRes, uploadsRes] = await Promise.all([
    supabase.from('handbook_acknowledgments').select('*').eq('user_id', user.id).limit(1),
    supabase.from('agreement_signatures').select('*').eq('user_id', user.id),
    supabase.from('learner_documents').select('*').eq('user_id', user.id),
  ]);
  const handbookDone = (handbookRes.data?.length ?? 0) > 0;
  const agreementDone = (signaturesRes.data?.length ?? 0) > 0;
  const uploads = uploadsRes.data ?? [];
  const cards = [
    { title: 'Student Handbook', detail: handbookDone ? 'Acknowledgment recorded' : 'Review and acknowledgment required', done: handbookDone, href: 'https://www.elevateforhumanity.org/onboarding/learner/handbook' },
    { title: 'Learner MOU and agreements', detail: agreementDone ? 'Signature recorded' : 'Review and signature required', done: agreementDone, href: 'https://www.elevateforhumanity.org/onboarding/learner/agreements' },
    { title: 'Privacy Statement', detail: 'Available for review', done: true, href: 'https://www.elevateforhumanity.org/privacy' },
  ];

  return <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
    <div className="mx-auto max-w-4xl">
      <Link href="/lms/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-brand-blue-800 hover:underline"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
      <h1 className="mt-5 text-3xl font-black text-slate-950">Required Documents</h1>
      <p className="mt-2 font-medium text-slate-700">Review official learner documents and see only verified acknowledgment or upload status.</p>
      <div className="mt-6 grid gap-4">
        {cards.map((card) => <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start gap-3"><div className="rounded-xl bg-slate-100 p-2">{card.done ? <CheckCircle className="h-5 w-5 text-green-700" /> : <FileText className="h-5 w-5 text-amber-700" />}</div>
            <div className="flex-1"><h2 className="font-black text-slate-950">{card.title}</h2><p className="mt-1 text-sm font-medium text-slate-700">{card.detail}</p>
              <a href={card.href} className="mt-3 inline-flex items-center gap-2 text-sm font-black text-brand-blue-800 hover:underline">Open document <ExternalLink className="h-4 w-4" /></a>
            </div>
          </div>
        </article>)}
      </div>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="flex items-center gap-2 font-black text-slate-950"><Upload className="h-5 w-5" /> Learner uploads</h2>
        <p className="mt-2 text-sm font-medium text-slate-700">{uploads.length > 0 ? `${uploads.length} document${uploads.length === 1 ? '' : 's'} recorded.` : 'No learner uploads are currently recorded.'}</p>
        <Link href="/lms/support" className="mt-4 inline-flex text-sm font-black text-brand-blue-800 hover:underline">Contact learner support about a required upload</Link>
      </section>
    </div>
  </main>;
}
