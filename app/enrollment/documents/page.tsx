
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Upload, FileText, AlertCircle, X } from 'lucide-react';

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
    description: 'Driver\'s license, state ID, or passport',
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

  useEffect(() => {
    async function checkEnrollment() {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('program_enrollments')
        .select('id, enrollment_state')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        router.push('/programs');
        return;
      }

      // Redirect based on state
      if (data.enrollment_state === 'applied' || data.enrollment_state === 'approved') {
        router.push('/enrollment/confirmed');
        return;
      }
      if (data.enrollment_state === 'confirmed') {
        router.push('/enrollment/orientation');
        return;
      }
      if (data.enrollment_state === 'documents_complete' || data.enrollment_state === 'active') {
        router.push('/dashboard');
        return;
      }

      setEnrollmentId(data.id);
      
      // Initialize documents (in real app, fetch from DB)
      setDocuments(DEFAULT_REQUIRED_DOCS.map(doc => ({ ...doc, uploaded: false })));
      setLoading(false);
    }

    checkEnrollment();
  }, [router]);

  async function handleFileUpload(docId: string, file: File) {
    if (!enrollmentId) return;
    
    setUploading(docId);
    setError(null);

    try {
      const supabase = createClient();
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${enrollmentId}/${docId}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('enrollment-documents')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw new Error('Failed to upload file');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('enrollment-documents')
        .getPublicUrl(fileName);

      // Update local state
      setDocuments(docs => 
        docs.map(doc => 
          doc.id === docId 
            ? { ...doc, uploaded: true, file_url: publicUrl }
            : doc
        )
      );
    } catch (err: any) {
      setError('An error occurred');
    } finally {
      setUploading(null);
    }
  }

  async function handleSubmit() {
    if (!enrollmentId) return;
    
    const allUploaded = documents.every(doc => doc.uploaded);
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
          documents: documents.map(d => ({ id: d.id, file_url: d.file_url }))
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit documents');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <span className="text-slate-400 flex-shrink-0">•</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Documents Received</h2>
          <p className="text-gray-600">Your enrollment is being activated.</p>
        </div>
      </div>
    );
  }

  const allUploaded = documents.every(doc => doc.uploaded);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload Required Documents</h1>
          <p className="text-gray-600 mt-2">
            These are required to activate your enrollment and unlock course access.
          </p>
        </div>

        {/* Document List */}
        <div className="space-y-4 mb-8">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    doc.uploaded ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {doc.uploaded ? (
                      <span className="text-slate-400 flex-shrink-0">•</span>
                    ) : (
                      <FileText className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{doc.name}</h3>
                    <p className="text-sm text-gray-500">{doc.description}</p>
                  </div>
                </div>

                {doc.uploaded ? (
                  <button
                    onClick={() => setDocuments(docs => 
                      docs.map(d => d.id === doc.id ? { ...d, uploaded: false, file_url: undefined } : d)
                    )}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                ) : (
                  <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                    uploading === doc.id
                      ? 'bg-gray-100 text-gray-400'
                      : 'bg-brand-blue-50 text-brand-blue-600 hover:bg-brand-blue-100'
                  }`}>
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

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
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
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
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
