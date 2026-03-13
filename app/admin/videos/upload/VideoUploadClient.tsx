'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Upload, X, CheckCircle, Loader2, Film } from 'lucide-react';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB — matches course-videos bucket
const ACCEPTED_TYPES = ['video/mp4', 'video/webm'];

interface UploadedFile {
  name: string;
  url: string;
  size: number;
}

export default function VideoUploadClient() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const uploadFile = async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(`${file.name}: Only MP4 and WebM files are accepted.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`${file.name}: File exceeds 500MB limit.`);
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `uploads/${timestamp}-${safeName}`;

    const { data, error: uploadError } = await supabase.storage
      .from('course-videos')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('course-videos')
      .getPublicUrl(data.path);

    setUploaded(prev => [...prev, { name: file.name, url: publicUrl, size: file.size }]);
    setUploading(false);
    setProgress(100);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    // Upload one at a time
    uploadFile(files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            dragOver ? 'border-brand-blue-500 bg-brand-blue-50' : 'border-gray-300'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="space-y-3">
              <Loader2 className="w-12 h-12 text-brand-blue-500 mx-auto animate-spin" />
              <p className="text-gray-600">Uploading...</p>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Drag and drop video files here</p>
              <p className="text-sm text-gray-500">MP4, WebM up to 500MB</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700"
              >
                Select Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4 flex items-start gap-3">
          <X className="w-5 h-5 text-brand-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-brand-red-700">{error}</p>
        </div>
      )}

      {/* Uploaded files */}
      {uploaded.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border divide-y">
          <div className="p-4">
            <h3 className="font-medium text-gray-900">Uploaded Videos</h3>
            <p className="text-sm text-gray-500 mt-1">Copy the URL and paste it into a lesson&apos;s video field.</p>
          </div>
          {uploaded.map((file, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <div className="p-2 bg-brand-blue-100 rounded-lg">
                <Film className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-brand-green-500 flex-shrink-0" />
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">{file.url}</p>
              </div>
              <div className="text-sm text-gray-500">{formatSize(file.size)}</div>
              <button
                onClick={() => copyUrl(file.url)}
                className="text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium whitespace-nowrap"
              >
                Copy URL
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
