"use client";

import React from 'react';

import { useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface FileUploadProps {
  label: string;
  accept?: string;
  maxSize?: number; // in MB
  onUpload?: (file: File) => void;
}

export function FileUpload({ label, accept = '*', maxSize = 10, onUpload }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file size
    if (selectedFile.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setUploaded(false);

    // Simulate upload
    if (onUpload) {
      setUploading(true);
      setTimeout(() => {
        onUpload(selectedFile);
        setUploading(false);
        setUploaded(true);
      }, 1500);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setUploaded(false);
    setError(null);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-black">{label}</label>

      {!file ? (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-brand-orange-500 hover:bg-gray-50 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="h-11 w-11 text-slate-400 mb-2" />
            <p className="text-sm text-black">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Max file size: {maxSize}MB
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleFileChange}
          />
        </label>
      ) : (
        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="h-11 w-11 text-brand-orange-600" />
            <div>
              <div className="font-medium text-black">{file.name}</div>
              <div className="text-sm text-black">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {uploading && (
              <div className="text-sm text-brand-orange-600">Uploading...</div>
            )}
            {uploaded && (
              <span className="text-slate-400 flex-shrink-0">•</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-brand-orange-600">{error}</p>
      )}
    </div>
  );
}
