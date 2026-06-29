'use client';

import { useEffect, useState, useCallback } from 'react';
import { DatabaseBackup, RotateCcw, RefreshCw, AlertTriangle, CheckCircle, Clock, Filter } from 'lucide-react';

type Snapshot = {
  id: string;
  snapshot_type: string;
  label: string;
  trigger_type: string;
  rolled_back: boolean;
  created_at: string;
};

const TYPE_LABELS: Record<string, string> = {
  pre_migration:    'Pre-Migration',
  pre_deploy:       'Pre-Deploy',
  pre_config_change:'Pre-Config',
  manual:           'Manual',
};

const TYPE_COLORS: Record<string, string> = {
  pre_migration:    'bg-amber-900/40 text-amber-300 border-amber-700',
  pre_deploy:       'bg-blue-900/40 text-blue-300 border-blue-700',
  pre_config_change:'bg-purple-900/40 text-purple-300 border-purple-700',
  manual:           'bg-slate-700/40 text-slate-300 border-slate-600',
};

export default function SnapshotsClient() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [rolling, setRolling] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = filter !== 'all' ? `?type=${filter}` : '?limit=50';
      const res = await fetch(`/api/devstudio/snapshot${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load snapshots');
      setSnapshots(data.snapshots ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load snapshots');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleRollback = async (snapshot: Snapshot) => {
    if (confirmText !== 'CONFIRM ROLLBACK') {
      setError('Type CONFIRM ROLLBACK exactly to proceed.');
      return;
    }

    setRolling(snapshot.id);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/devstudio/snapshot/${snapshot.id}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rollback failed');
      setSuccess(`Rollback executed: ${snapshot.label}`);
      setConfirmId(null);
      setConfirmText('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rollback failed');
    } finally {
      setRolling(null);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
            <DatabaseBackup className="w-5 h-5 text-slate-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Platform Snapshots</h1>
            <p className="text-slate-400 text-sm">Created automatically before migrations, deploys, and config changes</p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Warning banner */}
      <div className="bg-amber-950/40 border border-amber-800 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-200">
          <span className="font-semibold">Rollback is irreversible.</span> It executes the stored rollback SQL against the live production database. Only roll back if you understand exactly what the snapshot captured. Snapshots with no rollback SQL are metadata-only — they cannot undo DB changes.
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-950/50 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-950/50 border border-green-800 text-green-300 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {success}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-500" />
        {['all', 'pre_migration', 'pre_deploy', 'pre_config_change', 'manual'].map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === t
                ? 'bg-brand-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
            }`}
          >
            {t === 'all' ? 'All' : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Snapshot list */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading snapshots…</div>
      ) : snapshots.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <DatabaseBackup className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No snapshots found.</p>
          <p className="text-xs mt-1">Snapshots are created automatically by Dev Studio before migrations and deploys.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {snapshots.map(snap => (
            <div
              key={snap.id}
              className={`bg-slate-900 border rounded-xl p-4 transition-colors ${
                snap.rolled_back ? 'border-slate-700 opacity-60' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLORS[snap.snapshot_type] ?? TYPE_COLORS.manual}`}>
                      {TYPE_LABELS[snap.snapshot_type] ?? snap.snapshot_type}
                    </span>
                    {snap.rolled_back && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 border border-slate-600">
                        Rolled back
                      </span>
                    )}
                    <span className="text-xs text-slate-500 capitalize">{snap.trigger_type}</span>
                  </div>
                  <p className="text-white text-sm font-medium truncate">{snap.label}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    {formatDate(snap.created_at)}
                  </div>
                </div>

                {!snap.rolled_back && (
                  <div className="flex-shrink-0">
                    {confirmId === snap.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={confirmText}
                          onChange={e => setConfirmText(e.target.value)}
                          placeholder="CONFIRM ROLLBACK"
                          className="px-3 py-1.5 bg-slate-800 border border-red-700 rounded-lg text-white text-xs w-44 focus:outline-none focus:ring-1 focus:ring-red-500 placeholder-slate-600"
                          autoFocus
                        />
                        <button
                          onClick={() => handleRollback(snap)}
                          disabled={rolling === snap.id || confirmText !== 'CONFIRM ROLLBACK'}
                          className="px-3 py-1.5 bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          {rolling === snap.id ? 'Rolling back…' : 'Execute'}
                        </button>
                        <button
                          onClick={() => { setConfirmId(null); setConfirmText(''); setError(''); }}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setConfirmId(snap.id); setConfirmText(''); setError(''); setSuccess(''); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-red-900/40 border border-slate-700 hover:border-red-700 text-slate-400 hover:text-red-300 text-xs rounded-lg transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Rollback
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
