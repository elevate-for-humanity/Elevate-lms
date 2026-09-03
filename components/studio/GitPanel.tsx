'use client';

/**
 * GitPanel — full git workflow panel for Dev Studio.
 *
 * Features:
 * - Branch display + checkout / create branch
 * - Status (changed files with M/A/D/? badges)
 * - Diff viewer (click a file to see its diff)
 * - Stage all + commit with message
 * - Push to origin
 * - Pull (rebase)
 * - Recent commit log
 *
 * Backed by /api/admin/dev-studio/git — runs git commands in /workspaces/Elevate-lms.
 * No Gitpod dependency.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  RefreshCw, GitBranch, GitCommit, GitPullRequest, Upload,
  Download, Plus, Check, AlertCircle, Loader2, ChevronRight,
  ChevronDown, FileText, X,
} from 'lucide-react';

interface ChangedFile { status: string; file: string; }
interface Commit { hash: string; subject: string; author: string; when: string; refs?: string; }
interface GitStatus {
  branch: string;
  changed: ChangedFile[];
  commits: Commit[];
  ahead: number;
  behind: number;
}

type Panel = 'status' | 'log' | 'diff';

const STATUS_COLORS: Record<string, string> = {
  M:  'text-amber-400',
  A:  'text-brand-green-400',
  D:  'text-red-400',
  R:  'text-blue-400',
  '?': 'text-slate-400',
  '!': 'text-slate-500',
};

function StatusBadge({ s }: { s: string }) {
  const color = STATUS_COLORS[s] ?? 'text-slate-400';
  return <span className={`text-[10px] font-bold font-mono w-4 shrink-0 ${color}`}>{s}</span>;
}

export default function GitPanel() {
  const [status, setStatus]         = useState<GitStatus | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [panel, setPanel]           = useState<Panel>('status');
  const [commitMsg, setCommitMsg]   = useState('');
  const [newBranch, setNewBranch]   = useState('');
  const [showBranch, setShowBranch] = useState(false);
  const [diff, setDiff]             = useState('');
  const [diffFile, setDiffFile]     = useState('');
  const [diffLoading, setDiffLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMsg, setActionMsg]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/dev-studio/git?action=status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load git status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function loadDiff(file?: string) {
    setDiffLoading(true);
    setDiff('');
    setDiffFile(file ?? 'all changes');
    setPanel('diff');
    try {
      const url = file
        ? `/api/admin/dev-studio/git?action=diff&file=${encodeURIComponent(file)}`
        : '/api/admin/dev-studio/git?action=diff';
      const res = await fetch(url);
      const json = await res.json();
      setDiff(json.diff ?? '(no diff)');
    } catch {
      setDiff('Failed to load diff');
    } finally {
      setDiffLoading(false);
    }
  }

  async function doAction(action: string, extra?: Record<string, string>) {
    setActionLoading(action);
    setActionMsg('');
    try {
      const res = await fetch('/api/admin/dev-studio/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      if (action === 'commit') {
        setActionMsg(`Committed ${json.hash}: ${json.message}`);
        setCommitMsg('');
      } else if (action === 'push') {
        setActionMsg(`Pushed to origin/${json.branch}`);
      } else if (action === 'pull') {
        setActionMsg('Pulled latest changes');
      } else if (action === 'checkout') {
        setActionMsg(`Switched to ${extra?.branch}`);
        setNewBranch('');
        setShowBranch(false);
      }
      await load();
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  }

  const isLoading = (a: string) => actionLoading === a;

  // Render diff with basic syntax highlighting
  function renderDiff(raw: string) {
    return raw.split('\n').map((line, i) => {
      let cls = 'text-slate-400';
      if (line.startsWith('+') && !line.startsWith('+++')) cls = 'text-brand-green-400 bg-brand-green-900/20';
      else if (line.startsWith('-') && !line.startsWith('---')) cls = 'text-red-400 bg-red-900/20';
      else if (line.startsWith('@@')) cls = 'text-blue-400';
      else if (line.startsWith('diff ') || line.startsWith('index ') || line.startsWith('---') || line.startsWith('+++')) cls = 'text-slate-500';
      return (
        <div key={i} className={`px-2 ${cls} font-mono text-[11px] leading-5 whitespace-pre`}>
          {line || ' '}
        </div>
      );
    });
  }

  return (
    <div className="h-full flex flex-col bg-[#0d1117] text-slate-200 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-white font-mono">
            {status?.branch ?? '…'}
          </span>
          {status && status.ahead > 0 && (
            <span className="text-[10px] text-amber-400 bg-amber-900/30 px-1.5 py-0.5 rounded">
              ↑{status.ahead}
            </span>
          )}
          {status && status.behind > 0 && (
            <span className="text-[10px] text-blue-400 bg-blue-900/30 px-1.5 py-0.5 rounded">
              ↓{status.behind}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowBranch(v => !v)}
            className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-slate-900 transition-colors"
            title="Switch branch"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-slate-900 transition-colors disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Branch switcher */}
      {showBranch && (
        <div className="px-4 py-3 border-b border-white/10 bg-white/5 shrink-0">
          <div className="flex gap-2">
            <input
              value={newBranch}
              onChange={e => setNewBranch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && newBranch.trim() && doAction('checkout', { branch: newBranch.trim() })}
              placeholder="branch name (Enter to checkout/create)"
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => newBranch.trim() && doAction('checkout', { branch: newBranch.trim() })}
              disabled={!newBranch.trim() || isLoading('checkout')}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              {isLoading('checkout') ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Go'}
            </button>
          </div>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex border-b border-white/10 shrink-0">
        {(['status', 'log', 'diff'] as Panel[]).map(p => (
          <button
            key={p}
            onClick={() => { setPanel(p); if (p === 'diff' && !diff) loadDiff(); }}
            className={`px-4 py-2 text-xs font-medium capitalize transition-colors ${
              panel === p
                ? 'text-white border-b-2 border-blue-500'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {p === 'status' && status?.changed.length
              ? `Changes (${status.changed.length})`
              : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Action message */}
      {actionMsg && (
        <div className="mx-4 mt-2 flex items-center justify-between text-xs text-amber-400 bg-amber-900/20 border border-amber-800/40 rounded-lg px-3 py-2 shrink-0">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg('')}><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto">

        {/* STATUS panel */}
        {panel === 'status' && (
          <div className="p-4 space-y-4">
            {loading && !status && (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-8 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            )}

            {/* Changed files */}
            {status && status.changed.length === 0 && (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-6 justify-center">
                <Check className="w-4 h-4 text-brand-green-500" /> Working tree clean
              </div>
            )}

            {status && status.changed.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    {status.changed.length} changed file{status.changed.length !== 1 ? 's' : ''}
                  </p>
                  <button
                    onClick={() => loadDiff()}
                    className="text-[10px] text-blue-400 hover:text-blue-300"
                  >
                    View all diffs
                  </button>
                </div>
                <div className="space-y-0.5">
                  {status.changed.map(f => (
                    <button
                      key={f.file}
                      onClick={() => loadDiff(f.file)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 text-left group"
                    >
                      <StatusBadge s={f.status} />
                      <FileText className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="text-xs text-slate-300 truncate flex-1 font-mono">{f.file}</span>
                      <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Commit */}
            {status && status.changed.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Commit</p>
                <textarea
                  value={commitMsg}
                  onChange={e => setCommitMsg(e.target.value)}
                  placeholder="Commit message…"
                  rows={2}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                />
                <button
                  onClick={() => doAction('commit', { message: commitMsg })}
                  disabled={!commitMsg.trim() || isLoading('commit')}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium bg-brand-green-600 text-white rounded-lg hover:bg-brand-green-700 disabled:opacity-40 transition-colors"
                >
                  {isLoading('commit') ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitCommit className="w-3.5 h-3.5" />}
                  Commit all changes
                </button>
              </div>
            )}

            {/* Push / Pull */}
            {status && (
              <div className="flex gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => doAction('push')}
                  disabled={isLoading('push') || status.ahead === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg disabled:opacity-40 transition-colors"
                >
                  {isLoading('push') ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Push {status.ahead > 0 ? `(${status.ahead})` : ''}
                </button>
                <button
                  onClick={() => doAction('pull')}
                  disabled={isLoading('pull')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 rounded-lg disabled:opacity-40 transition-colors"
                >
                  {isLoading('pull') ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Pull {status.behind > 0 ? `(${status.behind})` : ''}
                </button>
              </div>
            )}
          </div>
        )}

        {/* LOG panel */}
        {panel === 'log' && (
          <div className="p-4">
            {status?.commits.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-8">No commits</p>
            )}
            <div className="space-y-0.5">
              {status?.commits.map(c => (
                <div key={c.hash} className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-white/5">
                  <GitCommit className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-200 truncate">{c.subject}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      <span className="font-mono text-slate-400">{c.hash}</span>
                      {' · '}{c.author}{' · '}{c.when}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DIFF panel */}
        {panel === 'diff' && (
          <div className="h-full flex flex-col">
            <div className="px-4 py-2 border-b border-white/10 shrink-0 flex items-center justify-between">
              <p className="text-[10px] text-slate-500 font-mono truncate">{diffFile || 'all changes'}</p>
              {diffLoading && <Loader2 className="w-3 h-3 animate-spin text-slate-500" />}
            </div>
            <div className="flex-1 overflow-auto bg-[#0a0e14]">
              {diffLoading
                ? <div className="flex items-center justify-center py-12 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin mr-2" />Loading diff…</div>
                : diff
                  ? <div className="py-2">{renderDiff(diff)}</div>
                  : <p className="text-xs text-slate-500 text-center py-12">No diff available</p>
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
