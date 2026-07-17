'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Upload, FileText, AlertCircle, X } from 'lucide-react';
import DocumentAIPrefillPanel from '@/components/documents/DocumentAIPrefillPanel';
import {
  canSubmitDocuments,
  getEnrollmentRoute,
  hasLmsAccess,
  normalizeEnrollmentState,
} from '@/lib/enrollment/enrollment-flow';

interface RequiredDocument {
  id: string;
  name: string;
  description: string;
  uploaded: boolean;
  file_url?: string;
}

const DEFAULT_REQUIRED_DOCS: Omit<RequiredDocument, 'uploaded' | 'file_url'>[] = [
  {
    id: 'photo_id',
    name: 'Government-issued Photo ID',
    description: "Driver's license, state ID, or passport",
  },
  {
    id: 'proof_of_residence',
    name: 'Proof of Residence',
    description: 'Utility bill, lease agreement, or bank statement (within 60 days)',
  },
];

export default function DocumentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<RequiredDocument[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<{ documentId: string; documentType: string } | null>(null);

  useEffect(() => {
    async function checkEnrollment() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
        return;
      }
      setUserId(user.id);

      const { data, error } = await supabase
        .from('program_enrollments')
        .select('id, enrollment_state')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        router.push('/programs');
        return;
      }

      const state = normalizeEnrollmentState(data.enrollment_state) ?? data.enrollment_state;

      if (hasLmsAccess(state)) {
        router.push('/learner/dashboard');
        return;
      }

      const targetRoute = getEnrollmentRoute(state);
      if (targetRoute !== '/enrollment/documents' && targetRoute !== '/programs') {
        router.push(targetRoute);
        return;
      }

      if (!canSubmitDocuments(state)) {
        router.push('/programs');
        return;
      }

      setEnrollmentId(data.id);

      // Initialize documents (in real app, fetch from DB)
      setDocuments(DEFAULT_REQUIRED_DOCS.map((doc) => ({ ...doc, uploaded: false })));
      setLoading(false);
    }

    checkEnrollment();
  }, [router]);

  async function handleFileUpload(docId: string, file: File) {
    if (!enrollmentId || !userId) return;

    setUploading(docId);
    setError(null);

    try {
      // Upload via API route (bypasses storage RLS)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', docId);
      formData.append('metadata', JSON.stringify({ enrollmentId, category: 'enrollment' }));

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Upload failed');

      // Update local state
      setDocuments((docs) =>
        docs.map((doc) =>
          doc.id === docId
            ? { ...doc, uploaded: true, file_url: result.document?.file_url || '' }
            : doc,
        ),
      );

      // Trigger AI prefill if we got a document ID back
      if (result.document?.id) {
        setPrefill({ documentId: result.document.id, documentType: docId });
      }
    } catch (err: any) {
      setError('An error occurred');
    } finally {
      setUploading(null);
    }
  }

  async function handleSubmit() {
    if (!enrollmentId) return;

    const allUploaded = documents.every((doc) => doc.uploaded);
    if (!allUploaded) {
      setError('Please upload all required documents');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/enrollment/documents/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollment_id: enrollmentId,
          documents: documents.map((d) => ({ id: d.id, file_url: d.file_url })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit documents');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/learner/dashboard');
      }, 2000);
    } catch (err: any) {
      setError('An error occurred');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue-600"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-green-100 rounded-full mb-4">
            <span className="text-slate-500 flex-shrink-0">•</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Documents Received</h2>
          <p className="text-slate-700">Your enrollment is being activated.</p>
        </div>
      </div>
    );
  }

  const allUploaded = documents.every((doc) => doc.uploaded);

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Upload Required Documents</h1>
          <p className="text-slate-700 mt-2">
            These are required to activate your enrollment and unlock course access.
          </p>
        </div>

        {/* Document List */}
        <div className="space-y-4 mb-8">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      doc.uploaded ? 'bg-brand-green-100' : 'bg-white'
                    }`}
                  >
                    {doc.uploaded ? (
                      <span className="text-slate-500 flex-shrink-0">•</span>
                    ) : (
                      <FileText className="w-5 h-5 text-slate-700" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{doc.name}</h3>
                    <p className="text-sm text-slate-700">{doc.description}</p>
                  </div>
                </div>

                {doc.uploaded ? (
                  <button
                    onClick={() =>
                      setDocuments((docs) =>
                        docs.map((d) =>
                          d.id === doc.id ? { ...d, uploaded: false, file_url: undefined } : d,
                        ),
                      )
                    }
                    className="text-slate-700 hover:text-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                ) : (
                  <label
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                      uploading === doc.id
                        ? 'bg-white text-slate-700'
                        : 'bg-brand-blue-50 text-brand-blue-600 hover:bg-brand-blue-100'
                    }`}
                  >
                    {uploading === doc.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-blue-600"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      disabled={uploading !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(doc.id, file);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* AI prefill panel */}
        {prefill && (
          <DocumentAIPrefillPanel
            documentId={prefill.documentId}
            documentType={prefill.documentType}
            onConfirmed={() => setPrefill(null)}
            onDismiss={() => setPrefill(null)}
          />
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 bg-brand-red-50 border border-brand-red-200 text-brand-red-700 px-4 py-3 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!allUploaded || submitting}
          className={`w-full py-4 px-6 rounded-lg font-semibold transition-colors ${
            allUploaded && !submitting
              ? 'bg-brand-blue-600 hover:bg-brand-blue-700 text-white'
              : 'bg-slate-200 text-slate-700 cursor-not-allowed'
          }`}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Submitting...
            </span>
          ) : (
            'Submit Documents'
          )}
        </button>
      </div>
    </div>
  );
}
