'use client';

import { useState } from 'react';
import { Key, Plus, Copy, Check, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const statusColors: Record<string, string> = {
  active: 'bg-brand-green-100 text-brand-green-800',
  revoked: 'bg-brand-red-100 text-brand-red-800',
};

interface ApiKey {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

interface Props {
  apiKeys: ApiKey[];
  totalKeys: number;
  activeKeys: number;
}

export function ApiKeysClient({ apiKeys: initialKeys, totalKeys, activeKeys }: Props) {
  const router = useRouter();
  const [keys, setKeys] = useState(initialKeys);
  const [showModal, setShowModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!newKeyName.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to generate key');
        return;
      }
      setGeneratedKey(data.key);
      setKeys((prev) => [data, ...prev]);
      router.refresh();
    } catch {
      setError('Network error — please try again');
    } finally {
      setGenerating(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    setRevoking(id);
    try {
      const res = await fetch(`/api/admin/api-keys?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setKeys((prev) => prev.filter((k) => k.id !== id));
        router.refresh();
      }
    } finally {
      setRevoking(null);
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function closeModal() {
    setShowModal(false);
    setNewKeyName('');
    setGeneratedKey(null);
    setError(null);
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">API Keys</h1>
          <p className="text-slate-700 mt-1">Manage API keys for external integrations</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Generate New Key
        </button>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Key className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800">Keep your API keys secure</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Never share your API keys in public repositories or client-side code. Rotate keys
              regularly and revoke any that may have been compromised.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-medium text-slate-700">Total Keys</h3>
          <p className="text-3xl font-bold text-slate-900 mt-2">{totalKeys}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-medium text-slate-700">Active Keys</h3>
          <p className="text-3xl font-bold text-slate-900 mt-2">{activeKeys}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-medium text-slate-700">Rate Limit</h3>
          <p className="text-3xl font-bold text-slate-900 mt-2">1,000/min</p>
          <p className="text-sm text-slate-700 mt-1">Default limit per key</p>
        </div>
      </div>

      {/* API Keys Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {keys.length === 0 ? (
          <div className="p-8 text-center">
            <Key className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No API keys yet</h3>
            <p className="text-slate-700 mb-4">
              Generate your first API key to get started with integrations
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
            >
              <Plus className="w-5 h-5" />
              Generate New Key
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Name</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Key</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Created</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Last Used</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {keys.map((apiKey) => {
                const prefix = apiKey.name.match(/\[(efh_[^\]]+)\]/)?.[1] ?? 'efh_';
                const displayName = apiKey.name.replace(/\s*\[efh_[^\]]+\]$/, '');
                return (
                  <tr key={apiKey.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Key className="w-5 h-5 text-slate-700" />
                        </div>
                        <span className="font-medium text-slate-900">{displayName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-slate-100 px-2 py-1 rounded font-mono">
                          {prefix}****
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {new Date(apiKey.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {apiKey.last_used_at
                        ? new Date(apiKey.last_used_at).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          apiKey.is_active ? statusColors.active : statusColors.revoked
                        }`}
                      >
                        {apiKey.is_active ? 'active' : 'revoked'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {apiKey.is_active && (
                          <button
                            onClick={() => handleRevoke(apiKey.id)}
                            disabled={revoking === apiKey.id}
                            className="p-2 hover:bg-brand-red-50 rounded-lg disabled:opacity-50"
                            title="Revoke"
                          >
                            <Trash2 className="w-4 h-4 text-brand-red-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Generate Key Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            {generatedKey ? (
              <>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Key Generated</h2>
                <p className="text-sm text-slate-700 mb-4">
                  Copy this key now — it will not be shown again.
                </p>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
                  <code className="text-sm font-mono text-slate-900 flex-1 break-all">
                    {generatedKey}
                  </code>
                  <button
                    onClick={() => handleCopy(generatedKey)}
                    className="p-1.5 hover:bg-slate-200 rounded shrink-0"
                    title="Copy"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-brand-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-700" />
                    )}
                  </button>
                </div>
                <button
                  onClick={closeModal}
                  className="w-full px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Generate New API Key</h2>
                <label className="block text-sm font-medium text-slate-700 mb-1">Key Name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  placeholder="e.g. Zapier Integration"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  autoFocus
                />
                {error && <p className="text-sm text-brand-red-600 mb-3">{error}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={generating || !newKeyName.trim()}
                    className="flex-1 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50"
                  >
                    {generating ? 'Generating…' : 'Generate'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* v1 REST API Reference */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-slate-900 mb-2">REST API v1 — Available Endpoints</h2>
        <p className="text-slate-500 text-sm mb-6">
          Authenticate with <code className="bg-slate-100 px-1 rounded">Authorization: Bearer &lt;api-key&gt;</code> on all requests.
          Base URL: <code className="bg-slate-100 px-1 rounded">{typeof window !== 'undefined' ? window.location.origin : PLATFORM_DEFAULTS.siteUrl}</code>
        </p>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Method', 'Endpoint', 'Description'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { method: 'GET', path: '/api/v1/courses', desc: 'List all published courses' },
                { method: 'GET', path: '/api/v1/users', desc: 'List users (admin only)' },
                { method: 'GET', path: '/api/v1/enrollments', desc: 'List enrollments' },
                { method: 'POST', path: '/api/v1/enrollments', desc: 'Create an enrollment' },
                { method: 'GET', path: '/api/v1/certificates', desc: 'List issued certificates' },
                { method: 'GET', path: '/api/v1/programs', desc: 'List programs' },
                { method: 'POST', path: '/api/xapi/statement', desc: 'Submit an xAPI learning statement' },
                { method: 'POST', path: '/api/lti/launch', desc: 'LTI 1.3 launch (external LMS)' },
                { method: 'GET', path: '/api/lti/jwks', desc: 'LTI JWKS public key endpoint' },
                { method: 'GET', path: '/api/lti/config', desc: 'LTI tool configuration JSON' },
                { method: 'POST', path: '/api/scorm/tracking', desc: 'Submit SCORM CMI tracking data' },
                { method: 'GET', path: '/api/scorm/content/:id/*', desc: 'Serve SCORM package content files' },
              ].map((row) => (
                <tr key={row.path} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-mono font-bold ${
                      row.method === 'GET' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>{row.method}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{row.path}</td>
                  <td className="px-4 py-3 text-slate-600">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
