'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, FileText, Loader2, Upload, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type Requirement = {
  document_type: string;
  document_name?: string | null;
  description?: string | null;
  is_required?: boolean | null;
  program_id?: string | null;
  state?: string | null;
  status?: string | null;
  uploaded?: boolean;
  document?: PartnerDocument | null;
};

type PartnerDocument = {
  id: string;
  document_type?: string | null;
  display_name?: string | null;
  file_name?: string | null;
  file_url?: string | null;
  storage_bucket?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  status?: string | null;
  rejection_reason?: string | null;
  expiration_date?: string | null;
  uploaded_at?: string | null;
};

type Props = {
  partnerId: string;
  programType: string;
  partnerState: string;
  requirements: Requirement[];
};

function statusClass(status: string) {
  if (status === 'accepted') return 'bg-green-100 text-green-800';
  if (status === 'rejected' || status === 'expired') return 'bg-red-100 text-red-800';
  if (status === 'pending') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-100 text-slate-700';
}

function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
}

export default function HostShopDocumentsClient({
  partnerId,
  programType,
  partnerState,
  requirements,
}: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [workingType, setWorkingType] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(requirement: Requirement, file: File) {
    setMessage(null);
    setError(null);

    if (!ALLOWED_TYPES.has(file.type)) {
      setError('Upload a PDF, JPG, or PNG file.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Files must be 10 MB or smaller.');
      return;
    }

    setWorkingType(requirement.document_type);
    let storagePath: string | null = null;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Your session expired. Sign in again.');

      storagePath = `${user.id}/${partnerId}/${Date.now()}-${safeName(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from('partner-documents')
        .upload(storagePath, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('partner_documents').insert({
        partner_id: partnerId,
        document_type: requirement.document_type,
        display_name: requirement.document_name || file.name,
        file_name: file.name,
        file_url: storagePath,
        storage_bucket: 'partner-documents',
        file_type: file.type,
        file_size: file.size,
        program_id: requirement.program_id || programType,
        state: requirement.state || partnerState,
        status: 'pending',
      });

      if (insertError) {
        await supabase.storage.from('partner-documents').remove([storagePath]);
        throw insertError;
      }

      setMessage(`${requirement.document_name || 'Document'} uploaded for review.`);
      router.refresh();
    } catch (uploadFailure) {
      setError(uploadFailure instanceof Error ? uploadFailure.message : 'Document upload failed.');
    } finally {
      setWorkingType(null);
    }
  }

  async function viewDocument(document: PartnerDocument) {
    setMessage(null);
    setError(null);
    setWorkingType(document.document_type || document.id);
    try {
      const response = await fetch(`/api/host-shop/documents/${document.id}/download`, {
        method: 'GET',
        cache: 'no-store',
      });
      const body = await response.json();
      if (!response.ok || !body?.url) throw new Error(body?.error || 'Unable to open document.');
      window.open(body.url, '_blank', 'noopener,noreferrer');
    } catch (viewFailure) {
      setError(viewFailure instanceof Error ? viewFailure.message : 'Unable to open document.');
    } finally {
      setWorkingType(null);
    }
  }

  return (
    <div className="space-y-6">
      {(message || error) && (
        <div
          className={`rounded-xl border p-4 text-sm font-medium ${
            error ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'
          }`}
          role="status"
        >
          {error || message}
        </div>
      )}

      <div className="grid gap-4">
        {requirements.map((requirement) => {
          const document = requirement.document || null;
          const status = String(document?.status || requirement.status || 'missing').toLowerCase();
          const working = workingType === requirement.document_type;

          return (
            <article key={requirement.document_type} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                    {status === 'accepted' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : status === 'rejected' || status === 'expired' ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <FileText className="h-5 w-5 text-slate-700" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-slate-950">
                        {requirement.document_name || requirement.document_type.replaceAll('_', ' ')}
                      </h2>
                      {requirement.is_required && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">Required</span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusClass(status)}`}>
                        {status}
                      </span>
                    </div>
                    {requirement.description && <p className="mt-1 text-sm text-slate-600">{requirement.description}</p>}
                    {document?.file_name && <p className="mt-2 text-xs text-slate-500">{document.file_name}</p>}
                    {document?.rejection_reason && (
                      <p className="mt-2 text-sm font-medium text-red-700">Review note: {document.rejection_reason}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {document?.id && (
                    <button
                      type="button"
                      disabled={working}
                      onClick={() => void viewDocument(document)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                    >
                      View
                    </button>
                  )}
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-blue-800">
                    {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {document ? 'Replace' : 'Upload'}
                    <input
                      className="sr-only"
                      type="file"
                      accept="application/pdf,image/jpeg,image/png"
                      disabled={working}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.currentTarget.value = '';
                        if (file) void upload(requirement, file);
                      }}
                    />
                  </label>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {requirements.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          No document requirements are configured for this host site yet.
        </div>
      )}
    </div>
  );
}
