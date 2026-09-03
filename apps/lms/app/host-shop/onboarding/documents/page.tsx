import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AlertCircle, CheckCircle2, FileUp, Hourglass } from 'lucide-react';
import { requireCurrentHostShopPartner } from '@/lib/partners/current-host-shop';
import { getHostShopBoard } from '@/lib/partner/board';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Host Shop Documents | Elevate LMS',
  robots: { index: false, follow: false },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
// Keep this list aligned with the private `partner-documents` Storage bucket.
const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

async function loadContext() {
  try {
    return await requireCurrentHostShopPartner();
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'HOST_SHOP_UNAUTHENTICATED') {
      redirect('/host-shop/login?redirect=/host-shop/onboarding/documents');
    }
    if (code === 'HOST_SHOP_ADMIN_PARTNER_REQUIRED') {
      redirect('/host-shop/dashboard');
    }
    redirect('/unauthorized');
  }
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').slice(-120);
}

async function uploadHostShopDocument(formData: FormData) {
  'use server';

  const { user, db, partner } = await requireCurrentHostShopPartner();
  const board = await getHostShopBoard(user.id);
  const documentType = String(formData.get('documentType') ?? '').trim();
  const fileEntry = formData.get('file');
  const expirationDate = String(formData.get('expirationDate') ?? '').trim();
  const requirement = board.documentStatuses.find(
    (item: any) => item.document_type === documentType,
  );

  if (!requirement || !(fileEntry instanceof File) || fileEntry.size === 0) {
    redirect('/host-shop/onboarding/documents?error=invalid_file');
  }
  if (fileEntry.size > MAX_FILE_SIZE) {
    redirect('/host-shop/onboarding/documents?error=file_too_large');
  }
  if (!ALLOWED_TYPES.has(fileEntry.type)) {
    redirect('/host-shop/onboarding/documents?error=file_type');
  }
  if (requirement.requires_expiration && !expirationDate) {
    redirect('/host-shop/onboarding/documents?error=expiration_required');
  }

  const fileName = safeFileName(fileEntry.name || `${documentType}.bin`);
  const storagePath = `${partner.id}/${documentType}/${Date.now()}-${fileName}`;
  const { error: uploadError } = await db.storage
    .from('partner-documents')
    .upload(storagePath, fileEntry, {
      contentType: fileEntry.type,
      upsert: false,
    });

  if (uploadError) throw new Error(`HOST_SHOP_DOCUMENT_UPLOAD_FAILED:${uploadError.message}`);

  const { error: insertError } = await db.from('partner_documents').insert({
    partner_id: partner.id,
    document_type: documentType,
    program_id: board.programType,
    state: partner.state || 'Indiana',
    display_name: requirement.document_name || documentType,
    file_name: fileEntry.name,
    file_url: storagePath,
    file_type: fileEntry.type,
    file_size: fileEntry.size,
    storage_bucket: 'partner-documents',
    status: 'pending',
    expiration_date: expirationDate || null,
  });

  if (insertError) {
    await db.storage.from('partner-documents').remove([storagePath]);
    throw new Error(`HOST_SHOP_DOCUMENT_RECORD_FAILED:${insertError.message}`);
  }

  await db
    .from('partners')
    .update({ onboarding_step: 'documents', updated_at: new Date().toISOString() })
    .eq('id', partner.id);

  redirect(`/host-shop/onboarding/documents?uploaded=${encodeURIComponent(documentType)}`);
}

function statusBadge(status: string) {
  if (status === 'accepted') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-800"><CheckCircle2 className="h-3.5 w-3.5" /> Accepted</span>;
  }
  if (status === 'pending') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900"><Hourglass className="h-3.5 w-3.5" /> In review</span>;
  }
  return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-800"><AlertCircle className="h-3.5 w-3.5" /> {status === 'rejected' ? 'Rejected' : 'Required'}</span>;
}

export default async function HostShopDocumentsPage({ searchParams }: { searchParams: Promise<{ error?: string; uploaded?: string; profile?: string }> }) {
  const { user, partner, isPlatformAdmin } = await loadContext();
  const board = await getHostShopBoard(user.id);
  const params = await searchParams;
  const allRequiredAccepted = board.requiredDocumentCount > 0 && board.acceptedDocumentCount === board.requiredDocumentCount;

  const errorMessage = params.error === 'invalid_file'
    ? 'Choose a document file before submitting.'
    : params.error === 'file_too_large'
      ? 'That file is larger than 10 MB.'
      : params.error === 'file_type'
        ? 'Upload PDF, JPG, PNG, or WEBP files only.'
        : params.error === 'expiration_required'
          ? 'This document requires an expiration date.'
          : null;

  return (
    <main className="bg-slate-50 px-4 py-10 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <FileUp className="h-9 w-9 text-blue-700" />
          <h1 className="mt-4 text-3xl font-black">Host Shop compliance documents</h1>
          <p className="mt-2 max-w-3xl text-slate-700">Upload the required records for {partner.dba || partner.name}. Files are stored in the private partner-document bucket and remain pending until reviewed by Elevate.</p>
          <p className="mt-4 text-sm font-bold text-slate-700">{board.acceptedDocumentCount} of {board.requiredDocumentCount} required documents accepted</p>
          {isPlatformAdmin ? <p className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm font-bold text-blue-950">Admin tenant view: uploads and replacements apply only to the selected Host Shop.</p> : null}
        </div>

        {params.profile === 'saved' ? <div className="mt-5 rounded-xl border border-green-300 bg-green-50 p-4 font-bold text-green-950">Onboarding profile saved. Complete the required document uploads below.</div> : null}
        {params.uploaded ? <div className="mt-5 rounded-xl border border-blue-300 bg-blue-50 p-4 font-bold text-blue-950">Document uploaded and sent for review.</div> : null}
        {errorMessage ? <div role="alert" className="mt-5 rounded-xl border border-red-300 bg-red-50 p-4 font-bold text-red-950">{errorMessage}</div> : null}

        <div className="mt-6 grid gap-5">
          {board.documentStatuses.map((requirement: any) => {
            const status = String(requirement.status || 'missing');
            const needsUpload = status !== 'accepted' && status !== 'pending';
            return (
              <section key={requirement.document_type} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-black">{requirement.document_name}</h2>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-700">{requirement.description || 'Required host-site compliance document.'}</p>
                    {requirement.document?.file_name ? <p className="mt-2 text-xs font-semibold text-slate-600">Latest file: {requirement.document.file_name}</p> : null}
                    {requirement.document?.rejection_reason ? <p className="mt-2 text-sm font-bold text-red-800">Review note: {requirement.document.rejection_reason}</p> : null}
                  </div>
                  {statusBadge(status)}
                </div>

                {needsUpload ? (
                  <form action={uploadHostShopDocument} className="mt-5 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-[1fr_auto] sm:items-end">
                    <input type="hidden" name="documentType" value={requirement.document_type} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="font-bold">File *<input type="file" name="file" required accept=".pdf,image/jpeg,image/png" className="mt-2 block w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:font-bold file:text-white" /></label>
                      {requirement.requires_expiration ? <label className="font-bold">Expiration date *<input type="date" name="expirationDate" required className="mt-2 w-full rounded-xl border border-slate-400 px-4 py-3 font-medium" /></label> : null}
                    </div>
                    <button type="submit" className="min-h-11 rounded-xl bg-blue-700 px-5 py-3 font-black text-white hover:bg-blue-800">Upload</button>
                  </form>
                ) : null}
              </section>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          {allRequiredAccepted && partner.mou_signed && partner.onboarding_completed ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-black text-green-800">Host Shop onboarding requirements are complete.</p><p className="mt-1 text-sm text-slate-700">Return to the operational dashboard to manage apprentices and OJT hours.</p></div>
              <Link href="/host-shop/dashboard" className="rounded-xl bg-green-700 px-5 py-3 text-center font-black text-white hover:bg-green-800">Open Host Shop dashboard</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-slate-700">Pending documents stay visible here until Elevate accepts or rejects them.</p>
              <Link href="/host-shop/dashboard" className="rounded-xl border border-slate-300 px-5 py-3 text-center font-bold hover:bg-slate-50">Return to dashboard</Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
