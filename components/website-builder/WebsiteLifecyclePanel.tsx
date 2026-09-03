'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArchiveRestore, BarChart3, EyeOff, MonitorSmartphone, Trash2, Users } from 'lucide-react';

type Revision = {
  id: string;
  site_name: string | null;
  subdomain: string | null;
  is_published: boolean;
  reason: string;
  created_at: string;
};

export function WebsiteLifecyclePanel({
  websiteId,
  isPublished,
}: {
  websiteId: string;
  isPublished: boolean;
}) {
  const [published, setPublished] = useState(isPublished);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function loadRevisions() {
    try {
      const response = await fetch(`/api/apps/website-builder/sites/${websiteId}/revisions`);
      if (!response.ok) return;
      const data = await response.json();
      setRevisions(Array.isArray(data.revisions) ? data.revisions : []);
    } catch {
      // Revision history is a recovery enhancement; editor remains usable.
    }
  }

  useEffect(() => { void loadRevisions(); }, [websiteId]);

  async function unpublish() {
    if (!confirm('Take this website offline? You can publish it again later.')) return;
    setBusy(true); setError(''); setInfo('');
    try {
      const response = await fetch(`/api/apps/website-builder/sites/${websiteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publish: false }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not unpublish website');
      setPublished(false);
      setInfo('Website is now offline. Your draft and domain settings were preserved.');
      await loadRevisions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not unpublish website');
    } finally { setBusy(false); }
  }

  async function restore(revisionId: string) {
    if (!confirm('Restore this saved version? The current version will be saved first so you can undo the restore.')) return;
    setBusy(true); setError(''); setInfo('');
    try {
      const response = await fetch(`/api/apps/website-builder/sites/${websiteId}/revisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisionId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not restore version');
      setPublished(Boolean(data.website?.is_published));
      setInfo('Version restored. Reloading the editor…');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not restore version');
      setBusy(false);
    }
  }

  async function removeSite() {
    const confirmation = window.prompt('Deleting a website removes its site data, leads, analytics, revisions, and connected-domain records. Type DELETE to continue.');
    if (confirmation !== 'DELETE') return;
    setBusy(true); setError(''); setInfo('');
    try {
      const response = await fetch(`/api/apps/website-builder/sites/${websiteId}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not delete website');
      window.location.assign('/apps/website-builder');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete website');
      setBusy(false);
    }
  }

  return (
    <section className="border-b border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-4">
        {(error || info) ? (
          <div className={`mb-3 rounded-xl border px-4 py-3 text-sm font-semibold ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
            {error || info}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Link href={`/apps/website-builder/edit/${websiteId}/preview`} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800">
              <MonitorSmartphone className="h-4 w-4" /> Responsive preview
            </Link>
            <Link href={`/apps/website-builder/edit/${websiteId}/leads`} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800">
              <Users className="h-4 w-4" /> Leads
            </Link>
            <Link href={`/apps/website-builder/edit/${websiteId}/analytics`} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800">
              <BarChart3 className="h-4 w-4" /> Analytics
            </Link>
            {published ? (
              <button type="button" disabled={busy} onClick={() => void unpublish()} className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-900 disabled:opacity-50">
                <EyeOff className="h-4 w-4" /> Unpublish
              </button>
            ) : null}
          </div>
          <button type="button" disabled={busy} onClick={() => void removeSite()} className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-50">
            <Trash2 className="h-4 w-4" /> Delete website
          </button>
        </div>

        {revisions.length ? (
          <details className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer font-black text-slate-900">Version history ({revisions.length})</summary>
            <div className="mt-3 max-h-72 space-y-2 overflow-auto">
              {revisions.map((revision) => (
                <div key={revision.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-3 text-sm">
                  <div>
                    <p className="font-bold text-slate-800">{revision.reason.replaceAll('_', ' ')} · {revision.is_published ? 'published' : 'draft'}</p>
                    <p className="text-xs text-slate-500">{new Date(revision.created_at).toLocaleString()}</p>
                  </div>
                  <button type="button" disabled={busy} onClick={() => void restore(revision.id)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 disabled:opacity-50">
                    <ArchiveRestore className="h-4 w-4" /> Restore
                  </button>
                </div>
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </section>
  );
}
