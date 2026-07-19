'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
  Link2,
  X,
  Building2,
} from 'lucide-react';

type Doc = {
  id: string;
  title: string | null;
  file_name: string | null;
  document_type: string | null;
  file_url: string | null;
  url: string | null;
  extraction_status: string | null;
  extracted_data: Record<string, unknown> | null;
  ocr_text: string | null;
  created_at: string;
};

type Mapping = {
  id: string;
  field_key: string;
  field_value: string | null;
  target_table: string | null;
  target_column: string | null;
  target_row_id: string | null;
  approved: boolean;
  approved_at: string | null;
};

type OrgFact = {
  fact_key: string;
  fact_value_json: unknown;
  status: string;
  approved_at: string | null;
};

type Org = {
  id: string;
  legal_name: string | null;
  dba_name: string | null;
  ein: string | null;
  uei: string | null;
  sam_status: string | null;
  phone: string | null;
  general_email: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  authorized_signatory_name: string | null;
  authorized_signatory_title: string | null;
} | null;

// Flat org fields for quick lookup
const ORG_FIELD_MAP: Record<string, string> = {
  legal_name: 'Legal Name',
  dba_name: 'DBA Name',
  ein: 'EIN',
  uei: 'UEI',
  sam_status: 'SAM Status',
  phone: 'Phone',
  general_email: 'Email',
  address_line_1: 'Address Line 1',
  address_line_2: 'Address Line 2',
  city: 'City',
  state: 'State',
  zip: 'ZIP',
  authorized_signatory_name: 'Authorized Signatory',
  authorized_signatory_title: 'Signatory Title',
};

function factVal(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v !== null && 'value' in v) return String((v as Record<string, unknown>).value);
  return String(v);
}

function suggestOrgValue(key: string, org: Org, facts: OrgFact[]): string | null {
  if (!org) return null;
  const lower = key.toLowerCase();

  // Direct org column match
  for (const [col] of Object.entries(ORG_FIELD_MAP)) {
    if (lower.includes(col.replace('_', '')) || lower.includes(col)) {
      const val = (org as Record<string, unknown>)[col];
      if (val) return String(val);
    }
  }

  // Fuzzy matches
  if (lower.includes('ein') || lower.includes('tax')) return org.ein ?? null;
  if (lower.includes('uei') || lower.includes('cage')) return org.uei ?? null;
  if (lower.includes('sam')) return org.sam_status ?? null;
  if (lower.includes('legal') || lower.includes('organization') || lower.includes('org name')) return org.legal_name ?? null;
  if (lower.includes('signatory') || lower.includes('authorized')) return org.authorized_signatory_name ?? null;
  if (lower.includes('title') && lower.includes('sign')) return org.authorized_signatory_title ?? null;
  if (lower.includes('email')) return org.general_email ?? null;
  if (lower.includes('phone') || lower.includes('tel')) return org.phone ?? null;
  if (lower.includes('address')) return [org.address_line_1, org.city, org.state, org.zip].filter(Boolean).join(', ') || null;
  if (lower.includes('city')) return org.city ?? null;
  if (lower.includes('state')) return org.state ?? null;
  if (lower.includes('zip') || lower.includes('postal')) return org.zip ?? null;

  // Check org facts
  const fact = facts.find(f => f.fact_key.toLowerCase().includes(lower) || lower.includes(f.fact_key.toLowerCase()));
  if (fact) return factVal(fact.fact_value_json);

  return null;
}

export default function FieldMapClient({
  doc,
  mappings: initialMappings,
  orgFacts,
  org,
}: {
  doc: Doc;
  mappings: Mapping[];
  orgFacts: OrgFact[];
  org: Org;
}) {
  const [mappings, setMappings] = useState<Mapping[]>(initialMappings);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOcr, setShowOcr] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);

  // Extracted fields from document
  const extractedFields = useMemo(() => {
    const data = doc.extracted_data ?? {};
    return Object.entries(data).map(([key, value]) => ({
      key,
      value: String(value ?? ''),
      suggestion: suggestOrgValue(key, org, orgFacts),
    }));
  }, [doc.extracted_data, org, orgFacts]);

  const mappingByKey = useMemo(() => {
    const m: Record<string, Mapping> = {};
    for (const mp of mappings) m[mp.field_key] = mp;
    return m;
  }, [mappings]);

  async function saveMapping(fieldKey: string, fieldValue: string, targetTable: string, targetColumn: string) {
    setSaving(fieldKey);
    setError(null);
    try {
      const existing = mappingByKey[fieldKey];
      const res = await fetch('/api/admin/documents/mappings', {
        method: existing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: existing?.id,
          document_id: doc.id,
          field_key: fieldKey,
          field_value: fieldValue,
          target_table: targetTable || null,
          target_column: targetColumn || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { mapping } = await res.json();
      setMappings(prev => {
        const next = prev.filter(m => m.field_key !== fieldKey);
        return [...next, mapping];
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(null);
    }
  }

  async function approveMapping(mappingId: string, fieldKey: string) {
    setSaving(fieldKey);
    try {
      const res = await fetch('/api/admin/documents/mappings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: mappingId, approved: true }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { mapping } = await res.json();
      setMappings(prev => prev.map(m => (m.id === mappingId ? mapping : m)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Approve failed');
    } finally {
      setSaving(null);
    }
  }

  async function autoFillAll() {
    setAutoFilling(true);
    setError(null);
    try {
      for (const field of extractedFields) {
        if (!field.suggestion) continue;
        const existing = mappingByKey[field.key];
        if (existing?.approved) continue; // don't overwrite approved
        await saveMapping(field.key, field.suggestion, 'sos_organizations', field.key);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Auto-fill failed');
    } finally {
      setAutoFilling(false);
    }
  }

  const approvedCount = mappings.filter(m => m.approved).length;
  const totalFields = extractedFields.length;
  const mappedCount = mappings.length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/documents/${doc.id}`}
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Field Mapping</h1>
              <p className="text-sm text-slate-500">{doc.title ?? doc.file_name ?? 'Document'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-500">
              {approvedCount}/{totalFields} approved
            </div>
            <button
              onClick={autoFillAll}
              disabled={autoFilling || totalFields === 0}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {autoFilling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Auto-fill from Org Profile
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Document preview / OCR text */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <FileText className="w-4 h-4 text-slate-400" />
                Document Preview
              </div>
              {doc.ocr_text && (
                <button
                  onClick={() => setShowOcr(!showOcr)}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                >
                  {showOcr ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {showOcr ? 'Hide' : 'Show'} OCR text
                </button>
              )}
            </div>

            {(doc.file_url ?? doc.url) ? (
              <iframe
                src={doc.file_url ?? doc.url ?? ''}
                className="w-full h-[500px] border-0"
                title="Document preview"
              />
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                No preview available
              </div>
            )}

            {showOcr && doc.ocr_text && (
              <div className="border-t border-slate-100 p-4">
                <p className="text-xs font-medium text-slate-500 mb-2">Extracted Text</p>
                <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
                  {doc.ocr_text}
                </pre>
              </div>
            )}
          </div>

          {/* Org profile summary */}
          {org && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-violet-500" />
                <span className="text-sm font-medium text-slate-700">Org Profile (prefill source)</span>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                {Object.entries(ORG_FIELD_MAP).map(([col, label]) => {
                  const val = (org as Record<string, unknown>)[col];
                  if (!val) return null;
                  return (
                    <div key={col} className="contents">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="text-slate-800 font-medium truncate">{String(val)}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          )}
        </div>

        {/* Right: Field mapping table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">
              Extracted Fields
              <span className="ml-2 text-slate-400 font-normal">
                {mappedCount} mapped · {approvedCount} approved
              </span>
            </h2>
          </div>

          {extractedFields.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No fields extracted yet.</p>
              <Link
                href={`/admin/documents/${doc.id}`}
                className="mt-2 inline-block text-sm text-violet-600 hover:underline"
              >
                Run extraction first →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {extractedFields.map(field => {
                const mapping = mappingByKey[field.key];
                const isSaving = saving === field.key;

                return (
                  <FieldRow
                    key={field.key}
                    fieldKey={field.key}
                    extractedValue={field.value}
                    suggestion={field.suggestion}
                    mapping={mapping}
                    isSaving={isSaving}
                    onSave={saveMapping}
                    onApprove={approveMapping}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldRow({
  fieldKey,
  extractedValue,
  suggestion,
  mapping,
  isSaving,
  onSave,
  onApprove,
}: {
  fieldKey: string;
  extractedValue: string;
  suggestion: string | null;
  mapping: Mapping | undefined;
  isSaving: boolean;
  onSave: (key: string, value: string, table: string, column: string) => Promise<void>;
  onApprove: (id: string, key: string) => Promise<void>;
}) {
  const [editValue, setEditValue] = useState(mapping?.field_value ?? suggestion ?? extractedValue);
  const [targetTable, setTargetTable] = useState(mapping?.target_table ?? 'sos_organizations');
  const [targetColumn, setTargetColumn] = useState(mapping?.target_column ?? fieldKey);
  const [expanded, setExpanded] = useState(false);

  const isApproved = mapping?.approved ?? false;
  const isMapped = !!mapping;
  const hasChange = editValue !== (mapping?.field_value ?? '');

  return (
    <div
      className={`bg-white rounded-lg border transition-colors ${
        isApproved
          ? 'border-green-200 bg-green-50/30'
          : isMapped
          ? 'border-violet-200'
          : 'border-slate-200'
      }`}
    >
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <code className="text-xs font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                {fieldKey}
              </code>
              {isApproved && (
                <span className="flex items-center gap-1 text-xs text-green-700">
                  <CheckCircle2 className="w-3 h-3" /> Approved
                </span>
              )}
              {!isMapped && suggestion && (
                <span className="flex items-center gap-1 text-xs text-violet-600">
                  <Sparkles className="w-3 h-3" /> Suggestion available
                </span>
              )}
            </div>

            {/* Extracted value */}
            <p className="text-xs text-slate-400 truncate">
              Extracted: <span className="text-slate-600">{extractedValue || '—'}</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mapped value preview */}
        {isMapped && !expanded && (
          <div className="mt-2 flex items-center gap-2">
            <Link2 className="w-3 h-3 text-violet-400 shrink-0" />
            <span className="text-xs text-slate-700 truncate">{mapping.field_value ?? '—'}</span>
            <span className="text-xs text-slate-400">→ {mapping.target_table}.{mapping.target_column}</span>
          </div>
        )}
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
          {/* Value editor */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Mapped Value</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                disabled={isApproved}
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
              {suggestion && editValue !== suggestion && (
                <button
                  onClick={() => setEditValue(suggestion)}
                  className="text-xs text-violet-600 hover:text-violet-800 whitespace-nowrap"
                >
                  Use suggestion
                </button>
              )}
            </div>
            {suggestion && (
              <p className="text-xs text-slate-400 mt-1">
                Org suggestion: <span className="text-violet-600">{suggestion}</span>
              </p>
            )}
          </div>

          {/* Target mapping */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Target Table</label>
              <select
                value={targetTable}
                onChange={e => setTargetTable(e.target.value)}
                disabled={isApproved}
                className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-slate-50"
              >
                <option value="sos_organizations">sos_organizations</option>
                <option value="grant_applications">grant_applications</option>
                <option value="profiles">profiles</option>
                <option value="programs">programs</option>
                <option value="">— none —</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Target Column</label>
              <input
                type="text"
                value={targetColumn}
                onChange={e => setTargetColumn(e.target.value)}
                disabled={isApproved}
                placeholder="column_name"
                className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-slate-50"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            {!isApproved && (
              <button
                onClick={() => onSave(fieldKey, editValue, targetTable, targetColumn)}
                disabled={isSaving || (!hasChange && isMapped)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save
              </button>
            )}
            {isMapped && !isApproved && (
              <button
                onClick={() => onApprove(mapping!.id, fieldKey)}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                Approve
              </button>
            )}
            {isApproved && (
              <span className="text-xs text-green-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Approved
                {mapping?.approved_at && (
                  <span className="text-slate-400 ml-1">
                    {new Date(mapping.approved_at).toLocaleDateString()}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
