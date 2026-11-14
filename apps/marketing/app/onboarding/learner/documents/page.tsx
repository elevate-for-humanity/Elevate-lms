'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, FileText, Upload, X } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import DocumentAIPrefillPanel from '@/components/documents/DocumentAIPrefillPanel';
import { createClient } from '@/lib/supabase/client';
import { formatSsn, isValidSsn, normalizeSsn } from '@/lib/ssn';

interface DocRequirement {
  type: string;
  title: string;
  description: string;
  required: boolean;
  acceptedFormats: string;
}

interface UploadedDocument {
  id?: string;
  document_type?: string | null;
  metadata?: { original_type?: string | null } | null;
}

const REQUIRED_DOCUMENTS: DocRequirement[] = [
  {
    type: 'government_id',
    title: 'Government-Issued Photo ID',
    description: "Driver's license, state ID card, or passport. The document must be current.",
    required: true,
    acceptedFormats: 'JPG, PNG, or PDF (max 10MB)',
  },
  {
    type: 'residency_proof',
    title: 'Proof of Indiana Residency',
    description: 'Recent utility bill, lease, bank statement, or government mail showing your Indiana address.',
    required: true,
    acceptedFormats: 'JPG, PNG, or PDF (max 10MB)',
  },
  {
    type: 'income_proof',
    title: 'Proof of Income (if applicable)',
    description: 'Pay stub, W-2, tax return, unemployment notice, or other requested funding evidence.',
    required: false,
    acceptedFormats: 'JPG, PNG, or PDF (max 10MB)',
  },
  {
    type: 'selective_service',
    title: 'Selective Service Registration (when applicable)',
    description: 'Upload confirmation when this documentation is required for your funding eligibility.',
    required: false,
    acceptedFormats: 'JPG, PNG, or PDF (max 10MB)',
  },
  {
    type: 'resume',
    title: 'Resume (Optional)',
    description: 'Upload your current resume, or career services can help you create one later.',
    required: false,
    acceptedFormats: 'PDF, DOC, or DOCX (max 10MB)',
  },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export default function DocumentsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadedTypes, setUploadedTypes] = useState<Set<string>>(() => new Set<string>());
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [prefill, setPrefill] = useState<{ documentId: string; documentType: string } | null>(null);
  const [ssnDisplay, setSsnDisplay] = useState('');
  const [ssnDigits, setSsnDigits] = useState('');
  const [ssnSaved, setSsnSaved] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function load() {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) {
        router.replace(`/login?redirect=${encodeURIComponent('/onboarding/learner/documents')}`);
        return;
      }
      if (cancelled) return;
      setUserId(data.user.id);

      try {
        const response = await fetch('/api/documents/upload', { cache: 'no-store' });
        const payload = (await response.json()) as { documents?: UploadedDocument[] };
        const types = new Set<string>();
        for (const document of payload.documents ?? []) {
          const type = document.metadata?.original_type ?? document.document_type;
          if (typeof type === 'string' && type) types.add(type);
        }
        if (!cancelled) setUploadedTypes(types);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const requiredDocuments = REQUIRED_DOCUMENTS.filter((document) => document.required);
  const requiredUploaded = requiredDocuments.filter((document) => uploadedTypes.has(document.type)).length;
  const requiredComplete = requiredUploaded === requiredDocuments.length;

  async function handleUpload(docType: string, file: File) {
    if (!userId) return;
    if (file.size > MAX_FILE_SIZE) {
      setError('The selected file is larger than 10 MB.');
      return;
    }
    if (!ACCEPTED_TYPES.has(file.type)) {
      setError('Upload a PDF, JPG, PNG, DOC, or DOCX file.');
      return;
    }

    setUploading(docType);
    setError('');
    setPrefill(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', docType);
      const response = await fetch('/api/documents/upload', { method: 'POST', body: formData });
      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
        error?: { message?: string };
        document?: { id?: string };
      };

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? payload.message ?? 'Upload failed. Please try again.');
        return;
      }

      setUploadedTypes((current) => {
        const next = new Set<string>(current);
        next.add(docType);
        return next;
      });
      if (payload.document?.id) {
        setPrefill({ documentId: payload.document.id, documentType: docType });
      }
    } catch {
      setError('Upload failed. Please check your connection and try again.');
    } finally {
      setUploading(null);
    }
  }

  async function saveIdentityLastFour() {
    if (!isValidSsn(ssnDigits)) {
      setError('Enter a valid 9-digit SSN.');
      return;
    }

    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setError('Please sign in again.');
      return;
    }

    const { error: saveError } = await supabase.from('secure_identity').upsert(
      {
        user_id: data.user.id,
        ssn_last4: ssnDigits.slice(-4),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

    if (saveError) {
      setError('Identity information could not be saved. Please contact support.');
      return;
    }
    setError('');
    setSsnDisplay(`***-**-${ssnDigits.slice(-4)}`);
    setSsnSaved(true);
  }

  async function continueOnboarding() {
    await fetch('/api/onboarding/complete-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 'documents' }),
    });
    router.push('/onboarding/learner');
  }

  if (loading) {
    return <main className="flex min-h-[60vh] items-center justify-center bg-white"><div className="h-9 w-9 animate-spin rounded-full border-4 border-brand-blue-600 border-t-transparent" /></main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <Breadcrumbs items={[{ label: 'Onboarding', href: '/onboarding/learner' }, { label: 'Documents' }]} />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link href="/onboarding/learner" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-brand-blue-700">
          <ArrowLeft className="h-4 w-4" /> Back to onboarding
        </Link>
        <h1 className="text-3xl font-black">Upload required documents</h1>
        <p className="mt-2 leading-7 text-slate-700">Submit the records needed for enrollment and funding review. Required files must be uploaded before this step is complete.</p>

        <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
            <div className="text-sm leading-6 text-blue-950">
              <p className="font-black">Protected information</p>
              <p>Documents are stored through the secured application workflow and are available only to authorized staff.</p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-sm font-bold">
            <span>Required documents</span>
            <span>{requiredUploaded} of {requiredDocuments.length}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-brand-blue-600 transition-all" style={{ width: `${requiredDocuments.length ? (requiredUploaded / requiredDocuments.length) * 100 : 100}%` }} />
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-black">Identity verification</h2>
          <p className="mt-1 text-sm text-slate-600">Enter your SSN for the protected identity workflow. Only the masked last four digits are shown after saving.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm font-bold">
              Social Security Number
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={11}
                value={ssnDisplay}
                disabled={ssnSaved}
                onChange={(event) => {
                  const digits = normalizeSsn(event.target.value);
                  setSsnDigits(digits);
                  setSsnDisplay(formatSsn(digits));
                }}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono disabled:bg-slate-100"
                placeholder="123-45-6789"
              />
            </label>
            <button type="button" disabled={ssnSaved} onClick={() => void saveIdentityLastFour()} className="min-h-12 rounded-xl bg-brand-blue-700 px-6 font-black text-white disabled:opacity-50">
              {ssnSaved ? 'Saved' : 'Save'}
            </button>
          </div>
        </section>

        {prefill ? <div className="mt-6"><DocumentAIPrefillPanel documentId={prefill.documentId} documentType={prefill.documentType} onConfirmed={() => setPrefill(null)} onDismiss={() => setPrefill(null)} /></div> : null}

        {error ? (
          <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError('')} aria-label="Dismiss error"><X className="h-4 w-4" /></button>
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          {REQUIRED_DOCUMENTS.map((document) => {
            const uploaded = uploadedTypes.has(document.type);
            const busy = uploading === document.type;
            return (
              <section key={document.type} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${uploaded ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {uploaded ? <CheckCircle2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-black">{document.title}</h2>
                      {document.required ? <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">Required</span> : null}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{document.description}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{document.acceptedFormats}</p>

                    {!uploaded ? (
                      <div className="mt-4">
                        <input
                          ref={(element) => { fileInputRefs.current[document.type] = element; }}
                          type="file"
                          className="hidden"
                          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void handleUpload(document.type, file);
                            event.target.value = '';
                          }}
                        />
                        <button type="button" disabled={busy} onClick={() => fileInputRefs.current[document.type]?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white disabled:opacity-50">
                          <Upload className="h-4 w-4" /> {busy ? 'Uploading…' : 'Choose file'}
                        </button>
                      </div>
                    ) : <p className="mt-4 text-sm font-black text-green-700">Uploaded</p>}
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {requiredComplete ? (
          <section className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div>
              <h2 className="font-black text-green-950">Required documents uploaded</h2>
              <p className="mt-1 text-sm text-green-900">Files remain subject to staff review.</p>
            </div>
            <button type="button" onClick={() => void continueOnboarding()} className="mt-4 min-h-11 rounded-xl bg-green-700 px-5 font-black text-white sm:mt-0">Continue onboarding</button>
          </section>
        ) : null}
      </div>
    </main>
  );
}
