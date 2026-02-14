"use client";

import React from 'react';

import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { Upload, FileText, Download, Trash2 } from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

interface DashboardUploadProps {
  dashboardType: string;
  title?: string;
  description?: string;
  accept?: string;
  maxSize?: number;
  folder?: string;
}

export function DashboardUpload({
  dashboardType,
  title = 'Upload Documents',
  description = 'Upload files related to this dashboard',
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls',
  maxSize = 10,
  folder,
}: DashboardUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder || dashboardType);
      formData.append('bucket', 'media');

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.ok) {
        const newFile: UploadedFile = {
          id: crypto.randomUUID(),
          name: file.name,
          url: data.url,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        };

        setFiles([...files, newFile]);

        // Save to database
        await saveToDatabase(newFile);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const saveToDatabase = async (file: UploadedFile) => {
    try {
      await fetch('/api/uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboard_type: dashboardType,
          file_name: file.name,
          file_url: file.url,
          file_size: file.size,
          file_type: file.type,
        }),
      });
    } catch (error) { /* Error handled silently */ }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    setFiles(files.filter((f) => f.id !== fileId));
      };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-brand-blue-50 rounded-lg">
          <Upload className="h-5 w-5 text-brand-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-black">{title}</h3>
          <p className="text-sm text-black">{description}</p>
        </div>
      </div>

      {/* Upload Component */}
      <div className="mb-6">
        <FileUpload
          label="Select File"
          accept={accept}
          maxSize={maxSize}
          onUpload={handleUpload}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Uploading State */}
      {uploading && (
        <div className="mb-4 bg-brand-blue-50 border border-brand-blue-200 text-brand-blue-700 px-4 py-3 rounded">
          Uploading file...
        </div>
      )}

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-black mb-3">
            Uploaded Files ({files.length})
          </h4>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-black truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(file.size)} •{' '}
                      {formatDate(file.uploadedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-brand-blue-600 hover:bg-gray-50 rounded transition"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {files.length === 0 && !uploading && (
        <div className="text-center py-8 text-slate-500">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No files uploaded yet</p>
        </div>
      )}
    </div>
  );
}
