'use client';

import { createClient } from '@/lib/supabase/client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, AlertCircle } from 'lucide-react';

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
}

export function DocumentUploadForm({ requirements }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);

  // Load previously uploaded documents from DB
  useEffect(() => {
    async function loadUploadedDocs() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_documents')
        .select('id, document_type, file_name, status, uploaded_at')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (data) setUploadedDocs(data);
    }
    loadUploadedDocs();
  }, [supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Only PDF and image files are allowed');
        return;
      }

      setFile(selectedFile);
      setError('');
    }
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
      formData.append('documentType', documentType);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload document');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/student/documents');
      }, 2000);
    } catch (err: any) {
      setError('Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-green-50 border-2 border-green-600 rounded-lg">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-slate-400 flex-shrink-0">•</span>
          <div>
            <h2 className="text-2xl font-bold text-green-900">
              Document Uploaded!
            </h2>
            <p className="text-green-700">
              Your document has been submitted for review.
            </p>
          </div>
        </div>
        <p className="text-green-800">Redirecting to your documents page...</p>
      </div>
    );
  }

  const selectedRequirement = requirements.find(
    (r) => r.document_type === documentType
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-600 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-900">Error</h3>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-xl font-bold mb-4">Document Information</h3>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">
            Document Type *
          </label>
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
            <p className="text-sm text-brand-blue-800 mb-3">
              {selectedRequirement.instructions}
            </p>
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
          <label className="block text-sm font-semibold mb-2">
            Upload File *
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-brand-blue-500 transition">
            <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              required
              className="hidden"
              id="fileUpload"
            />
            <label htmlFor="fileUpload" className="cursor-pointer">
              <span className="text-brand-blue-600 font-semibold text-lg">
                Click to upload
              </span>
              <span className="text-black"> or drag and drop</span>
            </label>
            <p className="text-sm text-slate-500 mt-2">
              PDF, JPG, PNG or WEBP (max 10MB)
            </p>
            {file && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-semibold">
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
