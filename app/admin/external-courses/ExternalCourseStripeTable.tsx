'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, Loader2, RefreshCw, ExternalLink } from 'lucide-react';

type PayerRule = 'sponsored' | 'always_student' | 'always_elevate';

interface Item {
  id: string;
  partner_name: string;
  title: string;
  is_required: boolean;
  cost_cents: number | null;
  payer_rule: PayerRule | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  is_active: boolean;
  programs: { id: string; title: string; slug: string } | null;
}

interface RowState {
  cost_cents: string;   // string for controlled input
  payer_rule: PayerRule;
  syncing: boolean;
  synced: boolean;
  error: string | null;
}

const PAYER_LABELS: Record<PayerRule, string> = {
  sponsored:      'Elevate-sponsored',
  always_student: 'Student pays',
  always_elevate: 'Elevate always pays',
};

export default function ExternalCourseStripeTable({ items }: { items: Item[] }) {
  const [rows, setRows] = useState<Record<string, RowState>>(() => {
    const init: Record<string, RowState> = {};
    for (const item of items) {
      init[item.id] = {
        cost_cents: item.cost_cents != null ? String(item.cost_cents) : '0',
        payer_rule: item.payer_rule ?? 'always_student',
        syncing: false,
        synced: false,
        error: null,
      };
    }
    return init;
  });

  function update(id: string, patch: Partial<RowState>) {
    setRows(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function syncRow(item: Item) {
    const row = rows[item.id];
    const cost = parseInt(row.cost_cents, 10);
    if (isNaN(cost) || cost < 0) {
      update(item.id, { error: 'Cost must be a non-negative integer (cents)' });
      return;
    }

    update(item.id, { syncing: true, error: null, synced: false });

    try {
      const res = await fetch(`/api/admin/external-courses/${item.id}/sync-stripe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cost_cents: cost, payer_rule: row.payer_rule }),
      });
      const json = await res.json();
      if (!res.ok) {
        update(item.id, { syncing: false, error: json.error ?? 'Sync failed' });
        return;
      }
      update(item.id, { syncing: false, synced: true });
    } catch {
      update(item.id, { syncing: false, error: 'Network error' });
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        No active external courses found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Program</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Partner / Course</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Required</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Cost (¢)</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Payer Rule</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Stripe</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map(item => {
            const row = rows[item.id];
            const isSynced = !!item.stripe_product_id || row.synced;

            return (
              <tr key={item.id} className="hover:bg-slate-50 transition">
                {/* Program */}
                <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  {item.programs?.title ?? <span className="text-slate-400 italic">—</span>}
                </td>

                {/* Partner / Course */}
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{item.partner_name}</div>
                  <div className="text-slate-500 text-xs">{item.title}</div>
                </td>

                {/* Required */}
                <td className="px-4 py-3 text-center">
                  {item.is_required
                    ? <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Required</span>
                    : <span className="text-xs text-slate-400">Optional</span>
                  }
                </td>

                {/* Cost in cents */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 text-xs">¢</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={row.cost_cents}
                      onChange={e => update(item.id, { cost_cents: e.target.value, synced: false })}
                      className="w-24 border border-slate-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                    />
                  </div>
                  {row.cost_cents !== '0' && (
                    <div className="text-xs text-slate-400 mt-0.5">
                      = ${(parseInt(row.cost_cents || '0', 10) / 100).toFixed(2)}
                    </div>
                  )}
                </td>

                {/* Payer rule */}
                <td className="px-4 py-3">
                  <select
                    value={row.payer_rule}
                    onChange={e => update(item.id, { payer_rule: e.target.value as PayerRule, synced: false })}
                    className="border border-slate-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  >
                    {(Object.keys(PAYER_LABELS) as PayerRule[]).map(k => (
                      <option key={k} value={k}>{PAYER_LABELS[k]}</option>
                    ))}
                  </select>
                </td>

                {/* Stripe status */}
                <td className="px-4 py-3">
                  {isSynced ? (
                    <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Synced
                      {item.stripe_product_id && (
                        <a
                          href={`https://dashboard.stripe.com/products/${item.stripe_product_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 text-slate-400 hover:text-slate-600"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Not synced</span>
                  )}
                  {row.error && (
                    <div className="flex items-center gap-1 text-red-600 text-xs mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {row.error}
                    </div>
                  )}
                </td>

                {/* Sync button */}
                <td className="px-4 py-3">
                  <button
                    onClick={() => syncRow(item)}
                    disabled={row.syncing}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-brand-blue-700 hover:bg-brand-blue-800 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                  >
                    {row.syncing
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> Syncing…</>
                      : <><RefreshCw className="w-3 h-3" /> Sync to Stripe</>
                    }
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
