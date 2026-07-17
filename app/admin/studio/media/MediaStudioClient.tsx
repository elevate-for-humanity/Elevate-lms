'use client';

import { useState } from 'react';
import { Upload, Image, Video, File, Trash2, Download, Search, Folder } from 'lucide-react';

interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document' | 'other';
  size: number;
  url: string;
  uploaded_at: string;
  folder?: string;
}

export default function MediaStudioClient() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [uploading, setUploading] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/studio/media');
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error('Failed:', err);
    }
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const formData = new FormData();
        formData.append('file', file);
        await fetch('/api/admin/studio/media', { method: 'POST', body: formData });
      }
      fetchFiles();
    } catch (err) {
      console.error('Upload failed:', err);
    }
    setUploading(false);
  };

  const deleteFile = async (id: string) => {
    if (!confirm('Delete this file?')) return;
    try {
      await fetch(`/api/admin/studio/media/${id}`, { method: 'DELETE' });
      setFiles(files.filter(f => f.id !== id));
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-8 h-8 text-green-500" />;
      case 'video': return <Video className="w-8 h-8 text-purple-500" />;
      case 'document': return <File className="w-8 h-8 text-blue-500" />;
      default: return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const filteredFiles = files.filter(f => 
    (filter === 'all' || f.type === filter) &&
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Folder className="w-6 h-6" /> Media Library</h1>
        <div className="flex gap-2">
          <button onClick={fetchFiles} disabled={loading} className="px-4 py-2 bg-slate-100 rounded-lg">Refresh</button>
          <label className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer flex items-center gap-2">
            <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload'}
            <input type="file" multiple onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search files..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
          <option value="all">All Types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="document">Documents</option>
        </select>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredFiles.map(file => (
          <div key={file.id} className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow">
            <div className="aspect-square flex items-center justify-center bg-gray-50 rounded-lg mb-3">
              {getFileIcon(file.type)}
            </div>
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            <div className="flex justify-end gap-1 mt-2">
              <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-400 hover:text-blue-600">
                <Download className="w-4 h-4" />
              </a>
              <button onClick={() => deleteFile(file.id)} className="p-1 text-gray-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
