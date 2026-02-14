"use client";

import React from 'react';
import Image from 'next/image';
import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Video,
  File,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface UploadFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
}

interface AdvancedFileUploadProps {
  accept?: string;
  maxSize?: number; // MB
  maxFiles?: number;
  onUpload?: (files: File[]) => Promise<void>;
  onComplete?: (urls: string[]) => void;
  folder?: string;
  bucket?: string;
}

export function AdvancedFileUpload({
  accept = '*',
  maxSize = 10,
  maxFiles = 10,
  onUpload,
  onComplete,
  folder = 'uploads',
  bucket = 'media',
}: AdvancedFileUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createFilePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  const handleFiles = useCallback(
    async (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);

      // Check max files
      if (files.length + fileArray.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Validate and create upload files
      const uploadFiles: UploadFile[] = [];

      for (const file of fileArray) {
        // Check file size
        if (file.size > maxSize * 1024 * 1024) {
          alert(`${file.name} is too large. Maximum size is ${maxSize}MB`);
          continue;
        }

        // Create preview for images
        const preview = await createFilePreview(file);

        uploadFiles.push({
          id: crypto.randomUUID(),
          file,
          preview,
          progress: 0,
          status: 'pending',
        });
      }

      setFiles((prev) => [...prev, ...uploadFiles]);

      // Auto-start upload
      uploadFiles.forEach((uploadFile) => {
        uploadSingleFile(uploadFile);
      });
    },
    [files.length, maxFiles, maxSize]
  );

  const uploadSingleFile = async (uploadFile: UploadFile) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
      )
    );

    try {
      const formData = new FormData();
      formData.append('file', uploadFile.file);
      formData.append('folder', folder);
      formData.append('bucket', bucket);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setFiles((prev) =>
            prev.map((f) => (f.id === uploadFile.id ? { ...f, progress } : f))
          );
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, status: 'success', progress: 100, url: response.url }
                : f
            )
          );
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, status: 'error', error: 'Upload failed' }
                : f
            )
          );
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: 'error', error: 'Network error' }
              : f
          )
        );
      });

      xhr.open('POST', '/api/media/upload');
      xhr.send(formData);
    } catch (error) { /* Error handled silently */ 
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: 'error', error: 'Upload failed' }
            : f
        )
      );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const retryUpload = (uploadFile: UploadFile) => {
    uploadSingleFile(uploadFile);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return ImageIcon;
    if (file.type.startsWith('video/')) return Video;
    if (file.type.includes('pdf')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const successCount = files.filter((f) => f.status === 'success').length;
  const errorCount = files.filter((f) => f.status === 'error').length;
  const uploadingCount = files.filter((f) => f.status === 'uploading').length;

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition
          ${
            isDragging
              ? 'border-brand-blue-500 bg-brand-blue-50'
              : 'border-slate-300 hover:border-brand-blue-400 hover:bg-slate-50'
          }
        `}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-slate-400" />
        <p className="text-lg font-medium text-black mb-2">
          Drop files here or click to browse
        </p>
        <p className="text-sm text-slate-500">
          Maximum {maxFiles} files, up to {maxSize}MB each
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Upload Stats */}
      {files.length > 0 && (
        <div className="flex items-center gap-4 text-sm">
          <span className="text-black">
            {files.length} file{files.length !== 1 ? 's' : ''}
          </span>
          {successCount > 0 && (
            <span className="text-green-600">✓ {successCount} uploaded</span>
          )}
          {uploadingCount > 0 && (
            <span className="text-brand-blue-600">↑ {uploadingCount} uploading</span>
          )}
          {errorCount > 0 && (
            <span className="text-red-600">✗ {errorCount} failed</span>
          )}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploadFile) => {
            const FileIcon = getFileIcon(uploadFile.file);

            return (
              <div
                key={uploadFile.id}
                className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg"
              >
                {/* Preview or Icon */}
                <div className="flex-shrink-0">
                  {uploadFile.preview ? (
                    <Image
                      src={uploadFile.preview}
                      alt={uploadFile.file.name}
                      width={48}
                      height={48}
                      className="object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded">
                      <FileIcon className="h-10 w-10 text-slate-400" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">
                    {uploadFile.file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(uploadFile.file.size)}
                  </p>

                  {/* Progress Bar */}
                  {uploadFile.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-blue-500 transition-all duration-300"
                          style={{ width: `${uploadFile.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {uploadFile.progress}%
                      </p>
                    </div>
                  )}

                  {/* Error Message */}
                  {uploadFile.status === 'error' && (
                    <p className="text-xs text-red-600 mt-1">
                      {uploadFile.error}
                    </p>
                  )}
                </div>

                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {uploadFile.status === 'uploading' && (
                    <Loader2 className="h-5 w-5 text-brand-blue-500 animate-spin" />
                  )}
                  {uploadFile.status === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {uploadFile.status === 'error' && (
                    <button
                      onClick={() => retryUpload(uploadFile)}
                      className="text-red-500 hover:text-red-700"
                      title="Retry upload"
                    >
                      <AlertCircle className="h-5 w-5" />
                    </button>
                  )}
                  {uploadFile.status === 'pending' && (
                    <button
                      onClick={() => removeFile(uploadFile.id)}
                      className="text-slate-400 hover:text-black"
                      title="Remove"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Complete Button */}
      {successCount > 0 && successCount === files.length && onComplete && (
        <button
          onClick={() => {
            const urls = files.filter((f) => f.url).map((f) => f.url!);
            onComplete(urls);
          }}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition"
        >
          Complete Upload ({successCount} files)
        </button>
      )}
    </div>
  );
}
