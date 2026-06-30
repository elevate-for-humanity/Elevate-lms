'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';
import { Upload, AlertCircle, FileText, Loader2, ArrowRight, X, ExternalLink } from 'lucide-react';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';

const DOC_SLOTS = [
  {
    id: 'ein_letter',
    label: 'IRS EIN Assignment Letter (CP 575)',
    description: 'The IRS letter confirming your Employer Identification Number.',
    required: true,
    accept: '.pdf,.jpg,.jpeg,.png',
    hint: 'If you cannot locate your CP 575, request a 147C letter from the IRS at 1-800-829-4933.',
  },
  {
    id: 'salon_license',
    label: 'Indiana Salon/Spa License',
    description: 'Current Indiana salon or spa license issued by IPLA.',
    required: true,
    accept: '.pdf,.jpg,.jpeg,.png',
    hint: 'Must be current and in good standing. Verify at mylicense.in.gov.',
    externalLink: { label: 'Verify license (IPLA)', href: 'https://mylicense.in.gov/EGov/index.aspx' },
  },
  {
    id: 'workers_comp',
    label: "Workers' Compensation Insurance Certificate",
    description: "Certificate of insurance showing active Workers' Compensation coverage.",
    required: true,
    accept: '.pdf,.jpg,.jpeg,.png',
    hint: "If exempt, provide your Indiana state exemption certificate.",
  },
  {
    id: 'supervisor_license',
    label: 'Supervising Esthetician License',
    description: 'Indiana IPLA esthetician license for the designated apprentice supervisor.',
    required: true,
    accept: '.pdf,.jpg,.jpeg,.png',
    hint: 'Supervisor must have minimum 2 years of licensed experience.',
  },
  {
    id: 'business_license',
    label: 'City/County Business License (if applicable)',
    description: 'Local business license or occupancy permit.',
    required: false,
    accept: '.pdf,.jpg,.jpeg,.png',
    hint: 'Required if your city or county issues business licenses.',
  },
];

export default function EstheticianDocumentsPage() {
  const [uploads, setUploads] = useState<Record<string, File | null>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const requiredDone = DOC_SLOTS.filter((d) => d.required).every((d) => uploaded[d.id]);

  async function handleFile(slotId: string, file: File) {
    setUploads((p) => ({ ...p, [slotId]: file }));
    setUploading((p) => ({ ...p, [slotId]: true }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('slotId', slotId);
      fd.append('program', 'esthetician-apprenticeship');
      const res = await fetch('/api/partners/upload-document', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      setUploaded((p) => ({ ...p, [slotId]: true }));
    } catch {
      setError(`Failed to upload ${file.name}. Please try again.`);
    } finally {
      setUploading((p) => ({ ...p, [slotId]: false }));
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <InstitutionalHeader title="Required Documents" subtitle="Esthetician Apprenticeship — Host Spa Partner" documentType="Document Upload" />

        <div className="mt-8 space-y-4">
          {DOC_SLOTS.map((slot) => (
            <div key={slot.id} className={`bg-white border rounded-xl p-5 ${uploaded[slot.id] ? 'border-brand-green-300' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    {slot.label}
                    {slot.required && <span className="text-red-500 ml-1">*</span>}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{slot.description}</p>
                </div>
                {uploaded[slot.id] && (
                  <span className="text-xs font-bold text-brand-green-700 bg-brand-green-50 border border-brand-green-200 px-2 py-0.5 rounded-full shrink-0">Uploaded</span>
                )}
              </div>
              <p className="text-xs text-slate-400 mb-3">{slot.hint}</p>
              {slot.externalLink && (
                <a href={slot.externalLink.href} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-pink-600 hover:underline mb-3">
                  <ExternalLink className="w-3 h-3" /> {slot.externalLink.label}
                </a>
              )}
              <div className="flex items-center gap-3">
                <input ref={(el) => { inputRefs.current[slot.id] = el; }} type="file" accept={slot.accept}
                  className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(slot.id, f); }} />
                <button type="button" onClick={() => inputRefs.current[slot.id]?.click()}
                  disabled={uploading[slot.id]}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50">
                  {uploading[slot.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {uploads[slot.id] ? uploads[slot.id]!.name : 'Choose file'}
                </button>
                {uploads[slot.id] && !uploaded[slot.id] && !uploading[slot.id] && (
                  <button type="button" onClick={() => setUploads((p) => ({ ...p, [slot.id]: null }))}
                    className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                )}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <Link href="/partners/esthetician-apprenticeship/policy-acknowledgment" className="text-sm text-slate-500 hover:text-slate-700">← Back</Link>
          <Link href="/partners/esthetician-apprenticeship/forms"
            className={`inline-flex items-center gap-2 font-bold px-6 py-3 rounded-xl transition-colors text-sm ${requiredDone ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed pointer-events-none'}`}>
            Continue to Forms <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
