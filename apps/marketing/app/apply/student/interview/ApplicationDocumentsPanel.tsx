'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FileText, Loader2, RefreshCw, UploadCloud, XCircle } from 'lucide-react';

interface Requirement {
  id: string;
  document_type: string;
  name: string | null;
  description: string | null;
  instructions: string | null;
  is_required: boolean;
  required: boolean | null;
  accepted_formats: string[] | null;
  max_file_size: number | null;
  due_stage: string | null;
  program_id: string | null;
}

interface UploadedDocument {
  id: string;
  document_type: string;
  file_name: string;
  status: string;
  verification_status: string | null;
  verified: boolean | null;
  rejection_reason: string | null;
  created_at: string;
}

function isRequired(requirement: Requirement) {
  return requirement.required ?? requirement.is_required;
}

function statusLabel(document: UploadedDocument, locale: 'en' | 'es') {
  if (document.verified || document.verification_status === 'verified' || document.status === 'verified') {
    return locale === 'es' ? 'Aceptado' : 'Accepted';
  }
  if (document.status === 'rejected' || document.verification_status === 'rejected') {
    return locale === 'es' ? 'Necesita corrección' : 'Needs correction';
  }
  return locale === 'es' ? 'Pendiente de revisión' : 'Pending review';
}

export default function ApplicationDocumentsPanel({ locale = 'en' }: { locale?: 'en' | 'es' }) {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const text = useMemo(
    () =>
      locale === 'es'
        ? {
            eyebrow: 'Documentos',
            title: 'Cargue los documentos que correspondan a su solicitud.',
            body: 'PARIS puede organizar lo que carga, pero un documento permanece pendiente hasta que una persona autorizada lo revise.',
            required: 'Requerido',
            optional: 'Opcional',
            upload: 'Cargar documento',
            refresh: 'Actualizar requisitos',
            none: 'PARIS mostrará aquí los requisitos de documentos que correspondan a su programa.',
          }
        : {
            eyebrow: 'Documents',
            title: 'Upload the documents that apply to your application.',
            body: 'PARIS can organize what you upload, but every document remains pending until an authorized reviewer accepts it.',
            required: 'Required',
            optional: 'Optional',
            upload: 'Upload document',
            refresh: 'Refresh requirements',
            none: 'PARIS will show document requirements here when they apply to your program.',
          },
    [locale],
  );

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/paris/application-interview/documents', { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || 'Unable to load documents');
      setRequirements(data.requirements || []);
      setDocuments(data.documents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load documents');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(true), 15000);
    return () => window.clearInterval(id);
  }, [load]);

  async function upload(requirement: Requirement, file: File | null) {
    if (!file) return;
    setUploading(requirement.id);
    setError('');
    try {
      const body = new FormData();
      body.set('file', file);
      body.set('documentType', requirement.document_type);
      body.set('requirementId', requirement.id);
      const response = await fetch('/api/paris/application-interview/documents', {
        method: 'POST',
        body,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || 'Unable to upload document');
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload document');
    } finally {
      setUploading(null);
    }
  }

  const byType = new Map(documents.map((document) => [document.document_type, document]));

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="application-documents-title">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-red-700">{text.eyebrow}</p>
          <h2 id="application-documents-title" className="mt-2 text-xl font-black text-slate-950 sm:text-2xl">
            {text.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{text.body}</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> {text.refresh}
        </button>
      </div>

      {error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-sm font-bold text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : requirements.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {requirements.map((requirement) => {
            const document = byType.get(requirement.document_type);
            const accepted = document && (document.verified || document.status === 'verified' || document.verification_status === 'verified');
            const rejected = document && (document.status === 'rejected' || document.verification_status === 'rejected');
            return (
              <article key={requirement.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <FileText className="mt-0.5 h-5 w-5 flex-none text-slate-600" />
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-slate-950">
                        {requirement.name || requirement.document_type.replace(/_/g, ' ')}
                      </h3>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {isRequired(requirement) ? text.required : text.optional}
                      </p>
                    </div>
                  </div>
                  {document ? (
                    accepted ? <CheckCircle2 className="h-5 w-5 flex-none text-emerald-600" /> : rejected ? <XCircle className="h-5 w-5 flex-none text-red-600" /> : <Loader2 className="h-5 w-5 flex-none text-amber-600" />
                  ) : null}
                </div>
                {requirement.description ? <p className="mt-3 text-xs leading-5 text-slate-600">{requirement.description}</p> : null}
                {document ? (
                  <div className={`mt-3 rounded-lg border p-3 text-xs ${rejected ? 'border-red-200 bg-red-50 text-red-800' : accepted ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
                    <p className="font-black">{statusLabel(document, locale)}</p>
                    <p className="mt-1 break-all">{document.file_name}</p>
                    {document.rejection_reason ? <p className="mt-2">{document.rejection_reason}</p> : null}
                  </div>
                ) : null}
                {!accepted ? (
                  <label className="mt-4 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white hover:bg-slate-800">
                    {uploading === requirement.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                    {text.upload}
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      disabled={uploading === requirement.id}
                      onChange={(event) => void upload(requirement, event.target.files?.[0] || null)}
                      className="sr-only"
                    />
                  </label>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="mt-6 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">{text.none}</p>
      )}
    </section>
  );
}
