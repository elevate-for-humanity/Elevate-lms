'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle2, AlertTriangle, Edit3, X,
  Sparkles, ChevronRight, Loader2, PenLine, Database,
  FileText, User, Wand2,
} from 'lucide-react';

type FieldMeta = {
  source: string;
  confidence: number;
  ai_drafted: boolean;
  label: string;
};

type Run = {
  id: string;
  status: string;
  response_style: string;
  matched_values: Record<string, string> | null;
  missing_values: Record<string, string> | null;
  approved_values: Record<string, string> | null;
  field_metadata: Record<string, FieldMeta> | null;
  created_at: string;
};

type FieldDef = {
  field_key: string;
  label: string;
  field_type: string;
  required: boolean;
  sort_order: number;
};

const SOURCE_BADGE: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
  repository_verified:  { label: 'Repository verified', cls: 'bg-green-50 text-green-700 border-green-200',   Icon: Database },
  uploaded_document:    { label: 'Uploaded document',   cls: 'bg-blue-50 text-blue-700 border-blue-200',      Icon: FileText },
  manual_admin_input:   { label: 'Admin input',         cls: 'bg-slate-50 text-slate-700 border-slate-200',   Icon: User },
  ai_drafted_narrative: { label: 'AI-drafted narrative',cls: 'bg-purple-50 text-purple-700 border-purple-200',Icon: Sparkles },
  needs_admin_input:    { label: 'Needs admin input',   cls: 'bg-red-50 text-red-700 border-red-200',         Icon: AlertTriangle },
};

const HUMANIZE_CONTROLS = [
  { value: 'make_more_formal',            label: 'More formal' },
  { value: 'make_more_concise',           label: 'More concise' },
  { value: 'make_more_persuasive',        label: 'More persuasive' },
  { value: 'make_more_compliance_focused',label: 'Compliance focus' },
  { value: 'remove_fluff',               label: 'Remove fluff' },
  { value: 'add_measurable_outcomes',    label: 'Add outcomes' },
  { value: 'use_founder_voice',          label: 'Founder voice' },
];

function SourceBadge({ source }: { source: string }) {
  const cfg = SOURCE_BADGE[source] ?? SOURCE_BADGE['needs_admin_input'];
  const { label, cls, Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
}

export default function PrefillReviewClient({
  contractId,
  contractTitle,
  run,
  fields,
  previewUrl,
  isPdf,
}: {
  contractId: string;
  contractTitle: string;
  run: Run;
  fields: FieldDef[];
  previewUrl: string | null;
  isPdf: boolean;
}) {
  const [matched, setMatched]   = useState<Record<string, string>>(run.matched_values ?? {});
  const [missing, setMissing]   = useState<Record<string, string>>(run.missing_values ?? {});
  const [approved, setApproved] = useState<Record<string, string>>(run.approved_values ?? {});
  const [metadata, setMetadata] = useState<Record<string, FieldMeta>>(run.field_metadata ?? {});

  const [editingKey, setEditingKey]   = useState<string | null>(null);
  const [editValue, setEditValue]     = useState('');
  const [saving, setSaving]           = useState<string | null>(null);
  const [humanizing, setHumanizing]   = useState<string | null>(null);
  const [humanizedPreview, setHumanizedPreview] = useState<{ key: string; value: string } | null>(null);
  const [error, setError]             = useState<string | null>(null);

  // Build ordered field list
  const orderedFields = fields.length > 0
    ? fields
    : Object.keys({ ...matched, ...missing }).map((k, i) => ({
        field_key: k,
        label: metadata[k]?.label ?? k.replace(/_/g, ' '),
        field_type: 'text',
        required: true,
        sort_order: i,
      }));

  const approvedCount = Object.keys(approved).length;
  const missingCount  = Object.keys(missing).length;
  const totalCount    = orderedFields.length;

  const callApi = useCallback(async (body: Record<string, unknown>) => {
    const res = await fetch('/api/admin/contracts/approve-field', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ run_id: run.id, ...body }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
    return data;
  }, [run.id]);

  async function approveField(key: string) {
    setSaving(key);
    setError(null);
    try {
      await callApi({ field_key: key, action: 'approve' });
      const val = matched[key] ?? approved[key] ?? '';
      setApproved(p => ({ ...p, [key]: val }));
      setMissing(p => { const n = { ...p }; delete n[key]; return n; });
      setMetadata(p => ({ ...p, [key]: { ...p[key], source: 'manual_admin_input' } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setSaving(null);
    }
  }

  async function saveEdit(key: string) {
    setSaving(key);
    setError(null);
    try {
      await callApi({ field_key: key, action: 'edit', value: editValue });
      setApproved(p => ({ ...p, [key]: editValue }));
      setMatched(p => ({ ...p, [key]: editValue }));
      setMissing(p => { const n = { ...p }; delete n[key]; return n; });
      setMetadata(p => ({ ...p, [key]: { ...p[key], source: 'manual_admin_input', ai_drafted: false } }));
      setEditingKey(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(null);
    }
  }

  async function rejectField(key: string) {
    setSaving(key);
    setError(null);
    try {
      await callApi({ field_key: key, action: 'reject' });
      setApproved(p => { const n = { ...p }; delete n[key]; return n; });
      setMissing(p => ({ ...p, [key]: '' }));
      setMetadata(p => ({ ...p, [key]: { ...p[key], source: 'needs_admin_input' } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setSaving(null);
    }
  }

  async function humanizeField(key: string, control: string) {
    setHumanizing(key);
    setError(null);
    try {
      const data = await callApi({ field_key: key, action: 'humanize', humanize_control: control });
      setHumanizedPreview({ key, value: data.humanized_value });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Humanization failed');
    } finally {
      setHumanizing(null);
    }
  }

  function acceptHumanized() {
    if (!humanizedPreview) return;
    setMatched(p => ({ ...p, [humanizedPreview.key]: humanizedPreview.value }));
    setHumanizedPreview(null);
  }

  const isTextarea = (key: string) => {
    const f = fields.find(f => f.field_key === key);
    return f?.field_type === 'textarea' || (matched[key]?.length ?? 0) > 200;
  };

  const isApproved = (key: string) => key in approved;
  const isMissing  = (key: string) => key in missing && !(key in approved);
  const currentVal = (key: string) => approved[key] ?? matched[key] ?? '';

  return (
    <div className="flex h-full overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Left: document preview */}
      <div className="hidden lg:flex flex-col w-1/2 border-r border-slate-200 overflow-hidden">
        <div className="flex-shrink-0 px-4 py-3 border-b border-slate-100 bg-white flex items-center gap-2">
          <Link href={`/admin/contracts/${contractId}`} className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-sm font-semibold text-slate-700 truncate">{contractTitle}</span>
        </div>
        <div className="flex-1 overflow-hidden bg-slate-100 p-2">
          {previewUrl && isPdf ? (
            <iframe src={previewUrl} className="w-full h-full rounded-lg border border-slate-200 bg-white" title={contractTitle} />
          ) : previewUrl ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
              <FileText className="w-10 h-10" />
              <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                className="text-sm text-slate-600 hover:underline">Open original file</a>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              Preview unavailable
            </div>
          )}
        </div>
      </div>

      {/* Right: field review */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link href={`/admin/contracts/${contractId}`} className="text-slate-400 hover:text-slate-600 lg:hidden">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <h2 className="text-base font-bold text-slate-900">Review Fields</h2>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="text-green-600 font-medium">{approvedCount} approved</span>
                <span>·</span>
                <span className={missingCount > 0 ? 'text-red-600 font-medium' : 'text-slate-400'}>
                  {missingCount} need input
                </span>
                <span>·</span>
                <span>{totalCount} total</span>
              </div>
            </div>
            {missingCount === 0 && (
              <Link
                href={`/admin/contracts/${contractId}/sign?run=${run.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 transition-colors"
              >
                <PenLine className="w-4 h-4" /> Proceed to sign
              </Link>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-300"
              style={{ width: totalCount > 0 ? `${(approvedCount / totalCount) * 100}%` : '0%' }}
            />
          </div>
        </div>

        {error && (
          <div className="flex-shrink-0 mx-6 mt-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Humanized preview banner */}
        {humanizedPreview && (
          <div className="flex-shrink-0 mx-6 mt-3 rounded-xl bg-purple-50 border border-purple-200 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-700 flex items-center gap-1">
                <Wand2 className="w-3.5 h-3.5" /> Humanized version — review before accepting
              </span>
              <button onClick={() => setHumanizedPreview(null)} className="text-purple-400 hover:text-purple-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{humanizedPreview.value}</p>
            <div className="flex gap-2">
              <button onClick={acceptHumanized}
                className="rounded-lg bg-purple-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-800 transition-colors">
                Use this version
              </button>
              <button onClick={() => setHumanizedPreview(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Fields list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {orderedFields.map(f => {
            const key = f.field_key;
            const val = currentVal(key);
            const meta = metadata[key];
            const approved_ = isApproved(key);
            const missing_  = isMissing(key);
            const isEditing = editingKey === key;
            const isSaving  = saving === key;
            const isHumanizing_ = humanizing === key;
            const isNarrative = isTextarea(key);

            return (
              <div
                key={key}
                className={`rounded-xl border p-4 transition-colors ${
                  approved_ ? 'border-green-200 bg-green-50/30' :
                  missing_  ? 'border-red-200 bg-red-50/20' :
                              'border-slate-200 bg-white'
                }`}
              >
                {/* Field header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800">{f.label}</span>
                    {f.required && <span className="text-xs text-red-500">required</span>}
                    {meta?.source && <SourceBadge source={meta.source} />}
                    {approved_ && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                      </span>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    ) : isEditing ? (
                      <>
                        <button onClick={() => saveEdit(key)}
                          className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-700 transition-colors">
                          Save
                        </button>
                        <button onClick={() => setEditingKey(null)}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {!approved_ && val && (
                          <button onClick={() => approveField(key)}
                            className="rounded-lg bg-green-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-800 transition-colors">
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => { setEditingKey(key); setEditValue(val); }}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {approved_ && (
                          <button onClick={() => rejectField(key)}
                            className="rounded-lg border border-red-200 p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                            title="Reject / clear">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Value display or edit */}
                {isEditing ? (
                  isNarrative ? (
                    <textarea
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      rows={6}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300 font-sans resize-y"
                    />
                  ) : (
                    <input
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                    />
                  )
                ) : val ? (
                  <p className={`text-sm text-slate-700 ${isNarrative ? 'whitespace-pre-wrap' : ''}`}>
                    {val}
                  </p>
                ) : (
                  <p className="text-sm text-red-500 italic">No value — admin input required</p>
                )}

                {/* Humanization controls for narrative fields */}
                {isNarrative && val && !isEditing && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {HUMANIZE_CONTROLS.map(ctrl => (
                      <button
                        key={ctrl.value}
                        onClick={() => humanizeField(key, ctrl.value)}
                        disabled={isHumanizing_}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-colors"
                      >
                        {isHumanizing_ ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                        {ctrl.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {orderedFields.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <AlertTriangle className="w-8 h-8" />
              <p className="text-sm">No fields found. Run extraction first.</p>
              <Link href={`/admin/contracts/${contractId}`}
                className="text-sm text-slate-600 hover:underline flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to contract
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        {orderedFields.length > 0 && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between gap-4 flex-wrap">
            <Link href={`/admin/contracts/${contractId}`}
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <div className="flex gap-2">
              {missingCount > 0 && (
                <p className="text-xs text-red-600 self-center">
                  {missingCount} field{missingCount !== 1 ? 's' : ''} still need input before signing
                </p>
              )}
              {missingCount === 0 && (
                <Link
                  href={`/admin/contracts/${contractId}/sign?run=${run.id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 transition-colors"
                >
                  <PenLine className="w-4 h-4" /> Proceed to sign <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
