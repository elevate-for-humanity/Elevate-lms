'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Upload, FileText } from 'lucide-react';

const REQUIRED_DOCUMENTS = [
  {
    type: 'photo_id',
    label: 'Government-Issued Photo ID',
    description: "Driver's license, state ID, or passport",
    required: true,
  },
  {
    type: 'proof_of_income',
    label: 'Proof of Income (if applicable)',
    description: 'Pay stub, W-2, tax return, or unemployment letter',
    required: false,
  },
  {
    type: 'proof_of_residency',
    label: 'Proof of Residency',
    description: 'Utility bill, lease agreement, or bank statement (within 60 days)',
    required: true,
  },
  {
    type: 'selective_service',
    label: 'Selective Service Registration',
    description: 'Required for males ages 18–25. Verify at sss.gov',
    required: false,
  },
  {
    type: 'resume',
    label: 'Resume',
    description: 'Current resume or work history (optional but recommended)',
    required: false,
  },
  {
    type: 'other',
    label: 'Other Supporting Document',
    description: 'Any additional documentation',
    required: false,
  },
];

export default function DocumentUploadPage() {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedTypes, setUploadedTypes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadUploadedDocuments();
  }, []);

  async function loadUploadedDocuments() {
    try {
      const res = await fetch('/api/documents/upload');
      const result = await res.json();
      const docs = result.documents || [];
      setUploadedTypes(docs.map((d: { document_type: string }) => d.document_type));
    } catch {
      // Silently fail — user may not be logged in yet
    }
  }

  const requiredComplete = REQUIRED_DOCUMENTS
    .filter((d) => d.required)
    .every((d) => uploadedTypes.includes(d.type));

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !documentType) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      if (description) formData.append('metadata', JSON.stringify({ description }));

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Upload failed');

      setSuccess(`${REQUIRED_DOCUMENTS.find((d) => d.type === documentType)?.label || 'Document'} uploaded.`);
      setFile(null);
      setDocumentType('');
      setDescription('');

      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      await loadUploadedDocuments();
    } catch (err: any) {
      setError(err?.message || 'Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-slate-50 border-b">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Onboarding', href: '/onboarding/learner' }, { label: 'Upload Documents' }]} />
        </div>
      </div>

      <div className="py-8">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Upload Required Documents</h1>
          <p className="text-gray-600 mb-8">
            Upload each document below. Required items must be submitted before your enrollment can be finalized.
          </p>

          {/* Checklist */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Document Checklist</h2>
            <div className="space-y-3">
              {REQUIRED_DOCUMENTS.map((doc) => {
                const isUploaded = uploadedTypes.includes(doc.type);
                return (
                  <div
                    key={doc.type}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      isUploaded
                        ? 'bg-brand-green-50 border-brand-green-200'
                        : doc.required
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <FileText className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      isUploaded ? 'text-brand-green-600' : doc.required ? 'text-yellow-600' : 'text-gray-400'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{doc.label}</span>
                        {doc.required && !isUploaded && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Required</span>
                        )}
                        {isUploaded && (
                          <span className="text-xs bg-brand-green-100 text-brand-green-800 px-2 py-0.5 rounded-full">Uploaded</span>
                        )}
                        {!doc.required && !isUploaded && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Optional</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{doc.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {requiredComplete && (
              <div className="mt-4 p-3 bg-brand-green-50 border border-brand-green-200 rounded-lg text-sm text-brand-green-800">
                All required documents uploaded. You can continue to the next onboarding step.
              </div>
            )}
          </div>

          {/* Social Security Number */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-lg font-semibold mb-1">Social Security Number</h2>
            <p className="text-sm text-gray-500 mb-4">Enter your SSN. This is stored securely and never displayed after submission.</p>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label htmlFor="ssn" className="block text-sm font-medium text-gray-700 mb-1">SSN *</label>
                <input
                  id="ssn"
                  type="password"
                  inputMode="numeric"
                  maxLength={9}
                  pattern="\d{9}"
                  placeholder="9-digit SSN (no dashes)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
                />
              </div>
              <Button type="button" className="px-6 py-2" onClick={async () => {
                const input = document.getElementById('ssn') as HTMLInputElement;
                const val = input?.value?.replace(/\D/g, '');
                if (!val || val.length !== 9) { setError('Enter a valid 9-digit SSN.'); return; }
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { setError('Please log in.'); return; }
                const { error: err } = await supabase.from('profiles').update({ ssn_last4: val.slice(-4) }).eq('id', user.id);
                if (err) { setError('Failed to save SSN.'); return; }
                setSuccess('SSN saved securely.');
                setError(null);
              }}>Save</Button>
            </div>
          </div>

          {/* Upload Form */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload a Document
            </h2>

            <form onSubmit={handleUpload} className="space-y-5">
              <div>
                <label htmlFor="docType" className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type *
                </label>
                <select
                  id="docType"
                  required
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
                >
                  <option value="">Select document type...</option>
                  {REQUIRED_DOCUMENTS.map((doc) => (
                    <option key={doc.type} value={doc.type}>
                      {doc.label} {doc.required ? '(Required)' : '(Optional)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="desc" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  id="desc"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
                  placeholder="Optional — e.g. Indiana driver's license"
                />
              </div>

              <div>
                <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
                  File *
                </label>
                <input
                  id="file"
                  type="file"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <p className="text-sm text-gray-500 mt-1">
                  PDF, JPG, PNG, DOC, or DOCX — max 10 MB
                </p>
              </div>

              {error && (
                <p className="text-sm text-brand-red-600 bg-brand-red-50 border border-brand-red-200 rounded-lg p-3">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-sm text-brand-green-700 bg-brand-green-50 border border-brand-green-200 rounded-lg p-3">
                  {success}
                </p>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={uploading || !file || !documentType}>
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </Button>
                <Link href="/onboarding/learner">
                  <Button type="button" variant="outline">
                    Back to Onboarding
                  </Button>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
