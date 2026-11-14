'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FileText, Plus, Pencil, Trash2, Eye, Globe, Archive, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

type PageStatus = 'published' | 'draft' | 'archived';
type PageRow = { id: string; slug: string; title: string | null; status: PageStatus; meta_title: string | null; meta_desc: string | null };
type Toast = { type: 'success' | 'error'; message: string };

const STATUS_COLORS: Record<PageStatus, string> = {
  published: 'bg-green-950/40 border-green-800 text-green-300',
  draft: 'bg-amber-950/40 border-amber-800 text-amber-300',
  archived: 'bg-slate-800 border-slate-700 text-slate-400',
};
const STATUS_ICONS: Record<PageStatus, React.ElementType> = { published: Globe, draft: Pencil, archived: Archive };

function PageForm({ initial, onSave, onCancel, saving }: { initial?: Partial<PageRow>; onSave: (data: Omit<PageRow, 'id'>) => void; onCancel: () => void; saving: boolean }) {
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [status, setStatus] = useState<PageStatus>(initial?.status ?? 'draft');
  const [metaTitle, setMetaTitle] = useState(initial?.meta_title ?? '');
  const [metaDesc, setMetaDesc] = useState(initial?.meta_desc ?? '');
  return <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-900 p-6">
    <h3 className="font-semibold text-white">{initial?.id ? 'Edit Page' : 'New Page'}</h3>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <label className="block"><span className="mb-1 block text-xs text-slate-400">Slug *</span><input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-/]/g, ''))} placeholder="about/team" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" /></label>
      <label className="block"><span className="mb-1 block text-xs text-slate-400">Title</span><input value={title ?? ''} onChange={e => setTitle(e.target.value)} placeholder="About Our Team" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" /></label>
      <label className="block"><span className="mb-1 block text-xs text-slate-400">Status</span><select value={status} onChange={e => setStatus(e.target.value as PageStatus)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
      <label className="block"><span className="mb-1 block text-xs text-slate-400">Meta Title</span><input value={metaTitle ?? ''} onChange={e => setMetaTitle(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" /></label>
      <label className="block md:col-span-2"><span className="mb-1 block text-xs text-slate-400">Meta Description</span><textarea value={metaDesc ?? ''} onChange={e => setMetaDesc(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" /></label>
    </div>
    <div className="flex gap-3"><button onClick={() => onSave({ slug, title: title || null, status, meta_title: metaTitle || null, meta_desc: metaDesc || null })} disabled={saving || !slug.trim()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">{saving ? 'Saving…' : initial?.id ? 'Save Changes' : 'Create Page'}</button><button onClick={onCancel} className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300">Cancel</button></div>
  </div>;
}

export default function PageBuilderClient() {
  const [pages, setPages] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<PageRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [filter, setFilter] = useState<PageStatus | 'all'>('all');
  const showToast = (type: Toast['type'], message: string) => { setToast({ type, message }); setTimeout(() => setToast(null), 4000); };
  const load = useCallback(async () => { setLoading(true); try { const res = await fetch('/api/page-builder/pages'); if (res.ok) setPages(await res.json()); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);

  async function handleCreate(data: Omit<PageRow, 'id'>) { setSaving(true); try { const res = await fetch('/api/page-builder/pages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (res.ok) { showToast('success', `Page /${data.slug} created`); setCreating(false); await load(); } else showToast('error', (await res.json().catch(() => ({}))).error ?? 'Failed to create page'); } finally { setSaving(false); } }
  async function handleUpdate(data: Omit<PageRow, 'id'>) { if (!editing) return; setSaving(true); try { const res = await fetch(`/api/page-builder/pages/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (res.ok) { showToast('success', 'Page updated'); setEditing(null); await load(); } else showToast('error', (await res.json().catch(() => ({}))).error ?? 'Failed to update page'); } finally { setSaving(false); } }
  async function handleDelete(page: PageRow) { if (!confirm(`Delete page /${page.slug}?`)) return; setDeleting(page.id); try { const res = await fetch(`/api/page-builder/pages/${page.id}`, { method: 'DELETE' }); if (res.ok) { showToast('success', `Page /${page.slug} deleted`); await load(); } else showToast('error', 'Failed to delete page'); } finally { setDeleting(null); } }

  const filtered = filter === 'all' ? pages : pages.filter(p => p.status === filter);
  const counts = { all: pages.length, published: pages.filter(p => p.status === 'published').length, draft: pages.filter(p => p.status === 'draft').length, archived: pages.filter(p => p.status === 'archived').length };

  return <div className="min-h-screen bg-slate-950 p-6"><div className="mx-auto max-w-5xl space-y-6">
    <Breadcrumbs items={[{ label: 'Admin', href: '/dashboard' }, { label: 'Website Editor', href: '/website-editor' }, { label: 'Pages' }]} />
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-white">Page Manager</h1><p className="mt-0.5 text-sm text-slate-400">Create, publish, archive and manage public pages.</p></div><div className="flex gap-3"><button onClick={() => void load()} className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-400"><RefreshCw className="h-4 w-4" /></button><button onClick={() => { setCreating(true); setEditing(null); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"><Plus className="h-4 w-4" />New Page</button></div></div>
    {toast && <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${toast.type === 'success' ? 'border-green-800 bg-green-950/40 text-green-300' : 'border-red-800 bg-red-950/40 text-red-300'}`}>{toast.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}{toast.message}</div>}
    {creating && <PageForm onSave={handleCreate} onCancel={() => setCreating(false)} saving={saving} />}
    <div className="flex flex-wrap gap-2">{(['all', 'published', 'draft', 'archived'] as const).map(f => <button key={f} onClick={() => setFilter(f)} className={`rounded-lg border px-3 py-1.5 text-xs ${filter === f ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>{f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})</button>)}</div>
    {loading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-500" /></div> : filtered.length === 0 ? <div className="rounded-xl border border-slate-800 bg-slate-900 py-16 text-center text-slate-400"><FileText className="mx-auto mb-3 h-10 w-10" />No pages yet</div> : <div className="space-y-2">{filtered.map(page => { const StatusIcon = STATUS_ICONS[page.status]; return editing?.id === page.id ? <PageForm key={page.id} initial={page} onSave={handleUpdate} onCancel={() => setEditing(null)} saving={saving} /> : <div key={page.id} className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4"><div className="min-w-0 flex-1"><div className="mb-1 flex items-center gap-2"><span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs ${STATUS_COLORS[page.status]}`}><StatusIcon className="h-3 w-3" />{page.status}</span><code className="text-sm text-slate-300">/{page.slug}</code></div>{page.title && <p className="truncate text-xs text-slate-400">{page.title}</p>}</div><div className="flex gap-2">{page.status === 'published' && <a href={`https://www.elevateforhumanity.org/${page.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-500 hover:text-slate-300"><Eye className="h-4 w-4" /></a>}<button onClick={() => { setEditing(page); setCreating(false); }} className="p-1.5 text-slate-500 hover:text-slate-300"><Pencil className="h-4 w-4" /></button><button onClick={() => void handleDelete(page)} disabled={deleting === page.id} className="p-1.5 text-slate-500 hover:text-red-400 disabled:opacity-50">{deleting === page.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button></div></div>; })}</div>}
    <p className="text-xs text-slate-600">Use <Link href="/website-editor" className="text-blue-400 hover:underline">Website Editor</Link> for hero and CTA content.</p>
  </div></div>;
}
