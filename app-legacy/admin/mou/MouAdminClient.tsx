'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText, Plus, Eye, Send, CheckCircle2, Clock, XCircle,
  Loader2, Edit3, ChevronDown, ChevronUp, PenLine, Users,
} from 'lucide-react';

interface PartnerMou {
  id: string;
  mou_version: string | null;
  status: string | null;
  expiry_date: string | null;
  created_at: string;
  partners?: { name: string } | null;
}

interface Template {
  id: string;
  name: string;
  title: string | null;
  content: string | null;
  version: string | null;
  is_active: boolean;
}

interface Signature {
  id: string;
  signer_name: string | null;
  signer_title: string | null;
  signed_at: string | null;
  mou_version: string | null;
  compensation_model: string | null;
  compensation_rate: string | null;
}

interface Props {
  partnerMous: PartnerMou[];
  mouCount: number;
  templates: Template[];
  signatures: Signature[];
  sigCount: number;
}

const STATUS_STYLE: Record<string, string> = {
  active:   'bg-green-100 text-green-700',
  pending:  'bg-amber-100 text-amber-700',
  expired:  'bg-slate-100 text-slate-500',
  void:     'bg-red-100 text-red-600',
  signed:   'bg-emerald-100 text-emerald-700',
};

type Tab = 'agreements' | 'signatures' | 'templates' | 'create';

export default function MouAdminClient({ partnerMous, mouCount, templates, signatures, sigCount }: Props) {
  const [tab, setTab] = useState<Tab>('agreements');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Create MOU form state
  const [createMode, setCreateMode] = useState<'from_template' | 'custom'>('from_template');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [localMous, setLocalMous] = useState<PartnerMou[]>(partnerMous);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  async function createMou() {
    setSaving(true); setMsg(''); setErr('');
    try {
      const body = createMode === 'from_template'
        ? { template_id: selectedTemplateId, partner_name: partnerName, partner_email: partnerEmail, expiry_date: expiryDate || null }
        : { title: customTitle, content: customContent, partner_name: partnerName, partner_email: partnerEmail, expiry_date: expiryDate || null };

      const res = await fetch('/api/admin/mou', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...body }),
      });
      const d = await res.json();
      if (!res.ok) { setErr(d.error ?? 'Failed to create MOU'); return; }
      setMsg(`MOU created${partnerEmail ? ` — sending to ${partnerEmail}` : ''}`);
      if (d.mou) setLocalMous((prev) => [d.mou, ...prev]);
      // Reset form
      setCustomTitle(''); setCustomContent(''); setPartnerName(''); setPartnerEmail(''); setExpiryDate(''); setSelectedTemplateId('');
      setTimeout(() => { setTab('agreements'); setMsg(''); }, 2000);
    } catch { setErr('Network error'); }
    finally { setSaving(false); }
  }

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: 'agreements', label: 'Partner Agreements', count: mouCount },
    { id: 'signatures', label: 'Signatures', count: sigCount },
    { id: 'templates', label: 'Templates', count: templates.length },
    { id: 'create', label: '+ New MOU' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <nav className="text-xs text-slate-400 mb-1">
            <Link href="/admin" className="hover:text-slate-700">Admin</Link>
            {' / '}
            <span className="text-slate-700 font-medium">MOUs</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900">MOU Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage partnership agreements, signatures, and templates</p>
        </div>
        <button onClick={() => setTab('create')}
          className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-blue-700 transition">
          <Plus className="w-4 h-4" /> New MOU
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total MOUs', value: mouCount, icon: FileText, color: 'text-slate-900' },
          { label: 'Active', value: localMous.filter(m => m.status === 'active').length, icon: CheckCircle2, color: 'text-green-600' },
          { label: 'Pending', value: localMous.filter(m => m.status === 'pending').length, icon: Clock, color: 'text-amber-600' },
          { label: 'Signatures', value: sigCount, icon: PenLine, color: 'text-brand-blue-600' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
              <Icon className={`w-5 h-5 ${s.color} shrink-0`} />
              <div>
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition ${
              tab === t.id
                ? 'bg-white border border-b-white border-slate-200 text-brand-blue-700 -mb-px'
                : 'text-slate-500 hover:text-slate-800'
            }`}>
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1.5 text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {msg && <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">{msg}</div>}
      {err && <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{err}</div>}

      {/* ── AGREEMENTS TAB ── */}
      {tab === 'agreements' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {localMous.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No MOUs yet. Click <strong>New MOU</strong> to create one.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {localMous.map((mou) => (
                <div key={mou.id}>
                  <div
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === mou.id ? null : mou.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {(mou.partners as any)?.name ?? 'Partner'}
                        </p>
                        <p className="text-xs text-slate-400">
                          v{mou.mou_version ?? '1.0'} ·{' '}
                          {mou.expiry_date ? `Expires ${new Date(mou.expiry_date).toLocaleDateString()}` : 'No expiry'} ·{' '}
                          {new Date(mou.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[mou.status ?? 'pending'] ?? 'bg-slate-100 text-slate-600'}`}>
                        {mou.status ?? 'pending'}
                      </span>
                      {expandedId === mou.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                  {expandedId === mou.id && (
                    <div className="px-5 pb-4 pt-2 bg-slate-50 border-t border-slate-100 flex gap-2">
                      <Link href={`/admin/mou/${mou.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50">
                        <Eye className="w-3 h-3" /> View
                      </Link>
                      <Link href={`/admin/mou/${mou.id}/edit`}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50">
                        <Edit3 className="w-3 h-3" /> Edit
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SIGNATURES TAB ── */}
      {tab === 'signatures' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {signatures.length === 0 ? (
            <div className="p-10 text-center text-slate-400">No signatures recorded yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Signer', 'Title', 'Version', 'Compensation', 'Signed'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {signatures.map((sig) => (
                  <tr key={sig.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{sig.signer_name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{sig.signer_title ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{sig.mou_version ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {sig.compensation_model ? `${sig.compensation_model}${sig.compensation_rate ? ` · ${sig.compensation_rate}` : ''}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {sig.signed_at ? new Date(sig.signed_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TEMPLATES TAB ── */}
      {tab === 'templates' && (
        <div className="space-y-3">
          {templates.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400">
              No templates found.
            </div>
          ) : (
            templates.map((t) => (
              <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-800">{t.title ?? t.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">v{t.version ?? '1.0'} · {t.name}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {t.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {t.content && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 max-h-32 overflow-y-auto font-mono whitespace-pre-wrap">
                    {t.content.slice(0, 400)}{t.content.length > 400 ? '…' : ''}
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <button onClick={() => { setSelectedTemplateId(t.id); setCreateMode('from_template'); setTab('create'); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-blue-700">
                    <Plus className="w-3 h-3" /> Use Template
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── CREATE TAB ── */}
      {tab === 'create' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 max-w-2xl">
          <h2 className="font-semibold text-slate-900">Create New MOU</h2>

          {/* Mode toggle */}
          <div className="flex gap-2">
            {[
              { id: 'from_template' as const, label: 'From Template' },
              { id: 'custom' as const, label: 'Custom / Blank' },
            ].map((m) => (
              <button key={m.id} onClick={() => setCreateMode(m.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${
                  createMode === m.id
                    ? 'bg-brand-blue-600 text-white border-brand-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}>
                {m.label}
              </button>
            ))}
          </div>

          {/* Template selector */}
          {createMode === 'from_template' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Template</label>
              <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none">
                <option value="">Select a template…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.title ?? t.name} (v{t.version ?? '1.0'})</option>
                ))}
              </select>
              {selectedTemplate?.content && (
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {selectedTemplate.content.slice(0, 600)}…
                </div>
              )}
            </div>
          )}

          {/* Custom content */}
          {createMode === 'custom' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">MOU Title <span className="text-red-500">*</span></label>
                <input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Employer Partnership Agreement — ACME Corp"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">MOU Content <span className="text-red-500">*</span></label>
                <textarea value={customContent} onChange={(e) => setCustomContent(e.target.value)}
                  rows={10}
                  placeholder="Enter the full MOU text here. You can use plain text or HTML."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none font-mono" />
              </div>
            </>
          )}

          {/* Partner info */}
          <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Partner / Company Name</label>
              <input value={partnerName} onChange={(e) => setPartnerName(e.target.value)}
                placeholder="ACME Corporation"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Partner Email (to send)</label>
              <input type="email" value={partnerEmail} onChange={(e) => setPartnerEmail(e.target.value)}
                placeholder="contact@partner.com"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Expiry Date (optional)</label>
              <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none" />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button onClick={createMou} disabled={saving ||
              (createMode === 'from_template' && !selectedTemplateId) ||
              (createMode === 'custom' && (!customTitle || !customContent))}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-blue-700 transition disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {saving ? 'Creating…' : partnerEmail ? 'Create & Send' : 'Create MOU'}
            </button>
            <button onClick={() => setTab('agreements')}
              className="text-sm text-slate-500 hover:text-slate-800">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
