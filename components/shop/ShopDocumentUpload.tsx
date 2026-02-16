"use client";

import { createClient } from '@/lib/supabase/client';

import React, { useEffect } from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface Requirement {
  document_type: string;
  display_name: string;
  description: string;
  required: boolean;
}

interface UploadedDocument {
  id: string;
  document_type: string;
  file_name: string;
  status: string;
  uploaded_at: string;
}

export function ShopDocumentUpload({
  shopId,
  requirements,
}: {
  shopId: string;
  requirements: Requirement[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [selectedType, setSelectedType] = useState(requirements[0]?.document_type || '');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Load previously uploaded documents from DB
  useEffect(() => {
    async function loadUploadedDocs() {
      const { data } = await supabase
        .from('shop_documents')
        .select('id, document_type, file_name, status, uploaded_at')
        .eq('shop_id', shopId)
        .order('uploaded_at', { ascending: false });
      
      if (data) setUploadedDocs(data);
    }
    if (shopId) loadUploadedDocs();
  }, [shopId, supabase]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();

    if (!file || !selectedType) {
      setMessage({ type: 'error', text: 'Please select a document type and file' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', selectedType);
      formData.append('shop_id', shopId);

      const res = await fetch('/api/shop/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setMessage({
          type: 'success',
          text: 'Document uploaded successfully! Awaiting sponsor approval.',
        });
        setFile(null);
        setTimeout(() => {
          router.refresh();
        }, 2000);
      } else {
        const error = await res.json();
        setMessage({
          type: 'error',
          text: error.error || 'Upload failed',
        });
      }
    } catch (error) { /* Error handled silently */ 
      setMessage({
        type: 'error',
        text: 'Network error. Please try again.',
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-3xl font-bold text-black">Upload Documents</h1>
          <p className="mt-2 text-black">
            Upload required documents for shop partner onboarding
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upload Form */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Upload className="w-6 h-6 text-brand-blue-600" />
              <h2 className="text-xl font-bold text-black">Upload Document</h2>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  Document Type *
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 p-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  required
                >
                  {requirements.map((req) => (
                    <option key={req.document_type} value={req.document_type}>
                      {req.display_name}
                      {req.required ? ' *' : ''}
                    </option>
                  ))}
                </select>
                {selectedType && (
                  <p className="mt-2 text-xs text-black">
                    {requirements.find((r) => r.document_type === selectedType)?.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  File (PDF) *
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full rounded-lg border border-slate-300 p-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  required
                />
                <p className="mt-2 text-xs text-black">
                  Upload signed PDF documents only. Max size: 10MB
                </p>
              </div>

              {message && (
                <div
                  className={`rounded-lg p-4 flex items-start gap-3 ${
                    message.type === 'success'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  {message.type === 'success' ? (
                    <span className="text-slate-400 flex-shrink-0">•</span>
                  ) : (
                    <AlertCircle className="w-5 h-5 text-brand-orange-600 mt-0.5" />
                  )}
                  <div
                    className={`text-sm ${
                      message.type === 'success' ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading || !file}
                className="w-full px-6 py-3 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </form>
          </div>

          {/* Document Templates */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-6 h-6 text-brand-blue-600" />
              <h2 className="text-xl font-bold text-black">Document Templates</h2>
            </div>

            <div className="space-y-3">
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="font-semibold text-black mb-1">
                  MOU (Memorandum of Understanding)
                </div>
                <p className="text-sm text-black mb-3">
                  Employer/worksite agreement with sponsor
                </p>
                <a
                  href="/docs/templates/EFH_Shop_MOU_Indiana.pdf"
                  download
                  className="inline-flex items-center gap-2 text-sm text-brand-blue-600 hover:text-brand-blue-700 font-semibold"
                >
                  <FileText className="w-4 h-4" />
                  Download Template
                </a>
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <div className="font-semibold text-black mb-1">
                  NDA + IP Acknowledgment
                </div>
                <p className="text-sm text-black mb-3">
                  Confidentiality + IP protection for EFH systems
                </p>
                <a
                  href="/docs/templates/EFH_NDA_IP_Acknowledgment.pdf"
                  download
                  className="inline-flex items-center gap-2 text-sm text-brand-blue-600 hover:text-brand-blue-700 font-semibold"
                >
                  <FileText className="w-4 h-4" />
                  Download Template
                </a>
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <div className="font-semibold text-black mb-1">
                  Non-Compete Agreement
                </div>
                <p className="text-sm text-black mb-3">
                  Restricts use of EFH curriculum and IP
                </p>
                <a
                  href="/docs/templates/EFH_Non_Compete_Indiana.pdf"
                  download
                  className="inline-flex items-center gap-2 text-sm text-brand-blue-600 hover:text-brand-blue-700 font-semibold"
                >
                  <FileText className="w-4 h-4" />
                  Download Template
                </a>
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <div className="font-semibold text-black mb-1">W-9 Form</div>
                <p className="text-sm text-black mb-3">
                  IRS tax form for vendor/payroll setup
                </p>
                <a
                  href="https://www.irs.gov/pub/irs-pdf/fw9.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-brand-blue-600 hover:text-brand-blue-700 font-semibold"
                >
                  <FileText className="w-4 h-4" />
                  Download from IRS
                </a>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-xs text-black">
                <strong>Note:</strong> Download templates, sign them, and upload the
                signed PDFs. Your sponsor will review and approve each document.
              </p>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <a
            href="/shop/onboarding"
            className="text-brand-blue-600 hover:text-brand-blue-700 font-semibold"
          >
            ← Back to Onboarding
          </a>
        </div>
      </div>
    </div>
  );
}
