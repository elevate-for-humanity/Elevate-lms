'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Upload } from 'lucide-react';
import { getDocumentUploadGuidance } from './document-guidance';

interface DocumentType {
  id: string;
  name: string;
  document_type: string;
  description?: string | null;
}

export default function UploadDocuments({ programSlug }: { programSlug: string }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] = useState('');
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedRequirement = documentTypes.find((document) => document.id === selectedDocType);
  const selectedGuidance = selectedRequirement
    ? getDocumentUploadGuidance(selectedRequirement)
    : null;

  useEffect(() => {
    let cancelled = false;
    async function fetchDocTypes() {
      setLoadingTypes(true);
      setError(null);
      try {
        const res = await fetch(`/api/apprentice/documents?program=${encodeURIComponent(programSlug)}`, { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Unable to load document requirements');
        if (cancelled) return;
        const types = Array.isArray(data.documentTypes) ? data.documentTypes : [];
        setDocumentTypes(types);
        setSelectedDocType(types[0]?.id || '');
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load document requirements');
      } finally {
        if (!cancelled) setLoadingTypes(false);
      }
    }
    fetchDocTypes();
    return () => { cancelled = true; };
  }, [programSlug]);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    if (!selectedDocType) {
      setError('Select a document type first.');
      return;
    }

    const file = files[0];
    setError(null);
    setSuccess(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentTypeId', selectedDocType);
    formData.append('programSlug', programSlug);

    try {
      const res = await fetch('/api/apprentice/documents', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setSuccess('Document uploaded and sent for review.');
      // Refresh server-rendered document status without rebooting the entire LMS.
      // A hard reload flashes the global loading shell and resets the portal UI.
      setTimeout(() => router.refresh(), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="doc-type" className="mb-2 block text-sm font-bold text-slate-800">Document type</label>
        {loadingTypes ? (
          <div className="h-11 animate-pulse rounded-lg bg-slate-100" />
        ) : documentTypes.length ? (
          <select id="doc-type" value={selectedDocType} onChange={(e) => setSelectedDocType(e.target.value)} className="h-11 w-full rounded-lg border border-slate-300 px-3 focus:border-blue-700 focus:ring-2 focus:ring-blue-100">
            {documentTypes.map((docType) => (
              <option key={docType.id} value={docType.id}>{docType.name || docType.document_type.replace(/_/g, ' ')}</option>
            ))}
          </select>
        ) : (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-900">No document requirements are configured for this apprenticeship.</p>
        )}
        {selectedGuidance ? (
          <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
            <p className="font-black">What to upload</p>
            <p className="mt-1">{selectedGuidance}</p>
          </div>
        ) : null}
      </div>

      <div
        onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); void handleUpload(e.dataTransfer.files); }}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${dragActive ? 'border-blue-600 bg-blue-50' : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50'} ${uploading ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => void handleUpload(e.target.files)} className="hidden" disabled={uploading || !documentTypes.length} />
        <Upload className="mx-auto mb-3 h-10 w-10 text-slate-400" />
        <p className="font-bold text-slate-800">{uploading ? 'Uploading…' : 'Click to upload or drag and drop'}</p>
        <p className="mt-1 text-sm text-slate-600">PDF, JPG, JPEG, or PNG. The selected requirement controls the maximum file size.</p>
      </div>

      {error ? <div role="alert" className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-900"><AlertCircle className="h-5 w-5 shrink-0" /><p className="text-sm font-bold">{error}</p></div> : null}
      {success ? <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-green-900"><CheckCircle className="h-5 w-5 shrink-0" /><p className="text-sm font-bold">{success}</p></div> : null}
    </div>
  );
}
