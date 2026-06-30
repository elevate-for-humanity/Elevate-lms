'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Upload, FileText, AlertCircle, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getBeautyProgram, colorClasses } from '@/lib/programs/beauty-programs';
import DocumentAIPrefillPanel from '@/components/documents/DocumentAIPrefillPanel';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

interface UploadedFile {
  name: string;
  type: string;
  status: 'uploading' | 'complete' | 'error';
  url?: string;
}

export default function BeautyDocumentsPage() {
  const params = useParams<{ program: string }>();
  const router = useRouter();
  const cfg = getBeautyProgram(params.program);
  const c = colorClasses(cfg?.color ?? 'blue');

  const [governmentId, setGovernmentId] = useState<UploadedFile | null>(null);
  const [additionalDocs, setAdditionalDocs] = useState<UploadedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<{ documentId: string; documentType: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('program_enrollments')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
        .then(({ data }) => { if (data) setEnrollmentId(data.id); });
    });
  }, []);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: 'government-id' | 'additional',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadedFile: UploadedFile = { name: file.name, type: docType, status: 'uploading' };
    if (docType === 'government-id') setGovernmentId(uploadedFile);
    else setAdditionalDocs(prev => [...prev, uploadedFile]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', docType);
      if (enrollmentId) formData.append('enrollmentId', enrollmentId);

      const res = await fetch('/api/enrollment/upload-document', { method: 'POST', body: formData });
      const result = await res.json();

      if (res.ok && result.success) {
        const done = { ...uploadedFile, status: 'complete' as const, url: result.document?.file_url };
        if (docType === 'government-id') {
          setGovernmentId(done);
          if (result.document?.id) {
            setPrefill({ documentId: result.document.id, documentType: 'government_id' });
          }
        } else {
          setAdditionalDocs(prev => prev.map(d => d.name === file.name ? done : d));
        }
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch {
      const err = { ...uploadedFile, status: 'error' as const };
      if (docType === 'government-id') setGovernmentId(err);
      else setAdditionalDocs(prev => prev.map(d => d.name === file.name ? err : d));
    }
  };

  const handleSubmit = async () => {
    if (!cfg || !governmentId || governmentId.status !== 'complete') return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/enrollment/submit-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program: cfg.slug }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || `Submission failed. Please try again or call ${PLATFORM_DEFAULTS.supportPhone}.`);
        setSubmitting(false);
        return;
      }
      router.push(`/programs/${cfg.slug}/payment-setup`);
    } catch {
      setSubmitError('Unable to submit. Please try again or call ${PLATFORM_DEFAULTS.supportPhone}.');
      setSubmitting(false);
    }
  };

  if (!cfg) {
    router.replace(`/programs/${params.program}`);
    return null;
  }

  const canSubmit = governmentId?.status === 'complete';

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white py-8 border-t">
        <div className="max-w-2xl mx-auto px-6">
          <p className={`text-sm font-semibold ${c.text} mb-1`}>{cfg.title}</p>
          <h1 className="text-3xl font-black mb-2">Required Documents</h1>
          <p className="text-slate-600">
            Upload your documents to complete enrollment and access your program.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Required */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className={`${c.bg} px-6 py-3`}>
            <h2 className="text-sm font-bold text-white">Required</h2>
          </div>
          <div className="p-6">
            <div className="mb-2">
              <h3 className="font-bold text-slate-900">Government-Issued ID</h3>
              <p className="text-sm text-slate-500">Driver&apos;s license, state ID, or passport</p>
            </div>
            {governmentId ? (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <FileText className="w-5 h-5 text-slate-500 flex-shrink-0" />
                <span className="flex-1 text-sm text-slate-700 truncate">{governmentId.name}</span>
                {governmentId.status === 'uploading' && (
                  <Loader2 className={`w-4 h-4 animate-spin ${c.spinner}`} />
                )}
                {governmentId.status === 'error' && (
                  <span className="text-xs text-red-600">Upload failed — try again</span>
                )}
                {governmentId.status === 'complete' && (
                  <button onClick={() => setGovernmentId(null)} className="text-slate-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <label className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:${c.border} transition`}>
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-slate-500 text-sm">Click to upload</span>
                <input type="file" accept="image/*,.pdf" onChange={e => handleFileUpload(e, 'government-id')} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Optional */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-700">Optional — can submit later</h2>
          </div>
          <div className="p-6 space-y-4">
            {[
              { id: 'high-school', name: 'High School Diploma or GED', desc: 'If available' },
              { id: 'background-check', name: 'Background Check Authorization', desc: 'Will be provided if not uploaded' },
            ].map(doc => (
              <div key={doc.id}>
                <h3 className="font-medium text-slate-900 text-sm">{doc.name}</h3>
                <p className="text-xs text-slate-500 mb-2">{doc.desc}</p>
                <label className="flex items-center justify-center gap-2 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500">Upload (optional)</span>
                  <input type="file" accept="image/*,.pdf" onChange={e => handleFileUpload(e, 'additional')} className="hidden" />
                </label>
              </div>
            ))}
          </div>
        </div>

        {prefill && (
          <DocumentAIPrefillPanel
            documentId={prefill.documentId}
            documentType={prefill.documentType}
            onConfirmed={() => setPrefill(null)}
            onDismiss={() => setPrefill(null)}
          />
        )}

        {submitError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 mb-4">
            {submitError}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className={`w-full py-4 ${c.bg} ${c.hover} text-white font-bold text-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2`}
        >
          {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : 'Submit Documents'}
        </button>

        {!canSubmit && (
          <p className="text-center text-red-600 text-sm mt-4 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Upload your government-issued ID to continue.
          </p>
        )}

        <p className="text-center text-slate-400 text-xs mt-4">
          Documents are encrypted and stored securely.
        </p>
      </div>
    </div>
  );
}
