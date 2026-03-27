'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const DOC_TYPES = [
  { value: 'w2',                  label: 'W-2',                   desc: 'Wage and tax statement from employer' },
  { value: '1099',                label: '1099',                  desc: 'Self-employment, interest, dividends' },
  { value: 'photo_id',            label: 'Photo ID',              desc: 'Driver\'s license or state ID' },
  { value: 'social_security_card',label: 'Social Security Card',  desc: 'SSN card for you or dependents' },
  { value: 'prior_year_return',   label: 'Prior Year Return',     desc: 'Last year\'s tax return (if available)' },
  { value: 'bank_info',           label: 'Bank Info',             desc: 'Voided check or account info for direct deposit' },
  { value: 'other',               label: 'Other',                 desc: 'Any other relevant document' },
];

interface TaxDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_size: number;
  status: string;
  created_at: string;
}

interface Props {
  userEmail: string;
  existingDocuments: TaxDocument[];
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function docTypeLabel(type: string) {
  return DOC_TYPES.find(d => d.value === type)?.label ?? type;
}

export default function UploadDocumentsClient({ userEmail, existingDocuments }: Props) {
  const [docs, setDocs] = useState<TaxDocument[]>(existingDocuments);
  const [docType, setDocType] = useState('w2');
  const [taxYear, setTaxYear] = useState(String(new Date().getFullYear() - 1));
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    const fd = new FormData();
    fd.append('file', file);
    fd.append('document_type', docType);
    fd.append('tax_year', taxYear);

    try {
      const res = await fetch('/api/supersonic-fast-cash/upload-tax-docs', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || 'Upload failed. Please try again.');
        return;
      }
      setDocs(prev => [data.document, ...prev]);
      setUploadSuccess(`${file.name} uploaded successfully.`);
      if (fileRef.current) fileRef.current.value = '';
    } catch {
      setUploadError('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [docType, taxYear]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const removeDoc = async (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
  };

  const allRequired = ['w2', 'photo_id'].every(t => docs.some(d => d.document_type === t));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-slate-800 text-white py-8 px-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Upload className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Upload Your Tax Documents</h1>
            <p className="text-slate-300 text-sm mt-1">{userEmail} · Step 4 of 4</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Required checklist */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-3">Required Documents</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { type: 'w2',       label: 'W-2 or 1099' },
              { type: 'photo_id', label: 'Photo ID' },
            ].map(({ type, label }) => {
              const done = docs.some(d => d.document_type === type || (type === 'w2' && d.document_type === '1099'));
              return (
                <div key={type} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${done ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                  {done ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />}
                  {label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upload form */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-gray-900">Add a Document</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Document Type</label>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {DOC_TYPES.map(d => (
                  <option key={d.value} value={d.value}>{d.label} — {d.desc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tax Year</label>
              <select
                value={taxYear}
                onChange={e => setTaxYear(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {[0, 1, 2, 3].map(i => {
                  const y = String(new Date().getFullYear() - i);
                  return <option key={y} value={y}>{y}</option>;
                })}
              </select>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragging ? 'border-orange-400 bg-orange-50' : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'} ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                <p className="text-sm text-gray-600">Uploading…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-gray-400" />
                <p className="text-sm font-semibold text-gray-700">Drop file here or click to browse</p>
                <p className="text-xs text-gray-400">PDF, JPG, PNG · Max 25MB</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFileChange} />

          {uploadError && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {uploadError}
            </div>
          )}
          {uploadSuccess && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" /> {uploadSuccess}
            </div>
          )}
        </div>

        {/* Uploaded files */}
        {docs.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Uploaded ({docs.length})</h2>
              {allRequired && (
                <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Required docs complete
                </span>
              )}
            </div>
            <ul className="divide-y divide-gray-100">
              {docs.map(doc => (
                <li key={doc.id} className="flex items-center gap-3 px-5 py-3">
                  <FileText className="w-5 h-5 text-orange-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{doc.file_name}</p>
                    <p className="text-xs text-gray-500">{docTypeLabel(doc.document_type)} · {formatBytes(doc.file_size)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${doc.status === 'pending_review' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {doc.status === 'pending_review' ? 'Pending review' : doc.status}
                  </span>
                  <button onClick={() => removeDoc(doc.id)} className="text-gray-300 hover:text-red-400 transition-colors ml-1">
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Continue */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          {allRequired ? (
            <div className="space-y-3">
              <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> All required documents uploaded. You're ready.
              </p>
              <Link
                href="/supersonic-fast-cash/portal"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Go to My Portal <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center">
              Upload your W-2 (or 1099) and a photo ID to continue.
            </p>
          )}
        </div>

        <p className="text-center text-xs text-gray-400">
          Documents are encrypted in transit and at rest · SupersonicFastCash · PTIN-credentialed preparers
        </p>
      </div>
    </div>
  );
}
