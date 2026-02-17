
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, AlertCircle, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface UploadedFile {
  name: string;
  type: string;
  status: 'uploading' | 'complete' | 'error';
}

export default function NailTechDocumentsPage() {
  const router = useRouter();
  const [governmentId, setGovernmentId] = useState<UploadedFile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);

  useEffect(() => {
    async function getEnrollment() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (enrollment) setEnrollmentId(enrollment.id);
    }
    getEnrollment();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setGovernmentId({ name: file.name, type: 'government-id', status: 'uploading' });
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', 'government-id');
      if (enrollmentId) formData.append('enrollmentId', enrollmentId);

      const response = await fetch('/api/enrollment/upload-document', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setGovernmentId({ name: file.name, type: 'government-id', status: 'complete' });
      } else {
        setGovernmentId({ name: file.name, type: 'government-id', status: 'error' });
      }
    } catch {
      setGovernmentId({ name: file.name, type: 'government-id', status: 'error' });
    }
  };

  const handleSubmit = async () => {
    if (!governmentId || governmentId.status !== 'complete') return;
    setSubmitting(true);
    try {
      await fetch('/api/enrollment/submit-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program: 'nail-technician-apprenticeship' }),
      });
      router.push('/apprentice');
    } catch {
      router.push('/apprentice');
    }
  };

  const canSubmit = governmentId?.status === 'complete';

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-slate-900 text-white py-8">
        <div className="max-w-2xl mx-auto px-6">
          <h1 className="text-3xl font-black mb-2">Required Documents</h1>
          <p className="text-slate-300">Upload your documents to complete enrollment and access your program.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="bg-brand-red-600 px-6 py-3">
            <h2 className="text-lg font-bold text-white">Required</h2>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-slate-900">Government-Issued ID</h3>
                  <p className="text-sm text-slate-500">Driver's license, state ID, or passport</p>
                </div>
                {governmentId?.status === 'complete' && <span className="text-slate-400 flex-shrink-0">•</span>}
              </div>

              {governmentId ? (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <span className="flex-1 text-sm text-slate-700 truncate">{governmentId.name}</span>
                  {governmentId.status === 'uploading' && <span className="text-sm text-pink-600">Uploading...</span>}
                  {governmentId.status === 'complete' && (
                    <button onClick={() => setGovernmentId(null)} className="text-slate-400 hover:text-brand-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-pink-500 hover:bg-pink-50 transition">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-600">Click to upload</span>
                  <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="w-full py-4 bg-pink-600 text-white font-bold text-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-700 transition"
        >
          {submitting ? 'Submitting...' : 'Submit Documents'}
        </button>

        {!canSubmit && (
          <p className="text-center text-brand-red-600 text-sm mt-4 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Please upload your government-issued ID to continue.
          </p>
        )}

        <p className="text-center text-slate-500 text-sm mt-4">Your documents are encrypted and stored securely.</p>
      </div>
    </div>
  );
}
