import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, FileText, Hourglass } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolveApprenticeProgramSlug } from '@/lib/portal/resolve-apprentice-program';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import UploadDocuments from './UploadDocuments';
import { getDocumentUploadGuidance } from './document-guidance';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';

export const metadata: Metadata = {
  title: 'Documents | Apprentice Portal',
  description: 'Required apprenticeship records, signatures, and uploads.',
};
export const dynamic = 'force-dynamic';

const approvedStates = new Set(['approved', 'accepted', 'verified']);

export default async function ApprenticeDocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/apprentice/documents');

  const admin = await requireAdminClient();
  const subject = await resolvePortalPreviewSubject(admin, user.id);
  const programSlug = await resolveApprenticeProgramSlug(admin, subject.userId);
  if (!programSlug) redirect('/lms/dashboard?notice=apprentice-access-required');

  const [{ data: requirements }, { data: documents }] = await Promise.all([
    admin
      .from('apprentice_document_types')
      .select('id,name,description,document_type,is_required,accepted_formats,max_file_size_mb,display_order')
      .eq('program_slug', programSlug)
      .order('display_order', { ascending: true }),
    admin
      .from('documents')
      .select('id,document_type,file_name,status,verification_status,created_at,metadata')
      .eq('user_id', subject.userId)
      .order('created_at', { ascending: false }),
  ]);

  const docs = documents ?? [];
  const required = (requirements ?? []).filter((item: any) => item.is_required);
  const rows = (requirements ?? []).map((requirement: any) => {
    const document = docs.find((doc: any) => doc.document_type === requirement.document_type);
    const raw = String(document?.verification_status || document?.status || 'missing').toLowerCase();
    const status = approvedStates.has(raw) ? 'complete' : raw === 'pending' ? 'pending' : raw === 'rejected' ? 'rejected' : 'missing';
    return { requirement, document, status };
  });
  const missingRequired = rows.filter(({ requirement, status }: any) => requirement.is_required && status !== 'complete').length;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Breadcrumbs items={[{ label: 'Apprentice Portal', href: '/apprentice' }, { label: 'Documents' }]} />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h1 className="text-3xl font-black">Apprenticeship documents</h1>
          <p className="mt-2 text-slate-700">Required records stay visible until accepted. Missing or rejected items are shown in red.</p>
          <div className={`mt-5 rounded-xl border p-4 ${missingRequired ? 'border-red-300 bg-red-50 text-red-950' : 'border-green-300 bg-green-50 text-green-950'}`}>
            {missingRequired ? (
              <div className="flex gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-black">Action required: {missingRequired} required document{missingRequired === 1 ? '' : 's'} incomplete.</p><p className="mt-1 text-sm font-semibold">Upload each missing item below. The signed apprenticeship agreement is required and remains red until accepted.</p></div></div>
            ) : (
              <div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><p className="font-black">All {required.length} required apprenticeship documents are complete.</p></div>
            )}
          </div>
        </div>

        {!subject.previewing ? <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-black">Upload or replace a document</h2>
          <p className="mt-1 text-sm text-slate-600">Approved evidence is locked. Missing, pending, or rejected evidence can be uploaded through the secure document endpoint.</p>
          <div className="mt-5"><UploadDocuments programSlug={programSlug} /></div>
        </section> : <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">Admin preview is read-only. Logan can upload these documents from her own account.</div>}

        <section className="mt-6 grid gap-4">
          {rows.map(({ requirement, document, status }: any) => {
            const complete = status === 'complete';
            const pending = status === 'pending';
            const classes = complete
              ? 'border-green-300 bg-green-50'
              : pending
                ? 'border-amber-300 bg-amber-50'
                : 'border-red-300 bg-red-50';
            return (
              <article key={requirement.id} className={`rounded-2xl border p-5 ${classes}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <FileText className="mt-1 h-6 w-6 shrink-0" />
                    <div>
                      <h2 className="font-black">{requirement.name}</h2>
                      {getDocumentUploadGuidance(requirement) ? <p className="mt-1 max-w-3xl text-sm leading-6">{getDocumentUploadGuidance(requirement)}</p> : null}
                      <p className="mt-1 text-sm font-semibold">{requirement.is_required ? 'Required' : 'Optional'} · Accepted: {(requirement.accepted_formats ?? []).join(', ').toUpperCase()} · Max {requirement.max_file_size_mb || 10} MB</p>
                      {document?.file_name ? <p className="mt-2 text-xs font-semibold">Latest upload: {document.file_name}</p> : null}
                    </div>
                  </div>
                  {complete ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-700 px-3 py-1 text-xs font-black text-white"><CheckCircle2 className="h-4 w-4" /> Complete</span>
                  ) : pending ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-700 px-3 py-1 text-xs font-black text-white"><Hourglass className="h-4 w-4" /> In review</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-700 px-3 py-1 text-xs font-black text-white"><AlertCircle className="h-4 w-4" /> {status === 'rejected' ? 'Rejected — replace' : 'Missing — upload'}</span>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/apprentice" className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold hover:bg-slate-100">Return to dashboard</Link>
          <Link href="/apprentice/hours" className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-800">Hours & timeclock</Link>
        </div>
      </div>
    </main>
  );
}
