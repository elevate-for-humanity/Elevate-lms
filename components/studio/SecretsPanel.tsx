'use client';

/**
 * SecretsPanel — Platform Secrets manager inside DevStudio.
 *
 * Lets admin / admin set API keys and credentials directly in the UI.
 * Values are stored encrypted in platform_secrets table.
 * Never displays raw values — only shows masked previews and test status.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Key, Eye, EyeOff, Save, Trash2, RefreshCw,
  CheckCircle, XCircle, AlertCircle, Plus, ChevronDown, ChevronRight,
  Lock,
} from 'lucide-react';

interface PlatformSecret {
  id: string;
  key: string;
  description: string | null;
  category: string;
  is_sensitive: boolean;
  last_tested: string | null;
  test_status: string | null;
  updated_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  ai:       'AI Providers',
  aws:      'Cloud / Infrastructure',
  email:    'Email',
  payments: 'Payments',
  infra:    'Infrastructure',
  general:  'General',
};

const CATEGORY_ORDER = ['ai', 'aws', 'email', 'payments', 'infra', 'general'];

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-slate-400">not tested</span>;
  if (status === 'ok' || status === 'set') {
    return (
      <span className="flex items-center gap-1 text-xs text-brand-green-600">
        <CheckCircle className="w-3 h-3" /> {status}
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="flex items-center gap-1 text-xs text-red-500">
        <XCircle className="w-3 h-3" /> error
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-yellow-500">
      <AlertCircle className="w-3 h-3" /> {status}
    </span>
  );
}

function SecretRow({
  secret,
  onSave,
  onDelete,
  onTest,
}: {
  secret: PlatformSecret;
  onSave: (key: string, value: string) => Promise<void>;
  onDelete: (key: string) => Promise<void>;
  onTest: (key: string) => Promise<void>;
}) {
  const [value, setValue] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSave() {
    if (!value.trim()) return;
    setSaving(true);
    await onSave(secret.key, value.trim());
    setSaving(false);
    setSaved(true);
    setValue('');
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleTest() {
    setTesting(true);
    await onTest(secret.key);
    setTesting(false);
  }

  return (
    <div className="border border-slate-700 rounded-lg p-3 bg-slate-800/50">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Key className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <code className="text-xs font-mono text-amber-300 truncate">{secret.key}</code>
            <StatusBadge status={secret.test_status} />
          </div>
          {secret.description && (
            <p className="text-xs text-slate-400 mt-0.5 ml-5">{secret.description}</p>
          )}
          {secret.last_tested && (
            <p className="text-xs text-slate-500 mt-0.5 ml-5">
              tested {new Date(secret.last_tested).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleTest}
            disabled={testing}
            title="Test this key"
            className="p-1.5 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => onDelete(secret.key)}
            title="Remove key"
            className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Value input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="Paste new value…"
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 pr-8"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !value.trim()}
          className="flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-medium transition-colors"
        >
          {saving ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : saved ? (
            <CheckCircle className="w-3 h-3" />
          ) : (
            <Save className="w-3 h-3" />
          )}
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function CategorySection({
  category,
  secrets,
  onSave,
  onDelete,
  onTest,
}: {
  category: string;
  secrets: PlatformSecret[];
  onSave: (key: string, value: string) => Promise<void>;
  onDelete: (key: string) => Promise<void>;
  onTest: (key: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(true);
  const label = CATEGORY_LABELS[category] ?? category;

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full text-left mb-2 group"
      >
        {open
          ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{label}</span>
        <span className="text-xs text-slate-500">({secrets.length})</span>
      </button>
      {open && (
        <div className="space-y-2 pl-1">
          {secrets.map((s) => (
            <SecretRow
              key={s.key}
              secret={s}
              onSave={onSave}
              onDelete={onDelete}
              onTest={onTest}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SecretsPanel() {
  const [secrets, setSecrets] = useState<PlatformSecret[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newDesc, setNewDesc] = useState('');
  const [addingNew, setAddingNew] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/admin/platform-secrets');
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      setSecrets(d.secrets ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = useCallback(async (key: string, value: string) => {
    const r = await fetch('/api/admin/platform-secrets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    if (r.ok) await load();
  }, [load]);

  const handleDelete = useCallback(async (key: string) => {
    if (!confirm(`Remove secret "${key}"?`)) return;
    await fetch(`/api/admin/platform-secrets?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
    await load();
  }, [load]);

  const handleTest = useCallback(async (key: string) => {
    await fetch('/api/admin/platform-secrets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });
    await load();
  }, [load]);

  const handleAddNew = useCallback(async () => {
    if (!newKey.trim()) return;
    const r = await fetch('/api/admin/platform-secrets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: newKey.trim().toUpperCase().replace(/\s+/g, '_'),
        value: '',
        description: newDesc.trim() || null,
        category: newCategory,
      }),
    });
    if (r.ok) {
      setNewKey('');
      setNewDesc('');
      setAddingNew(false);
      await load();
    }
  }, [newKey, newDesc, newCategory, load]);

  // Group by category
  const grouped = CATEGORY_ORDER.reduce<Record<string, PlatformSecret[]>>((acc, cat) => {
    const items = secrets.filter((s) => s.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});
  // Any uncategorized
  const other = secrets.filter((s) => !CATEGORY_ORDER.includes(s.category));
  if (other.length) grouped['general'] = [...(grouped['general'] ?? []), ...other];

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold">Platform Secrets</span>
          <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            {secrets.length} keys
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddingNew((a) => !a)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs text-slate-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Key
          </button>
          <button
            onClick={load}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Warning banner */}
      <div className="px-4 py-2.5 bg-red-950/60 border-b border-red-700/50 shrink-0">
        <div className="flex items-start gap-2">
          <Lock className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300 leading-relaxed">
            <strong className="text-red-200">Super Admin only.</strong>{' '}
            Values are stored encrypted and override missing env vars at runtime.{' '}
            <strong className="text-red-200">Never share this panel with untrusted users.</strong>
          </p>
        </div>
      </div>

      {/* Add new key form */}
      {addingNew && (
        <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/60 shrink-0 space-y-2">
          <p className="text-xs font-semibold text-slate-300">New Secret Key</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
              placeholder="KEY_NAME"
              className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddNew}
              disabled={!newKey.trim()}
              className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-medium transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => { setAddingNew(false); setNewKey(''); setNewDesc(''); }}
              className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading && (
          <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading…
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm p-3 bg-red-900/20 rounded">
            <XCircle className="w-4 h-4" /> {error}
          </div>
        )}
        {!loading && !error && (
          Object.entries(grouped).map(([cat, items]) => (
            <CategorySection
              key={cat}
              category={cat}
              secrets={items}
              onSave={handleSave}
              onDelete={handleDelete}
              onTest={handleTest}
            />
          ))
        )}
      </div>
    </div>
  );
}
