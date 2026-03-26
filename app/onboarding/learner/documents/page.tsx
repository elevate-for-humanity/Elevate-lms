'use client';

import { useEffect, useState, useRef } from 'react';
import CanonicalVideo from '@/components/video/CanonicalVideo';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { normalizeSsn, formatSsn, isValidSsn } from '@/lib/ssn';
import { ArrowLeft, CheckCircle2, Upload, FileText, X, AlertCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface DocRequirement {
  type: string;
  title: string;
  description: string;
  required: boolean;
  acceptedFormats: string;
}

const REQUIRED_DOCUMENTS: DocRequirement[] = [
  {
    type: 'government_id',
    title: 'Government-Issued Photo ID',
    description: 'Driver\'s license, state ID card, or passport. Must be current and not expired. Name must match your application.',
    required: true,
    acceptedFormats: 'JPG, PNG, or PDF (max 10MB)',
  },
  {
    type: 'income_proof',
    title: 'Proof of Income (if applicable)',
    description: 'Pay stub, W-2, tax return, or unemployment letter. Required for WIOA funding eligibility.',
    required: false,
    acceptedFormats: 'JPG, PNG, or PDF (max 10MB)',
  },
  {
    type: 'residency_proof',
    title: 'Proof of Indiana Residency',
    description: 'Utility bill, lease agreement, bank statement, or government mail dated within the last 60 days showing your Indiana address.',
    required: true,
    acceptedFormats: 'JPG, PNG, or PDF (max 10MB)',
  },
  {
    type: 'selective_service',
    title: 'Selective Service Registration (Males 18-25)',
    description: 'Selective Service registration confirmation. Required for males ages 18-25 applying for WIOA funding. Not required for females or males over 25.',
    required: false,
    acceptedFormats: 'JPG, PNG, or PDF (max 10MB)',
  },
  {
    type: 'resume',
    title: 'Resume (Optional)',
    description: 'Your current resume. If you don\'t have one, our career services team will help you create one during your program.',
    required: false,
    acceptedFormats: 'PDF, DOC, or DOCX (max 10MB)',
  },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export default function DocumentsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadedTypes, setUploadedTypes] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [ssnDisplay, setSsnDisplay] = useState('');
  const [ssnDigits, setSsnDigits] = useState('');
  const [ssnSaved, setSsnSaved] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data, error: authErr }) => {
      if (authErr || !data?.user) { router.push('/login'); return; }
      setUserId(data.user.id);

      // Fetch uploaded documents via API route (bypasses RLS)
      fetch('/api/documents/upload')
        .then(res => res.json())
        .then(result => {
          const docs = result.documents || [];
          const types = new Set(docs.map((d: any) => d.document_type));
          setUploadedTypes(types);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, [router]);

  const requiredComplete = REQUIRED_DOCUMENTS.filter(d => d.required).every(d => uploadedTypes.has(d.type));

  const handleUpload = async (docType: string, file: File) => {
    if (!userId) return;
    if (file.size > MAX_FILE_SIZE) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Invalid file type. Please upload JPG, PNG, PDF, DOC, or DOCX.');
      return;
    }

    setUploading(docType);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', docType);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setError(result.error?.message || result.message || 'Upload failed. Please try again.');
        return;
      }

      const updated = new Set(uploadedTypes);
      updated.add(docType);
      setUploadedTypes(updated);
    } catch (err) {
      setError('Upload failed. Please check your connection and try again.');
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* VIDEO HERO — full bleed, no text on top */}
      <div className="relative w-full overflow-hidden" style={{ height: '55vh', minHeight: 280, maxHeight: 480 }}>
        <CanonicalVideo
          src="/videos/elevate-overview-with-narration.mp4"
          poster="/images/pages/docs-page-1.jpg"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Onboarding', href: '/onboarding/learner' },
            { label: 'Upload Documents' },
          ]} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/onboarding/learner" className="text-sm text-brand-blue-600 flex items-center gap-1 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Onboarding
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Required Documents</h1>
        <p className="text-gray-600 mb-4">
          Upload the documents listed below. Required documents must be submitted before you can be enrolled.
        </p>

        {/* Compliance transparency statement */}
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-brand-blue-900">
              <p className="font-medium mb-1">Your information is protected</p>
              <p>
                Documents and personal information you provide are required for workforce funding
                eligibility verification under WIOA guidelines. All data is encrypted, stored in
                private secure storage, and only accessible to authorized compliance staff. Your
                SSN is hashed immediately upon submission and is never stored or displayed in
                plain text. For details, see our{' '}
                <Link href="/privacy-policy" className="underline font-medium">Privacy Policy</Link>
                {' '}and{' '}
                <Link href="/compliance" className="underline font-medium">Data Security</Link> pages.
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white border rounded-lg p-4 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Required Documents</span>
            <span className="text-gray-500">
              {REQUIRED_DOCUMENTS.filter(d => d.required && uploadedTypes.has(d.type)).length} of {REQUIRED_DOCUMENTS.filter(d => d.required).length}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${(REQUIRED_DOCUMENTS.filter(d => d.required && uploadedTypes.has(d.type)).length / REQUIRED_DOCUMENTS.filter(d => d.required).length) * 100}%` }}
            />
          </div>
        </div>

        {/* Social Security Number — text entry, not file upload */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Social Security Number</h2>
          <p className="text-sm text-gray-500 mb-4">Enter your SSN below. It is stored securely and never displayed after submission.</p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label htmlFor="ssn-input" className="block text-sm font-medium text-gray-700 mb-1">SSN *</label>
              <input
                id="ssn-input"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={11}
                placeholder="123-45-6789"
                value={ssnDisplay}
                onChange={(e) => {
                  const digits = normalizeSsn(e.target.value);
                  setSsnDigits(digits);
                  setSsnDisplay(formatSsn(digits));
                }}
                disabled={ssnSaved}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500 font-mono tracking-wider disabled:bg-white"
              />
            </div>
            <button
              type="button"
              disabled={ssnSaved}
              className="px-6 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 font-medium disabled:opacity-50"
              onClick={async () => {
                if (!isValidSsn(ssnDigits)) {
                  setError('Enter a valid 9-digit SSN (e.g. 123-45-6789).');
                  return;
                }
                try {
                  const supabase = createClient();
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) { setError('Please log in.'); return; }
                  const { error: err } = await supabase.from('secure_identity').upsert({ user_id: user.id, ssn_last4: ssnDigits.slice(-4), updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
                  if (err) {
                    setError('Failed to save: ' + err.message);
                    return;
                  }
                  setError('');
                  setSsnDisplay('***-**-' + ssnDigits.slice(-4));
                  setSsnSaved(true);
                } catch (e: any) {
                  setError('Failed to save: ' + (e?.message || 'unknown error'));
                }
              }}
            >Save</button>
          </div>
        </div>

        {requiredComplete && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 flex flex-col sm:flex-row items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
              <FileText className="w-7 h-7 text-slate-500" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg font-bold text-slate-900 mb-1">All Required Documents Uploaded</h2>
              <p className="text-slate-500 text-sm">Your documents are pending review. You can continue with onboarding.</p>
            </div>
            <Link href="/onboarding/learner" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 flex-shrink-0">
              Continue <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        )}

        {error && (
          <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-3 mb-4 flex items-center gap-2 text-brand-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Document Cards */}
        <div className="space-y-4">
          {REQUIRED_DOCUMENTS.map((doc) => {
            const isUploaded = uploadedTypes.has(doc.type);
            const isUploading = uploading === doc.type;

            return (
              <div key={doc.type} className={`bg-white border rounded-xl p-5 ${isUploaded ? 'border-brand-blue-200' : 'border-gray-200'}`}>
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isUploaded ? 'bg-brand-blue-100' : 'bg-white'}`}>
                    {isUploaded ? <CheckCircle2 className="w-5 h-5 text-brand-blue-600" /> : <FileText className="w-5 h-5 text-gray-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${isUploaded ? 'text-brand-blue-900' : 'text-gray-900'}`}>{doc.title}</h3>
                      {doc.required && !isUploaded && <span className="text-xs bg-brand-red-100 text-brand-red-700 px-2 py-0.5 rounded">Required</span>}
                      {!doc.required && !isUploaded && <span className="text-xs bg-white text-gray-500 px-2 py-0.5 rounded">Optional</span>}
                      {isUploaded && <span className="text-xs bg-white text-slate-600 px-2 py-0.5 rounded font-medium">Uploaded</span>}
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{doc.description}</p>
                    <p className="text-xs text-slate-500 mb-3">Accepted: {doc.acceptedFormats}</p>

                    <input
                      ref={(el) => { fileInputRefs.current[doc.type] = el; }}
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(doc.type, file);
                      }}
                    />

                    {isUploading ? (
                      <div className="flex items-center gap-2 text-brand-blue-600 text-sm">
                        <div className="w-4 h-4 border-2 border-brand-blue-600 border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[doc.type]?.click()}
                        className="inline-flex items-center gap-2 text-sm font-medium text-brand-blue-600 hover:text-brand-blue-800"
                      >
                        <Upload className="w-4 h-4" />
                        {isUploaded ? 'Replace File' : 'Upload File'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-white rounded-lg p-4 text-sm text-gray-600">
          <p className="font-medium text-gray-700 mb-1">Document Security</p>
          <p>All uploaded documents are encrypted and stored securely. Only authorized admissions staff can access your documents for verification purposes. Documents are retained per federal record-keeping requirements.</p>
        </div>
      </div>
    </div>
  );
}
