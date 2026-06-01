'use client';

import { createClient } from '@/lib/supabase/client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, AlertCircle } from 'lucide-react';
import DocumentAIPrefillPanel from '@/components/documents/DocumentAIPrefillPanel';

interface DocumentRequirement {
  id: string;
  document_type: string;
  description: string;
  instructions: string;
  accepted_formats: string[];
  max_file_size: number;
}

interface Props {
  requirements: DocumentRequirement[];
  /** API endpoint to POST the upload to. Defaults to /api/documents/upload */
  apiEndpoint?: string;
  /** Where to redirect after a successful upload. Defaults to role-based logic. */
  successRedirect?: string;
}

export function DocumentUploadForm({ requirements, apiEndpoint, successRedirect }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [prefillDocumentId, setPrefillDocumentId] = useState<string | null>(null);
  const [prefillDone, setPrefillDone] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState('');

  const isProgramHolderUpload =
    apiEndpoint?.includes('/api/program-holder/documents/upload') ?? false;

  // Load previously uploaded documents from DB
  useEffect(() => {
    async function loadUploadedDocs() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const table = isProgramHolderUpload ? 'program_holder_documents' : 'documents';
      const { data } = await supabase
        .from(table)
        .select('id, document_type, file_name, status, created_at, approved')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setUploadedDocs(
          data.map((row: { status?: string; approved?: boolean | null }) => ({
            ...row,
            status:
              row.status ??
              (row.approved === true
                ? 'approved'
                : row.approved === false
                  ? 'rejected'
                  : 'pending'),
          })),
        );
      }
    }
    loadUploadedDocs();
  }, [supabase, isProgramHolderUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  // Redirect helper — called after prefill is done or skipped
  const doRedirect = (dest: string) => {
    setTimeout(() => router.push(dest), 800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!file || !documentType) {
        setError('Please select a document type and file');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);
      formData.append('documentType', documentType); // legacy compat

      const endpoint = apiEndpoint ?? '/api/documents/upload';
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload document');
      }

      setSuccess(true);

      // Determine redirect destination
      let dest = successRedirect ?? '';
      if (!dest) {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        dest = '/learner/dashboard';
        if (currentUser) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentUser.id)
            .single();
          if (prof?.role === 'program_holder') {
            dest = '/program-holder/documents';
            fetch('/api/program-holder/onboarding-complete', { method: 'POST' }).catch(() => {});
          } else if (prof?.role === 'employer') {
            dest = '/employer/documents';
          } else if (prof?.role === 'student' || prof?.role === 'learner') {
            dest = '/onboarding/learner/documents';
          }
        }
      }

      // If the upload returned a document ID, show the AI prefill panel before redirecting
      if (data.document?.id) {
        setPrefillDocumentId(data.document.id);
        setPendingRedirect(dest);
      } else {
        setTimeout(() => router.push(dest), 1500);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="p-8 bg-brand-green-50 border-2 border-brand-green-600 rounded-lg">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-slate-500 flex-shrink-0">•</span>
            <div>
              <h2 className="text-2xl font-bold text-brand-green-900">Document Uploaded!</h2>
              <p className="text-brand-green-700">Your document has been submitted for review.</p>
            </div>
          </div>
          {!prefillDocumentId && (
            <p className="text-brand-green-800">Redirecting to your documents page...</p>
          )}
        </div>

        {prefillDocumentId && !prefillDone && (
          <DocumentAIPrefillPanel
            documentId={prefillDocumentId}
            documentType={documentType}
            onConfirmed={() => {
              setPrefillDone(true);
              doRedirect(pendingRedirect);
            }}
            onDismiss={() => {
              setPrefillDone(true);
              doRedirect(pendingRedirect);
            }}
          />
        )}

        {prefillDone && (
          <p className="text-sm text-slate-600 text-center">Redirecting…</p>
        )}
      </div>
    );
  }

  const selectedRequirement = requirements.find((r) => r.document_type === documentType);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-brand-red-50 border-2 border-brand-red-600 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-brand-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-brand-red-900">Error</h3>
            <p className="text-brand-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-xl font-bold mb-4">Document Information</h3>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">Document Type *</label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
          >
            <option value="">Select document type...</option>
            {requirements.map((req) => (
              <option key={req.id} value={req.document_type}>
                {req.description}
              </option>
            ))}
          </select>
        </div>

        {selectedRequirement && (
          <div className="mb-6 p-4 bg-brand-blue-50 border border-brand-blue-200 rounded-lg">
            <h4 className="font-semibold text-brand-blue-900 mb-2">Instructions</h4>
            <p className="text-sm text-brand-blue-800 mb-3">{selectedRequirement.instructions}</p>
            <div className="text-xs text-brand-blue-700">
              <strong>Accepted formats:</strong>{' '}
              {selectedRequirement.accepted_formats.join(', ').toUpperCase()}
              <br />
              <strong>Max file size:</strong>{' '}
              {(selectedRequirement.max_file_size / 1024 / 1024).toFixed(0)}MB
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-2">Upload File *</label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-brand-blue-500 transition">
            <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <input
              type="file"
              onChange={handleFileChange}
              required
              className="hidden"
              id="fileUpload"
            />
            <label htmlFor="fileUpload" className="cursor-pointer">
              <span className="text-brand-blue-600 font-semibold text-lg">Click to upload</span>
              <span className="text-black"> or drag and drop</span>
            </label>
            <p className="text-sm text-slate-500 mt-2">Any file type accepted</p>
            {file && (
              <div className="mt-4 p-3 bg-brand-green-50 border border-brand-green-200 rounded-lg">
                <p className="text-sm text-brand-green-800 font-semibold">
                  • {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-8 py-3 border-2 border-slate-300 text-black font-semibold rounded-lg hover:bg-slate-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !file || !documentType}
          className="px-8 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Uploading...' : 'Upload Document'}
        </button>
      </div>
    </form>
  );
}
