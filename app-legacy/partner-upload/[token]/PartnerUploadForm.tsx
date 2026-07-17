'use client';

import { useState, useRef } from 'react';
import { CheckCircle, Upload, Loader2, AlertCircle } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const DOCS = [
  {
    type: 'business_license',
    label: 'Business License',
    description: 'Current state or local business license',
    accept: '.pdf,.jpg,.jpeg,.png',
  },
  {
    type: 'w9',
    label: 'W-9 Form',
    description: 'IRS W-9 — download blank IRS Form W-9 (https://www.irs.gov/pub/irs-pdf/fw9.pdf)',
    accept: '.pdf,.jpg,.jpeg,.png',
  },
  {
    type: 'insurance',
    label: 'Proof of Insurance',
    description: 'General liability insurance certificate',
    accept: '.pdf,.jpg,.jpeg,.png',
  },
];

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

export default function PartnerUploadForm({
  partnerId,
  token,
}: {
  partnerId: string;
  token: string;
}) {
  const [states, setStates] = useState<Record<string, UploadState>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function handleUpload(docType: string, file: File) {
    setStates((s) => ({ ...s, [docType]: 'uploading' }));
    setErrors((e) => ({ ...e, [docType]: '' }));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', docType);
    formData.append('partnerId', partnerId);
    formData.append('token', token);

    const res = await fetch('/api/partner-upload', { method: 'POST', body: formData });
    const json = await res.json();

    if (!res.ok) {
      setStates((s) => ({ ...s, [docType]: 'error' }));
      setErrors((e) => ({ ...e, [docType]: json.error || 'Upload failed. Please try again.' }));
    } else {
      setStates((s) => ({ ...s, [docType]: 'done' }));
    }
  }

  const allDone = DOCS.every((d) => states[d.type] === 'done');

  return (
    <div className="space-y-4">
      {DOCS.map((doc) => {
        const state = states[doc.type] || 'idle';
        return (
          <div
            key={doc.type}
            className={`border rounded-lg p-4 transition-colors ${
              state === 'done'
                ? 'border-brand-green-300 bg-brand-green-50'
                : state === 'error'
                  ? 'border-red-300 bg-red-50'
                  : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-semibold text-slate-900 text-sm">{doc.label}</p>
                <p className="text-xs text-slate-700 mt-0.5">{doc.description}</p>
                {errors[doc.type] && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors[doc.type]}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                {state === 'done' ? (
                  <span className="flex items-center gap-1 text-brand-green-700 text-sm font-medium">
                    <CheckCircle className="w-5 h-5" /> Uploaded
                  </span>
                ) : state === 'uploading' ? (
                  <span className="flex items-center gap-1 text-slate-700 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                  </span>
                ) : (
                  <>
                    <input
                      ref={(el) => {
                        inputRefs.current[doc.type] = el;
                      }}
                      type="file"
                      accept={doc.accept}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(doc.type, file);
                      }}
                    />
                    <button
                      onClick={() => inputRefs.current[doc.type]?.click()}
                      className="flex items-center gap-1.5 bg-[#1E293B] text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-[#334155] transition"
                    >
                      <Upload className="w-4 h-4" />
                      {state === 'error' ? 'Retry' : 'Upload'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {allDone && (
        <div className="mt-6 bg-brand-green-50 border border-brand-green-200 rounded-lg p-5 text-center">
          <CheckCircle className="w-8 h-8 text-brand-green-600 mx-auto mb-2" />
          <p className="font-bold text-brand-green-800">All documents uploaded!</p>
          <p className="text-sm text-brand-green-700 mt-1">
            {PLATFORM_DEFAULTS.orgName} will review your documents within 1–3 business days and follow up
            by email.
          </p>
        </div>
      )}
    </div>
  );
}
