'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FileText, Plus, Pencil, Trash2, Eye, Globe, Archive,
  RefreshCw, CheckCircle, XCircle, Loader2,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

type PageStatus = 'published' | 'draft' | 'archived';

type Page = {
  id: string;
  slug: string;
  title: string | null;
  status: PageStatus;
  meta_title: string | null;
  meta_desc: string | null;
};

type Toast = { type: 'success' | 'error'; message: string };

const STATUS_COLORS: Record<PageStatus, string> = {
  published: 'bg-green-950/40 border-green-800 text-green-300',
  draft:     'bg-amber-950/40 border-amber-800 text-amber-300',
  archived:  'bg-slate-800 border-slate-700 text-slate-400',
};

const STATUS_ICONS: Record<PageStatus, React.ElementType> = {
  published: Globe,
  draft:     Pencil,
  archived:  Archive,
};

// ─── New / Edit form ──────────────────────────────────────────────────────────

function PageForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<Page>;
  onSave: (data: Omit<Page, 'id'>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [slug, setSlug]           = useState(initial?.slug ?? '');
  const [title, setTitle]         = useState(initial?.title ?? '');
  const [status, setStatus]       = useState<PageStatus>(initial?.status ?? 'draft');
  const [metaTitle, setMetaTitle] = useState(initial?.meta_title ?? '');
  const [metaDesc, setMetaDesc]   = useState(initial?.meta_desc ?? '');

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4">
      <h3 className="text-white font-semibold">{initial?.id ? 'Edit Page' : 'New Page'}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-400 text-xs mb-1">Slug <span className="text-red-400">*</span></label>
          <input
            value={slug}
            onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-/]/g, ''))}
            placeholder="about/team"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-blue-500"
          />
          <p className="text-slate-600 text-xs mt-1">URL path, e.g. <code>about/team</code></p>
        </div>
        <div>
          <label className="block text-slate-400 text-xs mb-1">Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="About Our Team"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-blue-500"
          />
        </div>
        <div>
          <label className="block text-slate-400 text-xs mb-1">Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as PageStatus)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <label className="block text-slate-400 text-xs mb-1">Meta Title</label>
          <input
            value={metaTitle}
            onChange={e => setMetaTitle(e.target.value)}
            placeholder="SEO title (optional)"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-slate-400 text-xs mb-1">Meta Description</label>
          <textarea
            value={metaDesc}
            onChange={e => setMetaDesc(e.target.value)}
            rows={2}
            placeholder="SEO description (optional)"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-blue-500 resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => onSave({ slug, title: title || null, status, meta_title: metaTitle || null, meta_desc: metaDesc || null })}
          disabled={saving || !slug.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
          {initial?.id ? 'Save Changes' : 'Create Page'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PageBuilderClient() {
  const [pages, setPages]         = useState<Page[]>([]);
  const [loading, setLoading]     = useState(true);
  const [creating, setCreating]   = useState(false);
  const [editing, setEditing]     = useState<Page | null>(null);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [toast, setToast]         = useState<Toast | null>(null);
  const [filter, setFilter]       = useState<PageStatus | 'all'>('all');

  const showToast = (type: Toast['type'], message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/page-builder/pages');
      if (res.ok) setPages(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data: Omit<Page, 'id'>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/page-builder/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        showToast('success', `Page "/${data.slug}" created`);
        setCreating(false);
        await load();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast('error', err.error ?? 'Failed to create page');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (data: Omit<Page, 'id'>) => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/page-builder/pages/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        showToast('success', 'Page updated');
        setEditing(null);
        await load();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast('error', err.error ?? 'Failed to update page');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (page: Page) => {
    if (!confirm(`Delete page "/${page.slug}"? This cannot be undone.`)) return;
    setDeleting(page.id);
    try {
      const res = await fetch(`/api/page-builder/pages/${page.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('success', `Page "/${page.slug}" deleted`);
        await load();
      } else {
        showToast('error', 'Failed to delete page');
      }
    } finally {
      setDeleting(null);
    }
  };

  const filtered = filter === 'all' ? pages : pages.filter(p => p.status === filter);
  const counts = {
    all:       pages.length,
    published: pages.filter(p => p.status === 'published').length,
    draft:     pages.filter(p => p.status === 'draft').length,
    archived:  pages.filter(p => p.status === 'archived').length,
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Page Builder' }]} />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Page Builder</h1>
            <p className="text-slate-400 text-sm mt-0.5">Create and manage public-facing pages</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={load} className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-400 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setCreating(true); setEditing(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Page
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm ${
            toast.type === 'success'
              ? 'bg-green-950/40 border-green-800 text-green-300'
              : 'bg-red-950/40 border-red-800 text-red-300'
          }`}>
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
            {toast.message}
          </div>
        )}

        {/* Create form */}
        {creating && (
          <PageForm
            onSave={handleCreate}
            onCancel={() => setCreating(false)}
            saving={saving}
          />
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'published', 'draft', 'archived'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filter === f
                  ? 'bg-brand-blue-600 border-brand-blue-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>

        {/* Pages list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
            <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400">No pages yet</p>
            <button
              onClick={() => setCreating(true)}
              className="mt-4 px-4 py-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              Create your first page
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(page => {
              const StatusIcon = STATUS_ICONS[page.status];
              return editing?.id === page.id ? (
                <PageForm
                  key={page.id}
                  initial={page}
                  onSave={handleUpdate}
                  onCancel={() => setEditing(null)}
                  saving={saving}
                />
              ) : (
                <div key={page.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${STATUS_COLORS[page.status]}`}>
                        <StatusIcon className="w-3 h-3" />
                        {page.status}
                      </span>
                      <code className="text-slate-300 text-sm">/{page.slug}</code>
                    </div>
                    {page.title && <p className="text-slate-400 text-xs truncate">{page.title}</p>}
                    {page.meta_desc && <p className="text-slate-600 text-xs truncate mt-0.5">{page.meta_desc}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {page.status === 'published' && (
                      <a
                        href={`/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                        title="View live page"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => { setEditing(page); setCreating(false); }}
                      className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(page)}
                      disabled={deleting === page.id}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deleting === page.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-slate-600 text-xs">
          Pages are rendered at <code>/{'{slug}'}</code> on the public site.
          Use <Link href="/admin/content" className="text-brand-blue-400 hover:underline">Content Management</Link> to edit team members and partners.
        </p>
      </div>
    </div>
  );
}
