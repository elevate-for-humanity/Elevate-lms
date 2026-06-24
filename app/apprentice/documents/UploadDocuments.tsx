'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react';

interface DocumentType {
  id: string;
  name: string;
  document_type: string;
}

export default function UploadDocuments({ refreshKey }: { refreshKey?: number }) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch available document types
  useEffect(() => {
    async function fetchDocTypes() {
      try {
        const res = await fetch('/api/apprentice/documents?program=barber-apprenticeship');
        if (res.ok) {
          const data = await res.json();
          setDocumentTypes(data.documentTypes || []);
          if (data.documentTypes?.length > 0) {
            setSelectedDocType(data.documentTypes[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch document types:', err);
      } finally {
        setLoadingTypes(false);
      }
    }
    fetchDocTypes();
  }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    if (!selectedDocType) {
      setError('Please select a document type first');
      return;
    }

    const file = files[0];
    setError(null);
    setSuccess(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentTypeId', selectedDocType);
    formData.append('programSlug', 'barber-apprenticeship');

    try {
      const res = await fetch('/api/apprentice/documents', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      setSuccess('Document uploaded successfully!');
      if (refreshKey !== undefined) {
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Document Type Selector */}
      <div>
        <label htmlFor="doc-type" className="block text-sm font-medium text-slate-700 mb-2">
          Document Type
        </label>
        {loadingTypes ? (
          <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
        ) : documentTypes.length > 0 ? (
          <select
            id="doc-type"
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value)}
            className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
          >
            <option value="">Select document type...</option>
            {documentTypes.map((docType) => (
              <option key={docType.id} value={docType.id}>
                {docType.name || docType.document_type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-slate-500">No document types available</p>
        )}
      </div>

      {/* File Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleUpload(e.dataTransfer.files);
        }}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${dragActive 
            ? 'border-brand-blue-500 bg-brand-blue-50' 
            : 'border-slate-300 hover:border-brand-blue-400 hover:bg-slate-50'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
          disabled={uploading}
        />
        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-brand-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-600">Uploading...</p>
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="font-medium text-slate-700">
              Click to upload or drag and drop
            </p>
            <p className="text-sm text-slate-500 mt-1">
              PDF, JPG, or PNG (max 10MB)
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{success}</p>
        </div>
      )}
    </div>
  );
}
