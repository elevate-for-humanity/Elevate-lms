'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { useState, useRef } from 'react';
import {
  Upload, CheckCircle2, AlertCircle, FileText,
  Loader2, ArrowLeft, ExternalLink, X,
} from 'lucide-react';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';

interface DocSlot {
  id: string;
  label: string;
  description: string;
  required: boolean;
  accept: string;
  hint: string;
  externalLink?: { label: string; href: string };
}

const DOC_SLOTS: DocSlot[] = [
  {
    id: 'w9',
    label: 'W-9 Form (Tax Identification)',
    description: 'IRS Form W-9 completed and signed. Required for all worksite partners for tax reporting.',
    required: true,
    accept: '.pdf,.jpg,.jpeg,.png',
    hint: 'PDF preferred. Download a blank W-9 from the IRS if needed.',
    externalLink: { label: 'Download blank W-9 (IRS)', href: 'https://www.irs.gov/pub/irs-pdf/fw9.pdf' },
  },
  {
    id: 'barbershop_license',
    label: 'Indiana Barbershop License',
    description: 'Current, valid Indiana barbershop license showing license number, expiration date, licensee name, and shop address.',
    required: true,
    accept: '.pdf,.jpg,.jpeg,.png',
    hint: 'Full copy required — no crops. Must be current and not expired.',
  },
  {
    id: 'workers_comp',
    label: "Workers' Compensation Certificate",
    description: "Proof of current workers' compensation insurance covering the apprentice.",
    required: true,
    accept: '.pdf,.jpg,.jpeg,.png',
    hint: 'Certificate of insurance from your carrier. Must show effective and expiration dates.',
  },
  {
    id: 'liability_insurance',
    label: 'General Liability Insurance Certificate',
    description: 'Certificate of general liability insurance for your barbershop.',
    required: true,
    accept: '.pdf,.jpg,.jpeg,.png',
    hint: 'Certificate of insurance from your carrier. Must show effective and expiration dates.',
  },
  {
    id: 'supervisor_license',
    label: 'Supervising Barber License',
    description: 'Indiana barber license for the licensed barber who will directly supervise the apprentice. Must have 2+ years of licensed experience.',
    required: true,
    accept: '.pdf,.jpg,.jpeg,.png',
    hint: 'Full copy of the supervising barber\'s individual license — not the shop license.',
  },
];

type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

interface SlotState {
  status: UploadStatus;
  fileName?: string;
  error?: string;
}

export default function PartnerDocumentsPage() {
  const [slots, setSlots] = useState<Record<string, SlotState>>(
    Object.fromEntries(DOC_SLOTS.map(d => [d.id, { status: 'idle' }]))
  );
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function setSlot(id: string, update: Partial<SlotState>) {
    setSlots(prev => ({ ...prev, [id]: { ...prev[id], ...update } }));
  }

  async function handleFile(slot: DocSlot, file: File) {
    setSlot(slot.id, { status: 'uploading', fileName: file.name, error: undefined });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', slot.id);

    try {
      const res = await fetch('/api/partner/documents', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setSlot(slot.id, { status: 'error', error: data.error || 'Upload failed' });
      } else {
        setSlot(slot.id, { status: 'done', fileName: file.name });
      }
    } catch {
      setSlot(slot.id, { status: 'error', error: 'Network error — please try again' });
    }
  }

  function handleInputChange(slot: DocSlot, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(slot, file);
    // Reset input so same file can be re-uploaded after an error
    e.target.value = '';
  }

  function handleDrop(slot: DocSlot, e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(slot, file);
  }

  const doneCount = DOC_SLOTS.filter(d => slots[d.id]?.status === 'done').length;
  const allDone = doneCount === DOC_SLOTS.length;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Partners', href: '/partners/barbershop-apprenticeship' },
          { label: 'Required Forms', href: '/partners/barbershop-apprenticeship/forms' },
          { label: 'Upload Documents' },
        ]} />
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-4">
        <Link
          href="/partners/barbershop-apprenticeship/forms"
          className="inline-flex items-center gap-1 text-black hover:text-brand-blue-700 text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Required Forms
        </Link>
      </div>

      <section className="py-6 border-b">
        <div className="max-w-4xl mx-auto px-4">
          <InstitutionalHeader
            documentType="Document Upload"
            title="Partner Compliance Documents"
            subtitle="Upload all required documents before hosting apprentices. All files are reviewed by the Elevate compliance team."
            noDivider
          />
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Progress */}
        <div className="bg-white rounded-xl border shadow-sm p-5 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-900">Upload Progress</span>
            <span className="text-sm text-black">{doneCount} of {DOC_SLOTS.length} uploaded</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-brand-blue-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${(doneCount / DOC_SLOTS.length) * 100}%` }}
            />
          </div>
          {allDone && (
            <p className="text-sm text-green-700 font-medium mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> All documents uploaded — your application is under review.
            </p>
          )}
        </div>

        {/* Document slots */}
        <div className="space-y-5">
          {DOC_SLOTS.map((slot) => {
            const state = slots[slot.id];
            const isDone = state.status === 'done';
            const isUploading = state.status === 'uploading';
            const isError = state.status === 'error';

            return (
              <div
                key={slot.id}
                className={`rounded-xl border-2 p-5 transition-colors ${
                  isDone
                    ? 'border-green-400 bg-green-50'
                    : isError
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 bg-white'
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => !isDone && !isUploading && handleDrop(slot, e)}
              >
                <div className="flex items-start gap-4">
                  {/* Status icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {isDone ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : isError ? (
                      <AlertCircle className="w-6 h-6 text-red-500" />
                    ) : (
                      <FileText className="w-6 h-6 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{slot.label}</h3>
                      {slot.required && (
                        <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">Required</span>
                      )}
                      {isDone && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Uploaded</span>
                      )}
                    </div>
                    <p className="text-sm text-black mb-1">{slot.description}</p>
                    <p className="text-xs text-gray-500 mb-3">{slot.hint}</p>

                    {slot.externalLink && (
                      <a
                        href={slot.externalLink.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-brand-blue-600 hover:underline mb-3"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {slot.externalLink.label}
                      </a>
                    )}

                    {/* Uploaded file name */}
                    {state.fileName && (
                      <p className="text-xs text-gray-700 mb-2 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {state.fileName}
                        {isDone && (
                          <button
                            type="button"
                            onClick={() => setSlot(slot.id, { status: 'idle', fileName: undefined })}
                            className="ml-1 text-gray-400 hover:text-red-500"
                            title="Remove and re-upload"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </p>
                    )}

                    {/* Error */}
                    {isError && state.error && (
                      <p className="text-xs text-red-600 mb-2">{state.error}</p>
                    )}

                    {/* Upload button */}
                    {!isDone && (
                      <>
                        <input
                          ref={(el) => { fileInputRefs.current[slot.id] = el; }}
                          type="file"
                          accept={slot.accept}
                          className="hidden"
                          onChange={(e) => handleInputChange(slot, e)}
                        />
                        <button
                          type="button"
                          disabled={isUploading}
                          onClick={() => fileInputRefs.current[slot.id]?.click()}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUploading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                          ) : (
                            <><Upload className="w-4 h-4" /> {isError ? 'Try Again' : 'Upload File'}</>
                          )}
                        </button>
                        <p className="text-xs text-gray-400 mt-1">PDF, JPEG, or PNG · Max 10 MB · Drag &amp; drop supported</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Next step */}
        <div className="mt-8 bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900">All documents uploaded?</h3>
            <p className="text-sm text-black">Return to the forms checklist to complete remaining steps.</p>
          </div>
          <Link
            href="/partners/barbershop-apprenticeship/forms"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 whitespace-nowrap"
          >
            Back to Checklist
          </Link>
        </div>
      </div>
    </div>
  );
}
