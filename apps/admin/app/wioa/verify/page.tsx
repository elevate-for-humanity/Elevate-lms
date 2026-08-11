import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, FileText, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { getAdminDocumentUrl } from '@/lib/admin/document-access';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Verify Eligibility | WIOA Admin' };

export default async function WIOAVerifyPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const auth = await requireAdmin();
  const adminId = auth.session.user.id;
  const supabase = await createClient();
  const { id } = await searchParams;

  if (!id) {
    const { data: pending } = await supabase
      .from('wioa_participants')
      .select('id,first_name,last_name,email,eligibility_status,created_at')
      .in('eligibility_status', ['pending', 'in_review'])
      .order('created_at', { ascending: true })
      .limit(50);

    return (
      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <Link href="/wioa/eligibility" className="inline-flex items-center gap-2 text-sm font-bold text-brand-blue-700"><ArrowLeft className="h-4 w-4" />Back to eligibility</Link>
        <div><h1 className="text-3xl font-black text-slate-950">Pending WIOA Verifications</h1><p className="mt-1 text-sm text-slate-600">Select a participant to review current eligibility evidence.</p></div>
        {!pending?.length ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center"><CheckCircle className="mx-auto h-8 w-8 text-emerald-600" /><p className="mt-3 font-bold text-emerald-900">No pending verifications.</p></div> : <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{pending.map((participant) => <Link key={participant.id} href={`/wioa/verify?id=${participant.id}`} className="flex items-center gap-4 border-b border-slate-100 p-4 last:border-0 hover:bg-slate-50"><div className="rounded-full bg-amber-100 p-2"><Users className="h-5 w-5 text-amber-700" /></div><div className="min-w-0 flex-1"><p className="font-bold text-slate-900">{participant.first_name} {participant.last_name}</p><p className="truncate text-sm text-slate-500">{participant.email}</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">{participant.eligibility_status}</span></Link>)}</div>}
      </main>
    );
  }

  const { data: participant } = await supabase.from('wioa_participants').select('*').eq('id', id).maybeSingle();
  if (!participant) return <main className="p-8 text-center text-slate-700">Participant not found.</main>;

  const { data: documents } = await supabase.from('documents').select('id,title,file_url,file_path,document_type,status,created_at').eq('user_id', participant.user_id).order('created_at', { ascending: false });
  const docs = await Promise.all((documents ?? []).map(async (doc) => {
    if (!doc.file_path) return doc;
    const signed = await getAdminDocumentUrl({ adminId, documentId: doc.id, context: 'wioa_verify' });
    return { ...doc, file_url: signed || doc.file_url };
  }));

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <Link href="/wioa/verify" className="inline-flex items-center gap-2 text-sm font-bold text-brand-blue-700"><ArrowLeft className="h-4 w-4" />Back to verification list</Link>
      <section className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 p-6 text-white shadow-lg"><p className="text-xs font-black uppercase tracking-widest text-blue-100">WIOA eligibility review</p><h1 className="mt-2 text-3xl font-black">{participant.first_name} {participant.last_name}</h1><p className="mt-1 text-sm text-blue-100">{participant.email}</p></section>
      <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-black uppercase text-slate-500">Eligibility status</p><p className="mt-2 text-lg font-black capitalize text-slate-950">{String(participant.eligibility_status || 'pending').replaceAll('_',' ')}</p></div><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-black uppercase text-slate-500">WorkOne case</p><p className="mt-2 text-lg font-black text-slate-950">{participant.workone_case_number || 'Not recorded'}</p></div></div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4"><FileText className="h-4 w-4" /><h2 className="font-black text-slate-950">Eligibility documents</h2></div>{docs.length === 0 ? <p className="p-6 text-sm text-slate-600">No documents have been uploaded for this participant.</p> : <div className="divide-y divide-slate-100">{docs.map((doc) => <div key={doc.id} className="flex flex-wrap items-center gap-3 px-5 py-4"><div className="min-w-0 flex-1"><p className="font-bold text-slate-900">{doc.title || doc.document_type || 'Document'}</p><p className="text-xs text-slate-500">{doc.status || 'uploaded'}</p></div>{doc.file_url ? <a href={doc.file_url} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700">Open</a> : <span className="text-xs font-bold text-amber-700">No file URL</span>}</div>)}</div>}</section>
      <form action="/api/admin/wioa/verify" method="POST" className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-5"><input type="hidden" name="participantId" value={participant.id} /><button name="action" value="approve" className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white">Approve eligibility</button><button name="action" value="deny" className="rounded-xl bg-rose-700 px-4 py-2 text-sm font-black text-white">Deny eligibility</button></form>
    </main>
  );
}
