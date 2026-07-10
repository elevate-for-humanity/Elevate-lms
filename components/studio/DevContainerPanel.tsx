'use client';

import { useEffect, useRef, useState } from 'react';
import { Save, RefreshCw, CheckCircle, AlertCircle, Box, Trash2, Send, Upload } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

interface DevContainerConfig {
  name?: string;
  image?: string;
  forwardPorts?: number[];
  portsAttributes?: Record<string, { label?: string; onAutoForward?: string }>;
  features?: Record<string, unknown>;
  onCreateCommand?: string;
  postCreateCommand?: string;
  postStartCommand?: string;
  remoteEnv?: Record<string, string>;
  customizations?: {
    vscode?: {
      extensions?: string[];
      settings?: Record<string, unknown>;
    };
  };
  xElevateEnvironments?: {
    active?: string;
    profiles?: Record<
      string,
      {
        remoteEnv?: Record<string, string>;
        forwardPorts?: number[];
        postStartCommand?: string;
      }
    >;
  };
}

interface ContainerEnvEntry {
  key: string;
  scope: 'runtime' | 'build' | 'unused';
  description?: string;
  masked_value: string;
  has_value: boolean;
  updated_at?: string;
}

function stripJsonCommentsAndTrailingCommas(input: string): string {
  let out: string;
  let inString = false;
  let quote: string;
  let i = 0;
  out = '';
  quote = '';

  while (i < input.length) {
    const ch = input[i];
    const next = input[i + 1];

    if (inString) {
      out += ch;
      if (ch === '\\') {
        if (i + 1 < input.length) {
          out += input[i + 1];
          i += 2;
          continue;
        }
      } else if (ch === quote) {
        inString = false;
        quote = '';
      }
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      quote = ch;
      out += ch;
      i += 1;
      continue;
    }

    if (ch === '/' && next === '/') {
      i += 2;
      while (i < input.length && input[i] !== '\n') i += 1;
      continue;
    }

    if (ch === '/' && next === '*') {
      i += 2;
      while (i + 1 < input.length && !(input[i] === '*' && input[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }

    out += ch;
    i += 1;
  }

  return out.replace(/,\s*([}\]])/g, '$1');
}

function parseJsonc(value: string): DevContainerConfig {
  return JSON.parse(stripJsonCommentsAndTrailingCommas(value));
}

function toPrettyJson(value: DevContainerConfig): string {
  return JSON.stringify(value, null, 2);
}

function parseEnvBlock(block: string): Record<string, string> {
  const rows = block
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));

  const env: Record<string, string> = {};
  for (const row of rows) {
    const idx = row.indexOf('=');
    if (idx <= 0) continue;
    const key = row.slice(0, idx).trim();
    const value = row.slice(idx + 1).trim();
    if (key) env[key] = value;
  }
  return env;
}

export default function DevContainerPanel() {
  const [raw, setRaw] = useState('');
  const [sha, setSha] = useState('');
  const [parsed, setParsed] = useState<DevContainerConfig | null>(null);
  const [editedRaw, setEditedRaw] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'visual' | 'environments' | 'raw' | 'ai'>('visual');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggested, setAiSuggested] = useState<string | null>(null);
  const [writable, setWritable] = useState(true);
  const [source, setSource] = useState<string>('unknown');
  const [envEntries, setEnvEntries] = useState<ContainerEnvEntry[]>([]);
  const [envLoading, setEnvLoading] = useState(false);
  const [envSaving, setEnvSaving] = useState(false);
  const [envForm, setEnvForm] = useState({
    key: '',
    value: '',
    scope: 'runtime' as 'runtime' | 'build' | 'unused',
    description: '',
  });
  const [profileName, setProfileName] = useState('local');
  const [profileEnvBlock, setProfileEnvBlock] = useState('');

  // Northflank push
  const [nfPushing, setNfPushing] = useState<string | null>(null); // key being pushed, or 'all'
  const [nfPushResult, setNfPushResult] = useState<string | null>(null);



  useEffect(() => {
    load();
    loadContainerEnv();
  }, []);

  const updateParsed = (next: DevContainerConfig) => {
    setParsed(next);
    setEditedRaw(toPrettyJson(next));
    setParseError(null);
  };

  const load = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/devstudio/devcontainer');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? 'Failed to load');
      }
      const data = await res.json();
      setRaw(data.raw);
      setSha(data.sha ?? '');
      setParsed(data.parsed);
      setEditedRaw(data.raw);
      setParseError(null);
      setWritable(data.writable !== false);
      setSource(data.source ?? 'unknown');
      if (data.writable === false) {
        const mode = data.mode ? `Mode: ${data.mode}. ` : '';
        setStatus({
          type: 'error',
          message:
            data.source === 'github-readonly'
              ? `${mode}Read-only source (GitHub public fallback). Set GITHUB_TOKEN to unify writes through GitHub API.`
              : `${mode}Read-only mode: current devcontainer source is not writable from this environment.`,
        });
      } else if (data.mode === 'github-only' && data.source === 'github') {
        setStatus({
          type: 'success',
          message: 'Unified mode active: all DevContainer edits are committed through GitHub API.',
        });
      }
    } catch (e) {
      setStatus({ type: 'error', message: (e as Error).message || 'Could not load devcontainer.json' });
    } finally {
      setLoading(false);
    }
  };

  const loadContainerEnv = async () => {
    setEnvLoading(true);
    try {
      const res = await fetch('/api/devstudio/env');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? 'Failed to load container environment');
      }
      const data = await res.json();
      setEnvEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch (e) {
      setStatus({ type: 'error', message: (e as Error).message || 'Could not load container environment' });
    } finally {
      setEnvLoading(false);
    }
  };

  const handleRawChange = (value: string) => {
    setEditedRaw(value);
    try {
      const p = parseJsonc(value);
      setParsed(p);
      setParseError(null);
    } catch (e) {
      setParseError((e as SyntaxError).message);
      // Switch to raw tab so the user can see and fix the error — staying on
      // Visual with parsed=null would silently fall through to the raw editor
      // with no indication of what happened.
      setActiveTab('raw');
    }
  };

  const saveProfile = () => {
    if (!parsed) return;
    const name = profileName.trim();
    if (!name) {
      setStatus({ type: 'error', message: 'Profile name is required.' });
      return;
    }

    const profileEnv = parseEnvBlock(profileEnvBlock);
    const next: DevContainerConfig = {
      ...parsed,
      xElevateEnvironments: {
        active: parsed.xElevateEnvironments?.active ?? name,
        profiles: {
          ...(parsed.xElevateEnvironments?.profiles ?? {}),
          [name]: {
            ...(parsed.xElevateEnvironments?.profiles?.[name] ?? {}),
            remoteEnv: profileEnv,
          },
        },
      },
    };

    updateParsed(next);
    setStatus({ type: 'success', message: `Saved environment profile ${name}.` });
  };

  const applyPresetProfile = (preset: 'local' | 'staging' | 'production') => {
    const presets: Record<'local' | 'staging' | 'production', Record<string, string>> = {
      local: {
        NODE_ENV: 'development',
        NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      },
      staging: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_SITE_URL: `https://staging.${PLATFORM_DEFAULTS.canonicalDomain}`,
        NEXT_PUBLIC_APP_URL: `https://staging.${PLATFORM_DEFAULTS.canonicalDomain}`,
      },
      production: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_SITE_URL: PLATFORM_DEFAULTS.siteUrl,
        NEXT_PUBLIC_APP_URL: PLATFORM_DEFAULTS.siteUrl,
      },
    };

    const vars = presets[preset];
    setProfileName(preset);
    setProfileEnvBlock(
      Object.entries(vars)
        .map(([k, v]) => `${k}=${v}`)
        .join('\n'),
    );
    setStatus({ type: 'success', message: `Loaded ${preset} profile template. Save then apply.` });
  };

  const applyProfile = (name: string) => {
    if (!parsed) return;
    const profile = parsed.xElevateEnvironments?.profiles?.[name];
    if (!profile) return;

    const next: DevContainerConfig = {
      ...parsed,
      remoteEnv: {
        ...(parsed.remoteEnv ?? {}),
        ...(profile.remoteEnv ?? {}),
      },
      forwardPorts: profile.forwardPorts ?? parsed.forwardPorts,
      postStartCommand: profile.postStartCommand ?? parsed.postStartCommand,
      xElevateEnvironments: {
        ...(parsed.xElevateEnvironments ?? {}),
        active: name,
        profiles: parsed.xElevateEnvironments?.profiles ?? {},
      },
    };

    updateParsed(next);
    setProfileName(name);
    setProfileEnvBlock(
      Object.entries(profile.remoteEnv ?? {})
        .map(([k, v]) => `${k}=${v}`)
        .join('\n'),
    );
    setStatus({ type: 'success', message: `Applied environment profile ${name} to remoteEnv.` });
  };

  const saveContainerEnvEntry = async () => {
    const key = envForm.key.trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9_]{1,127}$/.test(key)) {
      setStatus({ type: 'error', message: 'Use ENV-style keys like API_KEY or NEXT_PUBLIC_SITE_URL.' });
      return;
    }
    if (!envForm.value) {
      setStatus({ type: 'error', message: 'Value is required for container env keys.' });
      return;
    }

    setEnvSaving(true);
    try {
      const res = await fetch('/api/devstudio/env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: [
            {
              key,
              value: envForm.value,
              scope: envForm.scope,
              description: envForm.description,
            },
          ],
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? 'Failed to save environment key');
      }

      setEnvForm({ key: '', value: '', scope: 'runtime', description: '' });
      await loadContainerEnv();
      setStatus({ type: 'success', message: `Saved ${key} to container environment.` });
    } catch (e) {
      setStatus({ type: 'error', message: (e as Error).message || 'Failed to save environment key' });
    } finally {
      setEnvSaving(false);
    }
  };

  const deleteContainerEnvEntry = async (key: string) => {
    if (!confirm(`Delete ${key} from container environment?`)) return;

    try {
      const res = await fetch(`/api/devstudio/env?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? 'Delete failed');
      }
      await loadContainerEnv();
      setStatus({ type: 'success', message: `Deleted ${key}.` });
    } catch (e) {
      setStatus({ type: 'error', message: (e as Error).message || 'Failed to delete key' });
    }
  };

  const save = async () => {
    if (parseError || !writable) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/devstudio/devcontainer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // sha is required by the GitHub Contents API to update an existing file
        body: JSON.stringify({ content: editedRaw, sha }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }
      const result = await res.json();
      setRaw(editedRaw);
      // Update sha so subsequent saves use the new blob sha
      if (result.sha) setSha(result.sha);
      setStatus({
        type: 'success',
        message: result.commit
          ? `Committed — ${result.commit}`
          : 'devcontainer.json committed to main',
      });
    } catch (e) {
      setStatus({ type: 'error', message: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const pushKeyToNorthflank = async (key: string, value?: string) => {
    setNfPushing(key);
    setNfPushResult(null);
    try {
      const body: Record<string, unknown> = { key, services: ['lms', 'admin'] };
      if (value !== undefined) body.value = value;
      const r = await fetch('/api/devstudio/container-env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? 'Push failed');
      setNfPushResult(`✅ ${key} pushed to Northflank (${d.updatedServices?.join(', ')})`);
    } catch (e) {
      setNfPushResult(`❌ ${(e as Error).message}`);
    } finally {
      setNfPushing(null);
    }
  };



  const hasChanges = editedRaw !== raw;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Loading devcontainer.json…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-brand-blue-600" />
          <span className="font-semibold text-sm text-slate-700">.devcontainer/devcontainer.json</span>
          <span className="text-xs text-slate-500">({source})</span>
          {hasChanges && (
            <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded">unsaved</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
            title="Reload from disk"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={save}
            disabled={!hasChanges || !!parseError || saving || !writable}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded text-sm text-white transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <p className="px-4 py-2 text-[11px] text-slate-500 border-b border-slate-100 bg-slate-50/80 flex-shrink-0">
        Control plane: devcontainer (GitHub) + Northflank env push. Secret precedence:{' '}
        <span className="font-mono text-slate-600">platform_secrets → app_secrets → process.env</span>.
        AI governance: <span className="font-mono text-slate-600">lib/devstudio/ai-studio-charter.ts</span>.
      </p>

      {/* Status bar */}
      {status && (
        <div
          className={`flex items-center gap-2 px-4 py-2 text-sm flex-shrink-0 border-b ${
            status.type === 'success'
              ? 'bg-brand-green-50 text-brand-green-800 border-brand-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {status.message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 flex-shrink-0">
        {(['visual', 'environments', 'raw', 'ai'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm capitalize transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-brand-blue-500 text-brand-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'visual' ? 'Visual' : tab === 'environments' ? 'Environments' : tab === 'raw' ? 'Raw JSON' : '✦ AI'}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-1.5 px-3 py-2 text-xs text-slate-500 hover:text-brand-blue-600 cursor-pointer transition-colors">
          <Upload className="w-3.5 h-3.5" />
          <span>Upload</span>
          <input
            type="file"
            className="hidden"
            accept=".json,.env,.yml,.yaml,.toml,.txt,.sh"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const formData = new FormData();
              formData.append('file', file);
              try {
                const res = await fetch('/api/devstudio/upload', { method: 'POST', body: formData });
                if (res.ok) {
                  setStatus({ type: 'success', message: `Uploaded ${file.name}` });
                } else {
                  setStatus({ type: 'error', message: 'Upload failed' });
                }
              } catch {
                setStatus({ type: 'error', message: 'Upload failed' });
              }
              e.target.value = '';
              setTimeout(() => setStatus(null), 3000);
            }}
          />
        </label>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'visual' && parsed === null ? (
          // parsed is null only when JSON is invalid — handleRawChange switches
          // to raw tab in that case, so this branch is a safety fallback only
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            <AlertCircle className="w-4 h-4 mr-2 text-red-400" />
            Invalid JSON — switch to Raw JSON tab to fix the error.
          </div>
        ) : activeTab === 'visual' ? (
          <div className="p-4 space-y-6">
            {/* Name & Image */}
            <Section title="Container">
              <Field label="Name" value={parsed.name} />
              <Field label="Base Image" value={parsed.image} mono />
            </Section>

            {/* Ports */}
            {parsed.forwardPorts && parsed.forwardPorts.length > 0 && (
              <Section title="Forwarded Ports">
                <div className="flex flex-wrap gap-2">
                  {parsed.forwardPorts.map((p) => (
                    <span
                      key={p}
                      className="bg-brand-blue-50 text-brand-blue-600 px-3 py-1 rounded font-mono text-sm"
                    >
                      :{p}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Features */}
            {parsed.features && Object.keys(parsed.features).length > 0 && (
              <Section title="Features">
                <div className="space-y-1">
                  {Object.keys(parsed.features).map((f) => (
                    <div
                      key={f}
                      className="font-mono text-xs text-slate-700 bg-slate-100 px-3 py-1.5 rounded"
                    >
                      {f}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Lifecycle commands — the platform's central processing hooks */}
            {parsed.onCreateCommand && (
              <Section title="On Create (runs once on first build)">
                <code className="block bg-slate-100 px-3 py-2 rounded text-xs text-slate-700 font-mono whitespace-pre-wrap break-all">
                  {parsed.onCreateCommand}
                </code>
              </Section>
            )}
            {parsed.postCreateCommand && (
              <Section title="Post Create (runs after image build)">
                <code className="block bg-slate-100 px-3 py-2 rounded text-xs text-slate-700 font-mono whitespace-pre-wrap break-all">
                  {parsed.postCreateCommand}
                </code>
              </Section>
            )}
            {parsed.postStartCommand && (
              <Section title="Post Start (runs on every container start)">
                <code className="block bg-slate-100 px-3 py-2 rounded text-xs text-slate-700 font-mono whitespace-pre-wrap break-all">
                  {parsed.postStartCommand}
                </code>
              </Section>
            )}

            {/* Remote env */}
            {parsed.remoteEnv && Object.keys(parsed.remoteEnv).length > 0 && (
              <Section title="Remote Environment Variables">
                <div className="space-y-1">
                  {Object.entries(parsed.remoteEnv).map(([k, v]) => (
                    <div key={k} className="flex items-start gap-2 font-mono text-xs bg-slate-100 px-3 py-1.5 rounded">
                      <span className="text-brand-blue-600 flex-shrink-0">{k}</span>
                      <span className="text-slate-500">=</span>
                      <span className="text-slate-700 break-all">{v}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Port attributes */}
            {parsed.portsAttributes && Object.keys(parsed.portsAttributes).length > 0 && (
              <Section title="Port Configuration">
                <div className="space-y-1">
                  {Object.entries(parsed.portsAttributes).map(([port, cfg]) => (
                    <div key={port} className="flex items-center gap-3 text-xs bg-slate-100 px-3 py-1.5 rounded">
                      <span className="font-mono text-brand-blue-600">:{port}</span>
                      <span className="text-slate-700">{cfg.label}</span>
                      {cfg.onAutoForward && (
                        <span className="text-slate-500 ml-auto">{cfg.onAutoForward}</span>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* VS Code extensions */}
            {parsed.customizations?.vscode?.extensions && (
              <Section title="VS Code Extensions">
                <div className="grid grid-cols-2 gap-1">
                  {parsed.customizations.vscode.extensions.map((ext) => (
                    <div
                      key={ext}
                      className="text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded font-mono truncate"
                    >
                      {ext}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* VS Code settings */}
            {parsed.customizations?.vscode?.settings && (
              <Section title="VS Code Settings">
                <pre className="text-xs text-slate-700 bg-slate-100 px-3 py-2 rounded overflow-auto">
                  {JSON.stringify(parsed.customizations.vscode.settings, null, 2)}
                </pre>
              </Section>
            )}
          </div>
        ) : activeTab === 'environments' ? (
          <div className="p-4 space-y-6">
            <Section title="Environment Profiles (Gitpod-style)">
              <p className="text-xs text-slate-500 mb-3">
                Create named container profiles and apply one into devcontainer remoteEnv.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Profile Name</label>
                  <input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                    placeholder="local"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Active Profile</label>
                  <input
                    value={parsed?.xElevateEnvironments?.active ?? 'none'}
                    readOnly
                    className="w-full border border-slate-200 bg-slate-50 rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <label className="block text-xs font-semibold text-slate-500 mt-3 mb-1">Profile Variables</label>
              <textarea
                value={profileEnvBlock}
                onChange={(e) => setProfileEnvBlock(e.target.value)}
                spellCheck={false}
                className="w-full border border-slate-300 rounded px-3 py-2 text-xs font-mono min-h-[120px]"
                placeholder={'NODE_ENV=development\nNEXT_PUBLIC_SITE_URL=http://localhost:3000'}
              />

              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => applyPresetProfile('local')}
                  className="px-3 py-1.5 rounded text-sm border border-slate-300 hover:border-slate-400"
                >
                  One-click Local
                </button>
                <button
                  onClick={() => applyPresetProfile('staging')}
                  className="px-3 py-1.5 rounded text-sm border border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                >
                  One-click Staging
                </button>
                <button
                  onClick={() => applyPresetProfile('production')}
                  className="px-3 py-1.5 rounded text-sm border border-fuchsia-300 text-fuchsia-700 hover:bg-fuchsia-50"
                >
                  One-click Production
                </button>
                <button
                  onClick={saveProfile}
                  className="px-3 py-1.5 rounded text-sm bg-brand-blue-600 hover:bg-brand-blue-700 text-white"
                >
                  Save Profile
                </button>
                {Object.keys(parsed?.xElevateEnvironments?.profiles ?? {}).map((name) => (
                  <button
                    key={name}
                    onClick={() => applyProfile(name)}
                    className="px-3 py-1.5 rounded text-sm border border-slate-300 hover:border-brand-blue-500 hover:text-brand-blue-600"
                  >
                    Apply {name}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Container Secrets and Variables">
              <p className="text-xs text-slate-500 mb-3">
                Add runtime/build keys for the container directly from this dashboard.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  value={envForm.key}
                  onChange={(e) => setEnvForm((p) => ({ ...p, key: e.target.value }))}
                  className="border border-slate-300 rounded px-3 py-2 text-sm"
                  placeholder="GROQ_API_KEY"
                />
                <select
                  value={envForm.scope}
                  onChange={(e) =>
                    setEnvForm((p) => ({
                      ...p,
                      scope: e.target.value as 'runtime' | 'build' | 'unused',
                    }))
                  }
                  className="border border-slate-300 rounded px-3 py-2 text-sm"
                >
                  <option value="runtime">runtime</option>
                  <option value="build">build</option>
                  <option value="unused">unused</option>
                </select>
                <input
                  value={envForm.value}
                  onChange={(e) => setEnvForm((p) => ({ ...p, value: e.target.value }))}
                  className="border border-slate-300 rounded px-3 py-2 text-sm md:col-span-2"
                  placeholder="Secret or variable value"
                />
                <input
                  value={envForm.description}
                  onChange={(e) => setEnvForm((p) => ({ ...p, description: e.target.value }))}
                  className="border border-slate-300 rounded px-3 py-2 text-sm md:col-span-2"
                  placeholder="Description (optional)"
                />
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={saveContainerEnvEntry}
                  disabled={envSaving}
                  className="px-3 py-1.5 rounded text-sm bg-brand-green-600 hover:bg-brand-green-700 disabled:opacity-50 text-white"
                >
                  {envSaving ? 'Saving…' : 'Save Key'}
                </button>
                <button
                  onClick={loadContainerEnv}
                  disabled={envLoading}
                  className="px-3 py-1.5 rounded text-sm border border-slate-300 hover:border-slate-400"
                >
                  Refresh
                </button>

                <button
                  onClick={() => envForm.key && pushKeyToNorthflank(envForm.key, envForm.value || undefined)}
                  disabled={!envForm.key || !!nfPushing}
                  title="Write this key to the Northflank production secret group"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-50 text-white"
                >
                  <Send className="w-3.5 h-3.5" />
                  {nfPushing === envForm.key ? 'Pushing…' : 'Push to Northflank'}
                </button>
              </div>

              {/* Result banners */}
              {nfPushResult && (
                <p className={`mt-2 text-xs px-3 py-1.5 rounded ${nfPushResult.startsWith('✅') ? 'bg-brand-green-50 text-brand-green-700' : 'bg-red-50 text-red-700'}`}>
                  {nfPushResult}
                </p>
              )}

              <div className="mt-4 border border-slate-200 rounded overflow-hidden">
                <div className="grid grid-cols-[2fr_80px_120px_1fr_140px] gap-2 bg-slate-50 border-b border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <span>Key</span>
                  <span>Scope</span>
                  <span>Value</span>
                  <span>Description</span>
                  <span>Actions</span>
                </div>
                <div className="max-h-[260px] overflow-auto divide-y divide-slate-100">
                  {envEntries.length === 0 && (
                    <div className="px-3 py-3 text-xs text-slate-500">No container env keys yet.</div>
                  )}
                  {envEntries.map((entry) => (
                    <div
                      key={entry.key}
                      className="grid grid-cols-[2fr_80px_120px_1fr_140px] gap-2 px-3 py-2 text-xs items-center"
                    >
                      <span className="font-mono text-slate-700 truncate" title={entry.key}>{entry.key}</span>
                      <span className="text-slate-600">{entry.scope}</span>
                      <span className="font-mono text-slate-500 truncate" title={entry.masked_value}>
                        {entry.masked_value}
                      </span>
                      <span className="text-slate-600 truncate" title={entry.description || ''}>
                        {entry.description || '—'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => pushKeyToNorthflank(entry.key)}
                          disabled={!!nfPushing}
                          className="inline-flex items-center gap-1 text-brand-blue-600 hover:text-brand-blue-700 disabled:opacity-40"
                          title={`Push ${entry.key} to Northflank`}
                        >
                          <Send className="w-3 h-3" />
                          {nfPushing === entry.key ? '…' : 'Push'}
                        </button>
                        <button
                          onClick={() => deleteContainerEnvEntry(entry.key)}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-700"
                          title={`Delete ${entry.key}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Del
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          </div>
        ) : activeTab === 'ai' ? (
          // AI tab — describe what you want, get a suggested devcontainer.json patch
          <div className="h-full flex flex-col p-4 gap-4 overflow-y-auto">
            <p className="text-xs text-slate-500">
              Describe a change to your dev container and AI will suggest an updated <code>devcontainer.json</code>. Review the suggestion, then apply it with one click.
            </p>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Add a PostgreSQL service, install the GitHub CLI, set NODE_ENV=development..."
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-brand-blue-300"
            />
            <button
              disabled={aiLoading || !aiPrompt.trim()}
              onClick={async () => {
                setAiLoading(true);
                setAiResponse('');
                setAiSuggested(null);
                try {
                  const res = await fetch('/api/devstudio/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      messages: [
                        {
                          role: 'user',
                          content: `You are a devcontainer.json expert. The current devcontainer.json is:\n\n${raw}\n\nUser request: ${aiPrompt}\n\nRespond with ONLY the complete updated devcontainer.json as valid JSON. No explanation, no markdown fences.`,
                        },
                      ],
                      context: 'devcontainer',
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    setAiResponse(data.error || 'AI request failed');
                  } else {
                    const msg = data.message || '';
                    // Extract JSON from response
                    const jsonMatch = msg.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                      setAiSuggested(jsonMatch[0]);
                      setAiResponse('');
                    } else {
                      setAiResponse(msg);
                    }
                  }
                } catch (e) {
                  setAiResponse('Network error — check AI provider configuration.');
                } finally {
                  setAiLoading(false);
                }
              }}
              className="self-start px-4 py-2 bg-brand-blue-600 text-white text-sm rounded-lg hover:bg-brand-blue-700 disabled:opacity-40 transition-colors"
            >
              {aiLoading ? 'Thinking…' : 'Ask AI'}
            </button>

            {aiResponse && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {aiResponse}
              </div>
            )}

            {aiSuggested && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Suggested devcontainer.json</span>
                  <button
                    onClick={() => {
                      handleRawChange(aiSuggested);
                      setActiveTab('raw');
                    }}
                    className="px-3 py-1 text-xs bg-brand-green-600 text-white rounded-lg hover:bg-brand-green-700 transition-colors"
                  >
                    Apply suggestion →
                  </button>
                </div>
                <pre className="text-xs bg-slate-900 text-brand-green-300 rounded-lg p-3 overflow-auto max-h-64 font-mono">
                  {aiSuggested}
                </pre>
                <p className="text-xs text-slate-400">Clicking "Apply suggestion" loads it into Raw JSON for review. Save manually when ready.</p>
              </div>
            )}
          </div>
        ) : (
          // Raw JSON tab
          <div className="h-full flex flex-col">
            {parseError && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border-b border-red-200 text-xs flex-shrink-0">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                JSON error: {parseError}
              </div>
            )}
            <textarea
              value={editedRaw}
              onChange={(e) => handleRawChange(e.target.value)}
              spellCheck={false}
              className="flex-1 w-full bg-white text-slate-700 font-mono text-xs p-4 resize-none outline-none border-0"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 mb-1">
      <span className="text-xs text-slate-500 w-24 flex-shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm text-slate-700 ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
