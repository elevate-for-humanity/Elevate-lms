
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { updateOnboardingProgress } from '@/lib/compliance/enforcement';
import {
  Upload,
  FileText,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';

interface RequiredDocument {
  id: string;
  name: string;
  description: string;
  required: boolean;
  acceptedTypes: string[];
  maxSize: number; // in MB
}

const REQUIRED_DOCUMENTS: RequiredDocument[] = [
  {
    id: 'government_id',
    name: 'Government-Issued ID',
    description: "Driver's license, state ID, or passport",
    required: true,
    acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 10,
  },
  {
    id: 'social_security_card',
    name: 'Social Security Card',
    description: 'Copy of your Social Security card for employment verification',
    required: true,
    acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 10,
  },
  {
    id: 'transfer_hours',
    name: 'Transfer Hours Documentation',
    description: 'Transcripts or certificates from previous training programs',
    required: true,
    acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 10,
  },
  {
    id: 'proof_of_eligibility',
    name: 'Proof of Eligibility',
    description: 'WIOA eligibility letter, unemployment documentation, or income verification (if applicable)',
    required: false,
    acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 10,
  },
  {
    id: 'resume',
    name: 'Resume/CV',
    description: 'Current resume or curriculum vitae (recommended for job placement)',
    required: false,
    acceptedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxSize: 5,
  },
];

interface UploadedFile {
  documentId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  url?: string;
}

export default function OnboardingDocumentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile>>({});

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data, error }) => {
      if (error || !data?.user) {
        router.push('/login?next=/student-portal/onboarding/documents');
        return;
      }

      setUser(data.user);

      // Check for existing uploads
      const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', data.user.id)
        .eq('category', 'onboarding');

      if (documents) {
        const uploaded: Record<string, UploadedFile> = {};
        for (const doc of documents) {
          uploaded[doc.document_type] = {
            documentId: doc.id,
            fileName: doc.file_name,
            fileSize: doc.file_size,
            uploadedAt: doc.created_at,
            url: doc.file_url,
          };
        }
        setUploadedFiles(uploaded);
      }

      setLoading(false);
    });
  }, [router]);

  const handleFileUpload = async (documentId: string, file: File) => {
    if (!user) return;

    const docConfig = REQUIRED_DOCUMENTS.find((d) => d.id === documentId);
    if (!docConfig) return;

    // Validate file type
    if (!docConfig.acceptedTypes.includes(file.type)) {
      setError(`Invalid file type. Accepted: ${docConfig.acceptedTypes.join(', ')}`);
      return;
    }

    // Validate file size
    if (file.size > docConfig.maxSize * 1024 * 1024) {
      setError(`File too large. Maximum size: ${docConfig.maxSize}MB`);
      return;
    }

    setUploading(documentId);
    setError(null);

    try {
      const supabase = createClient();

      // Upload to storage
      const fileName = `${user.id}/${documentId}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase!.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase!.storage
        .from('documents')
        .getPublicUrl(fileName);

      // Save document record
      const { data: docRecord, error: docError } = await supabase!
        .from('documents')
        .insert({
          user_id: user.id,
          document_type: documentId,
          category: 'onboarding',
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_url: urlData.publicUrl,
          storage_path: fileName,
        })
        .select()
        .single();

      if (docError) throw docError;

      setUploadedFiles((prev) => ({
        ...prev,
        [documentId]: {
          documentId: docRecord.id,
          fileName: file.name,
          fileSize: file.size,
          uploadedAt: docRecord.created_at,
          url: urlData.publicUrl,
        },
      }));

      // Check if all required documents are uploaded
      const requiredDocs = REQUIRED_DOCUMENTS.filter((d) => d.required);
      const allRequiredUploaded = requiredDocs.every(
        (d) => uploadedFiles[d.id] || d.id === documentId
      );

      if (allRequiredUploaded) {
        await updateOnboardingProgress(user.id, 'documents', true);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('An error occurred');
    } finally {
      setUploading(null);
    }
  };

  const handleRemoveFile = async (documentId: string) => {
    if (!user || !uploadedFiles[documentId]) return;

    try {
      const supabase = createClient();

      // Delete from database (storage cleanup can be done via trigger or cron)
      await supabase!
        .from('documents')
        .delete()
        .eq('id', uploadedFiles[documentId].documentId);

      setUploadedFiles((prev) => {
        const updated = { ...prev };
        delete updated[documentId];
        return updated;
      });
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to remove file');
    }
  };

  const requiredComplete = REQUIRED_DOCUMENTS.filter((d) => d.required).every(
    (d) => uploadedFiles[d.id]
  );

  const handleContinue = async () => {
    if (user && requiredComplete) {
      await updateOnboardingProgress(user.id, 'documents', true);
      router.push('/student-portal/onboarding');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-brand-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Back Link */}
        <Link
          href="/student-portal/onboarding"
          className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Onboarding
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Upload className="w-6 h-6 text-brand-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Upload Required Documents
              </h1>
              <p className="text-slate-600 mt-1">
                Please upload the following documents to complete your enrollment.
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-brand-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-brand-red-800 font-medium">Error</p>
              <p className="text-brand-red-700 text-sm">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-brand-red-400 hover:text-brand-red-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Document Upload Cards */}
        <div className="space-y-4 mb-8">
          {REQUIRED_DOCUMENTS.map((doc) => {
            const uploaded = uploadedFiles[doc.id];
            const isUploading = uploading === doc.id;

            return (
              <div
                key={doc.id}
                className={`bg-white rounded-xl shadow-sm p-6 border-2 transition-colors ${
                  uploaded ? 'border-brand-green-500' : 'border-transparent'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      uploaded ? 'bg-brand-green-100' : 'bg-slate-100'
                    }`}
                  >
                    {uploaded ? (
                      <Check className="w-6 h-6 text-brand-green-600" />
                    ) : (
                      <FileText className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{doc.name}</h3>
                      {doc.required && (
                        <span className="text-xs bg-brand-red-100 text-brand-red-700 px-2 py-0.5 rounded-full">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{doc.description}</p>

                    {uploaded ? (
                      <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700">{uploaded.fileName}</span>
                          <span className="text-xs text-slate-500">
                            ({(uploaded.fileSize / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveFile(doc.id)}
                          className="text-brand-red-600 hover:text-brand-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="block">
                        <div
                          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                            isUploading
                              ? 'border-brand-blue-300 bg-brand-blue-50'
                              : 'border-slate-300 hover:border-brand-blue-400 hover:bg-slate-50'
                          }`}
                        >
                          {isUploading ? (
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="w-5 h-5 text-brand-blue-600 animate-spin" />
                              <span className="text-brand-blue-600">Uploading...</span>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                              <p className="text-sm text-slate-600">
                                Click to upload or drag and drop
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                Max {doc.maxSize}MB • PDF, JPG, PNG
                              </p>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept={doc.acceptedTypes.join(',')}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(doc.id, file);
                          }}
                          disabled={isUploading}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="flex gap-4">
          <Link
            href="/student-portal/onboarding"
            className="flex-1 py-3 px-6 rounded-lg font-medium text-center border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Skip for Now
          </Link>
          <button
            onClick={handleContinue}
            disabled={!requiredComplete}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
              requiredComplete
                ? 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            {requiredComplete ? (
              <span className="flex items-center justify-center gap-2">
                Continue
                <ChevronRight className="w-5 h-5" />
              </span>
            ) : (
              'Upload Required Documents'
            )}
          </button>
        </div>

        {/* Privacy Notice */}
        <p className="text-xs text-slate-500 text-center mt-6">
          Your documents are stored securely and will only be used for enrollment verification.
          We comply with FERPA and applicable privacy regulations.
        </p>
      </div>
    </div>
  );
}
