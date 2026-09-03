'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { CheckCircle2, MessageSquarePlus, RefreshCw } from 'lucide-react';

type StudioComment = {
  id: string;
  file_path: string;
  branch: string | null;
  line_start: number;
  line_end: number | null;
  content: string;
  resolved: boolean;
  created_at: string;
};

export default function CollaborationClient() {
  const [comments, setComments] = useState<StudioComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filePath, setFilePath] = useState('');
  const [lineStart, setLineStart] = useState('1');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/dev-studio/collaboration?resolved=false', { cache: 'no-store' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
      setComments(Array.isArray(body.comments) ? body.comments : []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collaboration comments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function createComment(event: FormEvent) {
    event.preventDefault();
    if (!filePath.trim() || !content.trim()) return;
    setSaving(true);
    try {
      const response = await fetch('/api/admin/dev-studio/collaboration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: filePath.trim(), lineStart: Number(lineStart || 1), content: content.trim(), branch: 'main' }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
      setFilePath('');
      setLineStart('1');
      setContent('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create comment');
    } finally {
      setSaving(false);
    }
  }

  async function resolveComment(id: string) {
    const response = await fetch('/api/admin/dev-studio/collaboration', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, resolved: true }),
    });
    if (response.ok) await load();
  }

  return (
    <main className="p-4 text-slate-950 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Studio Collaboration</h1>
            <p className="mt-1 text-sm text-slate-600">Governed review comments stored in the canonical Admin Studio data contract.</p>
          </div>
          <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <form onSubmit={createComment} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_100px_2fr_auto]">
          <input aria-label="File path" value={filePath} onChange={(event) => setFilePath(event.target.value)} placeholder="components/example.tsx" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:ring-2 focus:ring-cyan-700" />
          <input aria-label="Start line" value={lineStart} onChange={(event) => setLineStart(event.target.value)} type="number" min="1" placeholder="Line" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:ring-2 focus:ring-cyan-700" />
          <input aria-label="Review comment" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Review comment" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:ring-2 focus:ring-cyan-700" />
          <button disabled={saving || !filePath.trim() || !content.trim()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-50">
            <MessageSquarePlus className="h-4 w-4" /> Add
          </button>
        </form>

        {error && <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

        <div className="space-y-3">
          {!loading && comments.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">No unresolved Studio comments.</div>}
          {comments.map((comment) => (
            <article key={comment.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs font-semibold text-cyan-800">{comment.file_path}:{comment.line_start}{comment.line_end ? `-${comment.line_end}` : ''}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-800">{comment.content}</p>
                  <p className="mt-2 text-xs text-slate-600">{comment.branch || 'main'} · {new Date(comment.created_at).toLocaleString()}</p>
                </div>
                <button onClick={() => void resolveComment(comment.id)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100">
                  <CheckCircle2 className="h-4 w-4" /> Resolve
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
