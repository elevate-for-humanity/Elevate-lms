'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Play,
  Square,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  Zap,
  Clock,
  Activity,
  Terminal,
} from 'lucide-react';

interface AutopilotStatus {
  enabled: boolean;
  running: boolean;
  lastRun: string | null;
  nextRun: string | null;
  tasksCompleted: number;
  tasksFailed: number;
  containerId: string | null;
  featureFlags: {
    autopilotCronEnabled: boolean;
    autopilotSecretSet: boolean;
  };
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  task?: string;
  duration?: number;
}

type ActionState = 'idle' | 'loading' | 'done' | 'error';

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ enabled, running }: { enabled: boolean; running: boolean }) {
  if (!enabled) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
        <AlertCircle className="w-3.5 h-3.5" />
        Not configured
      </span>
    );
  }
  if (running) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        <Activity className="w-3.5 h-3.5 animate-pulse" />
        Running
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
      <CheckCircle className="w-3.5 h-3.5" />
      Ready
    </span>
  );
}

export default function AutopilotPanel() {
  const [status, setStatus] = useState<AutopilotStatus | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [runState, setRunState] = useState<ActionState>('idle');
  const [stopState, setStopState] = useState<ActionState>('idle');

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/devstudio/autopilot/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus(await res.json());
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load status');
    }
  }, []);

  const loadLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/devstudio/autopilot/logs?limit=20');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (e) {
      console.error('Failed to load logs:', e);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadStatus(), loadLogs()]);
    setLoading(false);
  }, [loadStatus, loadLogs]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRun() {
    setRunState('loading');
    setError('');
    try {
      const res = await fetch('/api/devstudio/autopilot/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'platform-tick' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setRunState('done');
      setTimeout(load, 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Run failed');
      setRunState('error');
    }
  }

  async function handleStop() {
    if (!status?.running) return;
    setStopState('loading');
    setError('');
    try {
      const res = await fetch('/api/devstudio/autopilot/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: 'current' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setStopState('done');
      setTimeout(load, 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Stop failed');
      setStopState('error');
    }
  }

  if (loading && !status) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0d1117]">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0d1117] text-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-white">Autopilot</p>
            <StatusBadge
              enabled={status?.enabled ?? false}
              running={status?.running ?? false}
            />
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-1.5 rounded hover:bg-white/10 text-slate-400"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Tasks Done"
            value={status?.tasksCompleted ?? 0}
            icon={<CheckCircle className="w-4 h-4" />}
            color="green"
          />
          <StatCard
            label="Tasks Failed"
            value={status?.tasksFailed ?? 0}
            icon={<AlertCircle className="w-4 h-4" />}
            color="red"
          />
          <StatCard
            label="Last Run"
            value={formatTime(status?.lastRun ?? null)}
            icon={<Clock className="w-4 h-4" />}
            color="blue"
          />
        </div>

        {/* Feature Flags */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Configuration</p>
          <div className="space-y-1.5">
            <FlagRow
              label="Cron Enabled"
              enabled={status?.featureFlags?.autopilotCronEnabled ?? false}
            />
            <FlagRow
              label="Secret Configured"
              enabled={status?.featureFlags?.autopilotSecretSet ?? false}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleRun}
            disabled={runState === 'loading' || !status?.enabled}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600/20 text-green-400 hover:bg-green-600/30 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold transition-colors"
          >
            {runState === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run Now
          </button>
          <button
            onClick={handleStop}
            disabled={stopState === 'loading' || !status?.running}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600/30 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold transition-colors"
          >
            {stopState === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            Stop
          </button>
        </div>

        {/* Next Run */}
        {status?.nextRun && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>Next scheduled run: {formatTime(status.nextRun)}</span>
          </div>
        )}

        {/* Logs */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
            <Terminal className="w-4 h-4 text-slate-400" />
            <p className="text-xs font-semibold text-slate-400">Recent Logs</p>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="px-3 py-4 text-xs text-slate-500 text-center">No logs yet</p>
            ) : (
              logs.map((log) => (
                <LogLine key={log.id} log={log} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'green' | 'red' | 'blue';
}) {
  const colorMap = {
    green: 'text-green-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
  };
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
      <div className={`mb-1 ${colorMap[color]}`}>{icon}</div>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] text-slate-500 uppercase">{label}</p>
    </div>
  );
}

function FlagRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-400">{label}</span>
      <span className={enabled ? 'text-green-400' : 'text-slate-500'}>
        {enabled ? 'Enabled' : 'Disabled'}
      </span>
    </div>
  );
}

function LogLine({ log }: { log: LogEntry }) {
  const levelColors = {
    info: 'text-slate-400',
    warn: 'text-amber-400',
    error: 'text-red-400',
  };
  return (
    <div className="flex items-start gap-2 px-3 py-1.5 border-b border-white/5 last:border-0">
      <span className="text-[10px] text-slate-500 shrink-0 w-16">
        {new Date(log.timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </span>
      <span className={`text-[10px] font-semibold uppercase shrink-0 ${levelColors[log.level]}`}>
        {log.level}
      </span>
      <span className="text-xs text-slate-300 truncate flex-1">{log.message}</span>
      {log.duration !== undefined && (
        <span className="text-[10px] text-slate-500 shrink-0">{log.duration}ms</span>
      )}
    </div>
  );
}
