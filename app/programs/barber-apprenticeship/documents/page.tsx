'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, AlertCircle, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface UploadedFile {
  name: string;
  type: string;
  status: 'uploading' | 'complete' | 'error';
  url?: string;
}

export default function BarberDocumentsPage() {
  const router = useRouter();
  const [governmentId, setGovernmentId] = useState<UploadedFile | null>(null);
  const [additionalDocs, setAdditionalDocs] = useState<UploadedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);

  // Get enrollment ID on mount
  useEffect(() => {
    async function getEnrollment() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: enrollment } = await supabase
        .from('program_enrollments')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (enrollment) {
        setEnrollmentId(enrollment.id);
      }
    }
    getEnrollment();
  }, []);

  const requiredDocuments = [
    {
      id: 'government-id',
      name: 'Government-Issued ID',
      description: 'Driver\'s license, state ID, or passport',
      required: true,
    },
  ];

  const optionalDocuments = [
    {
      id: 'high-school',
      name: 'High School Diploma or GED',
      description: 'If available',
      required: false,
    },
    {
      id: 'background-check',
      name: 'Background Check Authorization',
      description: 'Will be provided if not uploaded',
      required: false,
    },
  ];

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: 'government-id' | 'additional'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadedFile: UploadedFile = {
      name: file.name,
      type: docType,
      status: 'uploading',
    };

    if (docType === 'government-id') {
      setGovernmentId(uploadedFile);
    } else {
      setAdditionalDocs([...additionalDocs, uploadedFile]);
    }

    try {
      // Real upload to Supabase Storage
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', docType);
      if (enrollmentId) {
        formData.append('enrollmentId', enrollmentId);
      }

      const response = await fetch('/api/enrollment/upload-document', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        if (docType === 'government-id') {
          setGovernmentId({ ...uploadedFile, status: 'complete', url: result.document?.file_url });
        } else {
          setAdditionalDocs((prev) =>
            prev.map((doc) =>
              doc.name === file.name ? { ...doc, status: 'complete', url: result.document?.file_url } : doc
            )
          );
        }
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      if (docType === 'government-id') {
        setGovernmentId({ ...uploadedFile, status: 'error' });
      } else {
        setAdditionalDocs((prev) =>
          prev.map((doc) =>
            doc.name === file.name ? { ...doc, status: 'error' } : doc
          )
        );
      }
    }
  };

  const handleSubmit = async () => {
    if (!governmentId || governmentId.status !== 'complete') return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch('/api/enrollment/submit-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program: 'barber-apprenticeship' }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data.error || 'Submission failed. Please try again or call (317) 314-3757.');
        setSubmitting(false);
        return;
      }

      router.push('/apprentice');
    } catch {
      setSubmitError('Unable to submit. Please try again or call (317) 314-3757.');
      setSubmitting(false);
    }
  };

  const canSubmit = governmentId?.status === 'complete';

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white py-8 border-t">
        <div className="max-w-2xl mx-auto px-6">
          <h1 className="text-3xl font-black mb-2">Required Documents</h1>
          <p className="text-black">
            Upload your documents to complete enrollment and access your program.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Required Documents */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="bg-white px-6 py-3">
            <h2 className="text-lg font-bold text-slate-900">Required</h2>
          </div>
          <div className="p-6">
            {requiredDocuments.map((doc) => (
              <div key={doc.id} className="mb-4 last:mb-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900">{doc.name}</h3>
                    <p className="text-sm text-black">{doc.description}</p>
                  </div>
                  {governmentId?.status === 'complete' && (
                    <span className="text-black flex-shrink-0">•</span>
                  )}
                </div>

                {governmentId ? (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <FileText className="w-5 h-5 text-black" />
                    <span className="flex-1 text-sm text-slate-700 truncate">
                      {governmentId.name}
                    </span>
                    {governmentId.status === 'uploading' && (
                      <span className="text-sm text-brand-blue-600">Uploading...</span>
                    )}
                    {governmentId.status === 'error' && (
                      <span className="text-sm text-red-600">Upload failed. Please try again or call (317) 314-3757.</span>
                    )}
                    {governmentId.status === 'complete' && (
                      <button
                        onClick={() => setGovernmentId(null)}
                        className="text-black hover:text-brand-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-brand-blue-500 hover:bg-brand-blue-50 transition">
                    <Upload className="w-5 h-5 text-black" />
                    <span className="text-black">Click to upload</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, 'government-id')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Optional Documents */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="bg-white px-6 py-3">
            <h2 className="text-lg font-bold text-slate-900">Optional (Can Submit Later)</h2>
          </div>
          <div className="p-6">
            {optionalDocuments.map((doc) => (
              <div key={doc.id} className="mb-4 last:mb-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-slate-900">{doc.name}</h3>
                    <p className="text-sm text-black">{doc.description}</p>
                  </div>
                </div>
                <label className="flex items-center justify-center gap-2 p-3 border border-slate-200 rounded-lg cursor-pointer hover:border-slate-300 hover:bg-white transition">
                  <Upload className="w-4 h-4 text-black" />
                  <span className="text-sm text-black">Upload (optional)</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(e, 'additional')}
                    className="hidden"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        {submitError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 mb-3">
            {submitError}
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="w-full py-4 bg-brand-blue-600 text-white font-bold text-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-blue-700 transition"
        >
          {submitting ? 'Submitting...' : 'Submit Documents'}
        </button>

        {!canSubmit && (
          <p className="text-center text-brand-red-600 text-sm mt-4 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Please upload your government-issued ID to continue.
          </p>
        )}

        <p className="text-center text-black text-sm mt-4">
          Your documents are encrypted and stored securely.
        </p>
      </div>
    </div>
  );
}
