'use client';

import Link from 'next/link';
import { CheckCircle2, FileText, Upload, XCircle } from 'lucide-react';

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
  uploads: PartnerDocument[];
};

function statusClass(status: string) {
  if (status === 'accepted') return 'bg-green-100 text-green-800';
  if (status === 'rejected' || status === 'expired') return 'bg-red-100 text-red-800';
  if (status === 'pending') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-100 text-slate-700';
}

function fileLink(id: string) {
  return `/api/host-shop/documents/${encodeURIComponent(id)}/download?open=1`;
}

export default function HostShopDocumentsClient({ requirements, uploads }: Props) {
  const shown = new Set(requirements.map((item) => item.document?.id));
  const otherFiles = uploads.filter((file) => !shown.has(file.id));
  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {requirements.map((requirement) => {
          const document = requirement.document || null;
          const status = String(requirement.status || document?.status || 'missing').toLowerCase();

          const needsAction = requirement.is_required !== false && status !== 'accepted' && status !== 'pending';

          return (
            <article
              key={requirement.document_type}
              className={`rounded-2xl border p-5 shadow-sm ${
                needsAction ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${needsAction ? 'bg-red-100' : 'bg-slate-100'}`}
                  >
                    {status === 'accepted' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : status === 'rejected' || status === 'expired' ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <FileText
                        className={`h-5 w-5 ${needsAction ? 'text-red-700' : 'text-slate-700'}`}
                      />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-slate-950">
                        {requirement.document_name ||
                          requirement.document_type.replaceAll('_', ' ')}
                      </h2>
                      {requirement.is_required && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                          Required
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusClass(status)}`}
                      >
                        {requirement.is_required === false && status === 'missing' ? 'If applicable' : status}
                      </span>
                    </div>
                    {requirement.description && (
                      <p className="mt-1 text-sm text-slate-600">{requirement.description}</p>
                    )}
                    {document?.file_name && (
                      <p className="mt-2 text-xs text-slate-500">{document.file_name}</p>
                    )}
                    {document?.rejection_reason && (
                      <p className="mt-2 text-sm font-medium text-red-700">
                        Review note: {document.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {document?.id && (
                    <a href={fileLink(document.id)} target="_blank" rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800">
                      View file
                    </a>
                  )}
                  <Link
                    href={`/host-shop/onboarding/documents?document=${encodeURIComponent(requirement.document_type)}#upload-${encodeURIComponent(requirement.document_type)}`}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-blue-800"
                  >
                    <Upload className="h-4 w-4" />
                    {document ? 'Replace' : 'Upload'}
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {otherFiles.length > 0 && (
        <details className="rounded-2xl border bg-white p-5">
          <summary className="min-h-11 cursor-pointer font-bold">Other paperwork and earlier uploads ({otherFiles.length})</summary>
          <ul className="divide-y">
            {otherFiles.map((file) => <li key={file.id} className="py-2">
              <a href={fileLink(file.id)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center break-all font-semibold text-blue-800 underline">
                {file.file_name || file.display_name || 'Open file'}
              </a>
            </li>)}
          </ul>
        </details>
      )}
      {requirements.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          No document requirements are configured for this host site yet.
        </div>
      )}
    </div>
  );
}
