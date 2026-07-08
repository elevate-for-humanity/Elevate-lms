'use client';

import { useState } from 'react';
import { Upload, Video, X, Play } from 'lucide-react';

interface VideoUpload {
  id: string;
  title: string;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  progress: number;
  url?: string;
}

export default function VideoUploadClient() {
  const [uploads, setUploads] = useState<VideoUpload[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    for (const file of Array.from(files)) {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      setUploads(prev => [...prev, { id: tempId, title: file.name, status: 'uploading', progress: 0 }]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
        
        const res = await fetch('/api/admin/videos/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (res.ok) {
          const data = await res.json();
          setUploads(prev => prev.map(u => u.id === tempId ? { ...u, id: data.id, status: 'processing', url: data.url } : u));
        } else {
          setUploads(prev => prev.map(u => u.id === tempId ? { ...u, status: 'failed' } : u));
        }
      } catch (err) {
        console.error('Upload failed:', err);
        setUploads(prev => prev.map(u => u.id === tempId ? { ...u, status: 'failed' } : u));
      }
    }
    setUploading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'uploading': return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Uploading</span>;
      case 'processing': return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">Processing</span>;
      case 'ready': return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Ready</span>;
      case 'failed': return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Failed</span>;
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Video className="w-6 h-6" /> Video Upload</h1>
        <label className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer flex items-center gap-2 hover:bg-blue-700">
          <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload Video'}
          <input type="file" accept="video/*" multiple onChange={handleUpload} className="hidden" disabled={uploading} />
        </label>
      </div>
      <div className="bg-white rounded-lg border p-6">
        <p className="text-gray-600 mb-4">Supported formats: MP4, MOV, AVI, WebM. Max file size: 2GB</p>
      </div>
      <div className="space-y-4">
        {uploads.map(upload => (
          <div key={upload.id} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Video className="w-8 h-8 text-gray-400" />
                <div>
                  <p className="font-medium">{upload.title}</p>
                  <p className="text-sm text-gray-500">{getStatusBadge(upload.status)}</p>
                </div>
              </div>
              {upload.status === 'uploading' && (
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${upload.progress}%` }} />
                </div>
              )}
              {upload.status === 'ready' && upload.url && (
                <a href={upload.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1 text-sm bg-green-600 text-white rounded flex items-center gap-1">
                  <Play className="w-4 h-4" /> View
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
