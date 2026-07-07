'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, Search, Folder, FileText, Video, Image as ImageIcon } from 'lucide-react';

type ContentType = 'all' | 'course' | 'lesson' | 'media' | 'document';

type ContentItem = {
  id: string;
  title: string;
  type: 'course' | 'lesson' | 'media' | 'document';
  parent_id: string | null;
  created_at: string;
  updated_at: string;
};

export default function ContentManagerClient() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ContentType>('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [filter]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('type', filter);
      const res = await fetch(`/api/admin/content?${params}`);
      if (res.ok) {
        const data = await res.json();
        setContent(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch content:', err);
    }
    setLoading(false);
  };

  const deleteContent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;
    try {
      const res = await fetch(`/api/admin/content/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setContent(content.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const filteredContent = content.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course': return <Folder className="w-5 h-5 text-blue-500" />;
      case 'lesson': return <FileText className="w-5 h-5 text-green-500" />;
      case 'media': return <Video className="w-5 h-5 text-purple-500" />;
      case 'document': return <ImageIcon className="w-5 h-5 text-orange-500" />;
      default: return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Content Manager</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Content
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as ContentType)}
          className="px-4 py-2 border border-slate-300 rounded-lg"
        >
          <option value="all">All Types</option>
          <option value="course">Courses</option>
          <option value="lesson">Lessons</option>
          <option value="media">Media</option>
          <option value="document">Documents</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue-600" />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Content</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Updated</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredContent.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No content found
                  </td>
                </tr>
              ) : (
                filteredContent.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(item.type)}
                        <span className="font-medium text-slate-900">{item.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600 capitalize">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {new Date(item.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1 text-slate-400 hover:text-brand-blue-600">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteContent(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
