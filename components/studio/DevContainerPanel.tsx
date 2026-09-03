'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CloudUpload,
  Code2,
  KeyRound,
  Loader2,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react';

const DEVCONTAINER_API = '/api/admin/dev-studio/devcontainer';
const ENV_API = '/api/admin/dev-studio/env';
const CONTAINER_ENV_API = '/api/admin/dev-studio/container-env';

type SecretScope = 'runtime' | 'build' | 'unused';

type EnvEntry = {
  key: string;
  scope: SecretScope;
  description?: string;
  category?: string;
  masked_value: string;
  has_value: boolean;
  updated_at?: string;
};

type DevContainerPayload = {
  raw: string;
  parsed?: Record<string, unknown>;
  sha: string;
  source?: string;
  writable?: boolean;
  mode?: string;
  repo?: string;
  branch?: string;
};

type Status = { type: 'success' | 'error'; message: string } | null;

async function readJson(res: Response) {
  return res.json().catch(() => ({}));
}

function errorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const value = (payload as { error?: unknown }).error;
    if (typeof value === 'string' && value.trim()) return value;
  }
  return fallback;
}

export default function DevContainerPanel() {
  const [tab, setTab] = useState<'configuration' | 'environment'>('configuration');
  const [config, setConfig] = useState<DevContainerPayload | null>(null);
  const [editedRaw, setEditedRaw] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const [entries, setEntries] = useState<EnvEntry[]>([]);
  const [envLoading, setEnvLoading] = useState(true);
  const [envSaving, setEnvSaving] = useState(false);
  const [pushingKey, setPushingKey] = useState<string | null>(null);
  const [form, setForm] = useState({
    key: '',
    value: '',
    scope: 'runtime' as SecretScope,
    description: '',
  });

  const dirty = useMemo(
    () => Boolean(config && editedRaw !== config.raw),
    [config, editedRaw],
  );

  async function loadConfig() {
    setLoading(true);
    try {
      const res = await fetch(DEVCONTAINER_API, { cache: 'no-store' });
      const payload = await readJson(res);
      if (!res.ok) throw new Error(errorMessage(payload, 'Could not load devcontainer.json'));
      const next = payload as DevContainerPayload;
      setConfig(next);
      setEditedRaw(next.raw ?? '');
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not load devcontainer.json',
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadEnvironment() {
    setEnvLoading(true);
    try {
      const res = await fetch(ENV_API, { cache: 'no-store' });
      const payload = await readJson(res);
      if (!res.ok) throw new Error(errorMessage(payload, 'Could not load environment keys'));
      const rows = Array.isArray((payload as { entries?: unknown[] }).entries)
        ? ((payload as { entries: EnvEntry[] }).entries ?? [])
        : [];
      setEntries(rows);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not load environment keys',
      });
    } finally {
      setEnvLoading(false);
    }
  }

  useEffect(() => {
    void Promise.all([loadConfig(), loadEnvironment()]);
  }, []);

  async function saveConfig() {
    if (!config?.sha || !editedRaw.trim() || saving) return;

    try {
      JSON.parse(
        editedRaw
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/^\s*\/\/.*$/gm, '')
          .replace(/,\s*([}\]])/g, '$1'),
      );
    } catch {
      setStatus({ type: 'error', message: 'devcontainer.json is not valid JSON/JSONC.' });
      return;
    }

    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch(DEVCONTAINER_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editedRaw,
          sha: config.sha,
          message: 'chore: update devcontainer.json via Admin Dev Studio',
        }),
      });
      const payload = await readJson(res);
      if (!res.ok) throw new Error(errorMessage(payload, 'Could not save devcontainer.json'));

      setConfig((current) =>
        current
          ? {
              ...current,
              raw: editedRaw,
              sha: typeof (payload as { sha?: unknown }).sha === 'string'
                ? String((payload as { sha: string }).sha)
                : current.sha,
            }
          : current,
      );
      setStatus({ type: 'success', message: 'devcontainer.json committed to GitHub.' });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not save devcontainer.json',
      });
    } finally {
      setSaving(false);
    }
  }

  async function saveEnvironmentKey() {
    const key = form.key.trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9_]{1,127}$/.test(key)) {
      setStatus({ type: 'error', message: 'Use an ENV-style key such as OPENAI_API_KEY.' });
      return;
    }
    if (!form.value) {
      setStatus({ type: 'error', message: 'A value is required.' });
      return;
    }

    setEnvSaving(true);
    setStatus(null);
    try {
      const res = await fetch(ENV_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: [
            {
              key,
              value: form.value,
              scope: form.scope,
              description: form.description,
            },
          ],
        }),
      });
      const payload = await readJson(res);
      if (!res.ok) throw new Error(errorMessage(payload, `Could not save ${key}`));

      setForm({ key: '', value: '', scope: 'runtime', description: '' });
      await loadEnvironment();
      setStatus({ type: 'success', message: `${key} saved to canonical platform secrets.` });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : `Could not save ${key}`,
      });
    } finally {
      setEnvSaving(false);
    }
  }

  async function deleteEnvironmentKey(key: string) {
    const confirmation = window.prompt(`Type CONFIRM DELETE SECRET to permanently delete ${key} from canonical platform secrets.`);
    if (confirmation !== 'CONFIRM DELETE SECRET') return;
    setStatus(null);
    try {
      const res = await fetch(`${ENV_API}?key=${encodeURIComponent(key)}`, { method: 'DELETE', headers: { 'x-confirmation': confirmation } });
      const payload = await readJson(res);
      if (!res.ok) throw new Error(errorMessage(payload, `Could not delete ${key}`));
      await loadEnvironment();
      setStatus({ type: 'success', message: `${key} deleted.` });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : `Could not delete ${key}`,
      });
    }
  }

  async function pushToNorthflank(key: string) {
    setPushingKey(key);
    setStatus(null);
    try {
      const res = await fetch(CONTAINER_ENV_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const payload = await readJson(res);
      if (!res.ok) throw new Error(errorMessage(payload, `Could not push ${key} to Northflank`));
      const services = Array.isArray((payload as { updatedServices?: string[] }).updatedServices)
        ? (payload as { updatedServices: string[] }).updatedServices.join(', ')
        : 'configured services';
      setStatus({ type: 'success', message: `${key} pushed to Northflank: ${services}.` });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : `Could not push ${key} to Northflank`,
      });
    } finally {
      setPushingKey(null);
    }
  }

  return (
    <section className="flex min-h-[720px] flex-col bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white px-4 py-4 text-slate-950">
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-auto">
            <h2 className="font-bold">Container Control Plane</h2>
            <p className="mt-1 text-xs text-slate-500">
              Canonical Admin APIs only · GitHub configuration · platform_secrets · Northflank sync
            </p>
          </div>
          <button
            type="button"
            onClick={() => void Promise.all([loadConfig(), loadEnvironment()])}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setTab('configuration')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${
              tab === 'configuration' ? 'bg-cyan-100 text-cyan-900 ring-1 ring-cyan-300' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <Code2 className="h-4 w-4" /> DevContainer
          </button>
          <button
            type="button"
            onClick={() => setTab('environment')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${
              tab === 'environment' ? 'bg-cyan-100 text-cyan-900 ring-1 ring-cyan-300' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <KeyRound className="h-4 w-4" /> Environment
          </button>
        </div>
      </header>

      {status ? (
        <div
          className={`mx-4 mt-4 flex items-start gap-2 rounded-xl border px-3 py-3 text-sm ${
            status.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{status.message}</span>
        </div>
      ) : null}

      {tab === 'configuration' ? (
        <div className="flex min-h-0 flex-1 flex-col p-4">
          {loading ? (
            <div className="flex flex-1 items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading devcontainer.json…
            </div>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded-md bg-slate-100 px-2 py-1">source: {config?.source ?? 'unknown'}</span>
                <span className="rounded-md bg-slate-100 px-2 py-1">mode: {config?.mode ?? 'unknown'}</span>
                {config?.repo ? <span className="rounded-md bg-slate-100 px-2 py-1">{config.repo}</span> : null}
                {config?.branch ? <span className="rounded-md bg-slate-100 px-2 py-1">branch: {config.branch}</span> : null}
                {dirty ? <span className="font-semibold text-amber-700">Unsaved changes</span> : null}
              </div>

              <textarea
                value={editedRaw}
                onChange={(event) => setEditedRaw(event.target.value)}
                spellCheck={false}
                className="min-h-[520px] flex-1 resize-none rounded-xl border border-slate-300 bg-slate-50 p-4 font-mono text-xs leading-5 text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                aria-label="devcontainer.json editor"
              />

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => void saveConfig()}
                  disabled={!dirty || saving || config?.writable === false}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Commit configuration
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-5 p-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-900">Add or rotate an environment key</h3>
            <p className="mt-1 text-xs text-slate-500">
              New writes go only to platform_secrets. Runtime keys can then be synchronized to Northflank.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={form.key}
                onChange={(event) => setForm((current) => ({ ...current, key: event.target.value }))}
                placeholder="OPENAI_API_KEY"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
              <select
                value={form.scope}
                onChange={(event) =>
                  setForm((current) => ({ ...current, scope: event.target.value as SecretScope }))
                }
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="runtime">runtime</option>
                <option value="build">build</option>
                <option value="unused">unused</option>
              </select>
              <input
                type="password"
                value={form.value}
                onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))}
                placeholder="Secret value"
                autoComplete="new-password"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
              <input
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Description"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => void saveEnvironmentKey()}
                disabled={envSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {envSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save key
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="border-b border-slate-200 bg-white px-4 py-3">
              <h3 className="font-semibold text-slate-900">Canonical environment</h3>
              <p className="text-xs text-slate-500">Masked values only; raw values are never returned to the browser.</p>
            </div>

            {envLoading ? (
              <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading environment…
              </div>
            ) : entries.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">No environment keys found.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {entries.map((entry) => (
                  <div key={entry.key} className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="font-semibold text-slate-900">{entry.key}</code>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                          {entry.scope}
                        </span>
                        {entry.category ? (
                          <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-bold uppercase text-cyan-700">
                            {entry.category}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 font-mono text-xs text-slate-500">{entry.masked_value}</p>
                      {entry.description ? <p className="mt-1 text-xs text-slate-500">{entry.description}</p> : null}
                    </div>
                    <div className="flex gap-2">
                      {entry.scope === 'runtime' ? (
                        <button
                          type="button"
                          onClick={() => void pushToNorthflank(entry.key)}
                          disabled={pushingKey === entry.key}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          {pushingKey === entry.key ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CloudUpload className="h-3.5 w-3.5" />
                          )}
                          Push to Northflank
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void deleteEnvironmentKey(entry.key)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
