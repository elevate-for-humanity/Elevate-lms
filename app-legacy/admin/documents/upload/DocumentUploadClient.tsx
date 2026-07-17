'use client';

import { useState } from 'react';
import { Upload, Loader2, FileText, X, CheckCircle } from 'lucide-react';

interface DocumentUploadClientProps {
  maxSizeMB?: number;
  acceptedTypes?: string[];
}

export function DocumentUploadClient({ 
  maxSizeMB = 10, 
  acceptedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'] 
}: DocumentUploadClientProps) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    validateAndAdd(dropped);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndAdd(Array.from(e.target.files));
    }
  };

  const validateAndAdd = (newFiles: File[]) => {
    setError('');
    const validFiles: File[] = [];
    for (const file of newFiles) {
      if (!acceptedTypes.includes(file.type)) {
        setError(`Invalid file type: ${file.name}`);
        continue;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File too large: ${file.name} (max ${maxSizeMB}MB)`);
        continue;
      }
      validFiles.push(file);
    }
    setFiles([...files, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setError('');

    const uploadedUrls: string[] = [];
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/admin/documents/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          uploadedUrls.push(data.url || file.name);
        }
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }

    setUploaded(uploadedUrls);
    setFiles([]);
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      {uploaded.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-700 mb-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{uploaded.length} files uploaded successfully!</span>
          </div>
          <ul className="text-sm text-green-600 space-y-1">
            {uploaded.map((name, i) => (
              <li key={i}>{name}</li>
            ))}
          </ul>
        </div>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition"
      >
        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600 mb-2">Drag and drop files here, or click to select</p>
        <p className="text-sm text-slate-400 mb-4">
          Max {maxSizeMB}MB per file. Accepted: PDF, PNG, JPG, WEBP
        </p>
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="inline-block px-4 py-2 bg-brand-blue-600 text-white rounded-lg cursor-pointer hover:bg-brand-blue-700"
        >
          Select Files
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-700">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500">
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}

          <button
            onClick={uploadFiles}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            {uploading ? 'Uploading...' : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}
    </div>
  );
}
