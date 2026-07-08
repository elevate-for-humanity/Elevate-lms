'use client';

import { useState } from 'react';
import { FileText, Plus, Edit, Trash2, Copy, Eye, Settings } from 'lucide-react';

interface Page {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  template?: string;
}

export default function PageBuilderClient() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/studio/pages');
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages || []);
      }
    } catch (err) {
      console.error('Failed:', err);
    }
    setLoading(false);
  };

  const deletePage = async (id: string) => {
    if (!confirm('Delete this page?')) return;
    try {
      await fetch(`/api/admin/studio/pages/${id}`, { method: 'DELETE' });
      setPages(pages.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  const duplicatePage = async (page: Page) => {
    try {
      await fetch('/api/admin/studio/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...page, id: undefined, title: `${page.title} (Copy)`, slug: `${page.slug}-copy` }),
      });
      fetchPages();
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Published</span>;
      case 'draft': return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">Draft</span>;
      case 'archived': return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Archived</span>;
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6" /> Page Builder</h1>
        <div className="flex gap-2">
          <button onClick={fetchPages} disabled={loading} className="px-4 py-2 bg-slate-100 rounded-lg">Refresh</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Page
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Template</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pages.map(page => (
              <tr key={page.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{page.title}</td>
                <td className="px-4 py-3 font-mono text-sm text-gray-600">/{page.slug}</td>
                <td className="px-4 py-3 text-gray-600">{page.template || '-'}</td>
                <td className="px-4 py-3">{getStatusBadge(page.status)}</td>
                <td className="px-4 py-3 text-gray-600">{page.updated_at}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-1 text-gray-400 hover:text-blue-600"><Eye className="w-4 h-4" /></button>
                    <button className="p-1 text-gray-400 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => duplicatePage(page)} className="p-1 text-gray-400 hover:text-blue-600"><Copy className="w-4 h-4" /></button>
                    <button onClick={() => deletePage(page.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
