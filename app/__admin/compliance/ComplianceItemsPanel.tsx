'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, FileText } from 'lucide-react';

type Evidence = {
  id: string;
  file_url: string;
  file_name: string;
  uploaded_at: string;
};

type ComplianceItem = {
  id: string;
  title: string;
  category: string;
  status: 'compliant' | 'non_compliant' | 'pending' | 'not_applicable';
  description: string | null;
  last_reviewed_at: string | null;
  compliance_evidence: Evidence[];
};

const STATUS_STYLES: Record<string, string> = {
  compliant: 'bg-green-100 text-green-700',
  non_compliant: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
  not_applicable: 'bg-slate-100 text-slate-500',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  compliant: <CheckCircle className="w-4 h-4 text-green-600" />,
  non_compliant: <XCircle className="w-4 h-4 text-red-600" />,
  pending: <Clock className="w-4 h-4 text-yellow-600" />,
  not_applicable: <FileText className="w-4 h-4 text-slate-400" />,
};

const STATUSES = ['compliant', 'non_compliant', 'pending', 'not_applicable'];

export default function ComplianceItemsPanel() {
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/compliance/items')
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d?.error ?? 'Failed to load compliance items');
        setItems(d.items ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load compliance items'))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: string) {
    setSaving(id);
    const res = await fetch('/api/compliance/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: status as ComplianceItem['status'] } : item,
        ),
      );
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? 'Update failed');
    }
    setSaving(null);
  }

  const byCategory = items.reduce<Record<string, ComplianceItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const compliantCount = items.filter((i) => i.status === 'compliant').length;
  const nonCompliantCount = items.filter((i) => i.status === 'non_compliant').length;
  const pendingCount = items.filter((i) => i.status === 'pending').length;

  if (loading) return <div className="text-slate-400 text-sm py-4">Loading compliance items…</div>;
  if (error) return <div className="text-red-600 text-sm py-4">{error}</div>;
  if (items.length === 0) {
    return (
      <div className="text-slate-500 text-sm py-4">
        No compliance checklist items found. Verify compliance seed data and admin DB access.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Compliance Checklist</h2>
        <div className="flex gap-3 text-sm">
          <span className="text-green-700 font-medium">{compliantCount} compliant</span>
          <span className="text-red-700 font-medium">{nonCompliantCount} non-compliant</span>
          <span className="text-yellow-700 font-medium">{pendingCount} pending</span>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(byCategory).map(([category, categoryItems]) => (
          <div
            key={category}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden"
          >
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                {category}
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {categoryItems.map((item) => (
                <div key={item.id}>
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50"
                    onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                  >
                    {STATUS_ICONS[item.status]}
                    <span className="flex-1 text-sm text-slate-800">{item.title}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[item.status]}`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                    {item.last_reviewed_at && (
                      <span className="text-xs text-slate-400 hidden sm:block">
                        {new Date(item.last_reviewed_at).toLocaleDateString()}
                      </span>
                    )}
                    {expanded === item.id ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  {expanded === item.id && (
                    <div className="px-4 pb-4 bg-slate-50 border-t border-slate-100">
                      {item.description && (
                        <p className="text-sm text-slate-600 mt-3 mb-3">{item.description}</p>
                      )}

                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-slate-500">Update status:</span>
                        {STATUSES.map((s) => (
                          <button
                            key={s}
                            disabled={saving === item.id || item.status === s}
                            onClick={() => updateStatus(item.id, s)}
                            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                              item.status === s
                                ? 'border-slate-300 bg-white text-slate-400 cursor-default'
                                : 'border-slate-300 hover:border-blue-400 hover:text-blue-600 text-slate-600'
                            } disabled:opacity-50`}
                          >
                            {s.replace('_', ' ')}
                          </button>
                        ))}
                      </div>

                      {item.compliance_evidence?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">Evidence</p>
                          <div className="space-y-1">
                            {item.compliance_evidence.map((ev) => (
                              <a
                                key={ev.id}
                                href={ev.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs text-blue-600 hover:underline"
                              >
                                <FileText className="w-3 h-3" />
                                {ev.file_name}
                                <span className="text-slate-400">
                                  {new Date(ev.uploaded_at).toLocaleDateString()}
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
