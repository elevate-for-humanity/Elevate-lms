'use client';

import { createClient } from '@/lib/supabase/client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Upload, FileText, AlertCircle, ShieldCheck } from 'lucide-react';

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
          text: 'Document uploaded successfully. It is now awaiting sponsor review.',
        });
        setFile(null);
        setTimeout(() => router.refresh(), 2000);
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Upload failed' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setUploading(false);
    }
  }

  const uploadedByType = new Map(uploadedDocs.map((doc) => [doc.document_type, doc]));

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-3xl font-bold text-black">Host Shop Documents</h1>
          <p className="mt-2 text-black">Upload the documents assigned to your Host Shop onboarding record.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Upload className="w-6 h-6 text-brand-blue-600" />
              <h2 className="text-xl font-bold text-black">Upload Document</h2>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-black mb-2">Document Type *</label>
                <select
                  className="w-full rounded-lg border border-slate-300 p-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  required
                >
                  {requirements.map((req) => (
                    <option key={req.document_type} value={req.document_type}>
                      {req.display_name}{req.required ? ' *' : ''}
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
                <label className="block text-sm font-bold text-black mb-2">Signed PDF *</label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full rounded-lg border border-slate-300 p-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  required
                />
                <p className="mt-2 text-xs text-black">Upload signed PDF documents only. Maximum file size: 10 MB.</p>
              </div>

              {message && (
                <div className={`rounded-lg p-4 flex items-start gap-3 ${message.type === 'success' ? 'bg-brand-green-50 border border-brand-green-200' : 'bg-brand-red-50 border border-brand-red-200'}`}>
                  {message.type === 'success' ? (
                    <ShieldCheck className="w-5 h-5 text-brand-green-700 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-brand-orange-600 mt-0.5" />
                  )}
                  <div className={`text-sm ${message.type === 'success' ? 'text-brand-green-800' : 'text-brand-red-800'}`}>
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

          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-6 h-6 text-brand-blue-600" />
              <h2 className="text-xl font-bold text-black">Required Documents</h2>
            </div>

            <div className="space-y-3">
              {requirements.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  No documents are currently assigned to this Host Shop.
                </div>
              ) : (
                requirements.map((req) => {
                  const uploaded = uploadedByType.get(req.document_type);
                  return (
                    <div key={req.document_type} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-black">{req.display_name}</div>
                          <p className="mt-1 text-sm text-slate-700">{req.description}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${uploaded ? 'bg-emerald-100 text-emerald-800' : req.required ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'}`}>
                          {uploaded ? uploaded.status || 'Uploaded' : req.required ? 'Required' : 'Optional'}
                        </span>
                      </div>
                      {uploaded ? <p className="mt-2 text-xs text-slate-600">Uploaded: {uploaded.file_name}</p> : null}
                    </div>
                  );
                })
              )}

              <div className="border border-slate-200 rounded-lg p-4">
                <div className="font-semibold text-black mb-1">IRS Form W-9</div>
                <p className="text-sm text-black mb-3">Use the current IRS-issued form when a W-9 is requested.</p>
                <a
                  href="https://www.irs.gov/pub/irs-pdf/fw9.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-brand-blue-600 hover:text-brand-blue-700 font-semibold"
                >
                  <FileText className="w-4 h-4" />
                  Open IRS Form W-9
                </a>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-xs text-slate-700">
                Sponsor-specific agreements are assigned through the onboarding record. The portal no longer publishes unverified or stale legal-template downloads.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/partners/host-shops" className="text-brand-blue-600 hover:text-brand-blue-700 font-semibold">
            ← Back to Host Shops
          </Link>
        </div>
      </div>
    </div>
  );
}
