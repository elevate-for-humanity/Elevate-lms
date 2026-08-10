import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { requireAdminClient } from '@/lib/supabase/admin';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const REQUIRED_DOCUMENTS = [
  { type: 'business_license', label: 'Business / shop license' },
  { type: 'liability_insurance', label: 'Liability insurance COI' },
  { type: 'ein_w9', label: 'EIN verification / W-9' },
] as const;

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').slice(-120);
}

async function uploadPartnerDocument(formData: FormData) {
  'use server';

  const token = String(formData.get('token') ?? '').trim();
  const documentType = String(formData.get('documentType') ?? '').trim();
  const file = formData.get('file');
  if (!token || !REQUIRED_DOCUMENTS.some((item) => item.type === documentType)) {
    redirect(`/partner-upload/${encodeURIComponent(token)}?error=invalid_request`);
  }
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/partner-upload/${encodeURIComponent(token)}?error=missing_file`);
  }
  if (file.size > MAX_FILE_SIZE) {
    redirect(`/partner-upload/${encodeURIComponent(token)}?error=file_too_large`);
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    redirect(`/partner-upload/${encodeURIComponent(token)}?error=file_type`);
  }

  const db = await requireAdminClient();
  const { data: partner } = await db
    .from('partners')
    .select('id, state')
    .eq('onboarding_step', token)
    .maybeSingle();
  if (!partner) notFound();

  const fileName = safeFileName(file.name || `${documentType}.bin`);
  const storagePath = `${partner.id}/external-onboarding/${documentType}/${Date.now()}-${fileName}`;
  const { error: uploadError } = await db.storage
    .from('partner-documents')
    .upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error(`PARTNER_UPLOAD_FAILED:${uploadError.message}`);

  const label = REQUIRED_DOCUMENTS.find((item) => item.type === documentType)?.label ?? documentType;
  const { error: recordError } = await db.from('partner_documents').insert({
    partner_id: partner.id,
    document_type: documentType,
    state: partner.state || 'Indiana',
    display_name: label,
    file_name: file.name,
    file_url: storagePath,
    file_type: file.type,
    file_size: file.size,
    storage_bucket: 'partner-documents',
    status: 'pending',
  });
  if (recordError) {
    await db.storage.from('partner-documents').remove([storagePath]);
    throw new Error(`PARTNER_DOCUMENT_RECORD_FAILED:${recordError.message}`);
  }

  redirect(`/partner-upload/${encodeURIComponent(token)}?uploaded=${encodeURIComponent(documentType)}`);
}

export default async function PartnerUploadPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string; uploaded?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const supabase = await requireAdminClient();

  const { data: partner } = await supabase
    .from('partners')
    .select('id, name, contact_name, onboarding_step')
    .eq('onboarding_step', token)
    .maybeSingle();

  if (!partner) notFound();

  const { data: existingDocs } = await supabase
    .from('partner_documents')
    .select('document_type, status, file_name')
    .eq('partner_id', partner.id)
    .in('document_type', REQUIRED_DOCUMENTS.map((item) => item.type));

  const latestByType = new Map((existingDocs ?? []).map((doc) => [doc.document_type, doc]));
  const errorMessage = query.error === 'missing_file'
    ? 'Choose a file before uploading.'
    : query.error === 'file_too_large'
      ? 'Files must be 10 MB or smaller.'
      : query.error === 'file_type'
        ? 'Upload PDF, JPG, PNG, or WEBP files only.'
        : query.error
          ? 'The upload request could not be validated.'
          : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="bg-slate-950 px-6 py-5">
        <p className="text-lg font-black text-white">{PLATFORM_DEFAULTS.orgName}</p>
        <p className="text-sm text-slate-300">Secure partner document upload</p>
      </div>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <h1 className="text-2xl font-black text-slate-950">Upload your onboarding documents</h1>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {partner.contact_name ?? partner.name} — upload the required records below. Files are stored in Elevate's private partner-document storage and remain pending until staff review.
          </p>

          {errorMessage ? <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-900">{errorMessage}</div> : null}
          {query.uploaded ? <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">Document uploaded successfully and sent for review.</div> : null}

          <div className="mt-7 space-y-5">
            {REQUIRED_DOCUMENTS.map((requirement) => {
              const existing = latestByType.get(requirement.type);
              return (
                <section key={requirement.type} className="rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-black text-slate-950">{requirement.label}</h2>
                      {existing?.file_name ? <p className="mt-1 text-xs text-slate-600">Latest: {existing.file_name}</p> : null}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${existing?.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : existing ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'}`}>
                      {existing?.status === 'accepted' ? 'Accepted' : existing ? 'In review' : 'Required'}
                    </span>
                  </div>
                  {existing?.status !== 'accepted' ? (
                    <form action={uploadPartnerDocument} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                      <input type="hidden" name="token" value={token} />
                      <input type="hidden" name="documentType" value={requirement.type} />
                      <label className="flex-1 text-sm font-bold text-slate-800">
                        File
                        <input type="file" name="file" required accept=".pdf,image/jpeg,image/png,image/webp" className="mt-2 block w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm" />
                      </label>
                      <button type="submit" className="min-h-11 rounded-xl bg-blue-700 px-5 py-3 font-black text-white hover:bg-blue-800">Upload</button>
                    </form>
                  ) : null}
                </section>
              );
            })}
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-slate-600">
          Questions? <a href="mailto:elevate4humanityedu@gmail.com" className="font-bold underline">elevate4humanityedu@gmail.com</a>
        </p>
      </div>
    </main>
  );
}
