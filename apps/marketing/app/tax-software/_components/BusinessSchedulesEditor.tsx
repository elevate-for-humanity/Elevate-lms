'use client';
import { useEffect, useState } from 'react';
import {
  BUSINESS_EXPENSE_FIELDS,
  scheduleCBusinessSchema,
  scheduleCFromRow,
  type ScheduleCBusiness,
} from '@/lib/tax-software/calculation/schedule-c-2026';
type Entry = {
  id?: string;
  updatedAt?: string;
  business: ScheduleCBusiness;
  previousNet?: number;
  previousCosts?: number;
  previousExpenses?: Record<string, unknown>;
};
const blank = (): ScheduleCBusiness => ({
  owner: 'primary',
  businessName: '',
  principalActivity: '',
  businessCode: '',
  accountingMethod: 'cash',
  materiallyParticipates: false,
  newBusiness: false,
  paymentsRequire1099: false,
  required1099Filed: false,
  allInvestmentAtRisk: false,
  grossReceipts: 0,
  returnsAllowances: 0,
  otherIncome: 0,
  expenses: {},
  otherExpenses: [],
  reviewed: false,
});
function entry(row: Record<string, unknown>): Entry {
  const parsed = scheduleCFromRow(row);
  const oldExpenses =
    row.expenses && typeof row.expenses === 'object' && !Array.isArray(row.expenses)
      ? (row.expenses as Record<string, unknown>)
      : {};
  const knownExpenses = Object.fromEntries(
    BUSINESS_EXPENSE_FIELDS.filter(([key]) => typeof oldExpenses[key] === 'number').map(([key]) => [
      key,
      oldExpenses[key],
    ]),
  );
  const b = parsed ?? {
    ...blank(),
    businessName: String(row.business_name ?? ''),
    businessCode: String(row.business_code ?? ''),
    ein: typeof row.ein === 'string' ? row.ein : undefined,
    owner: row.income_owner === 'spouse' ? 'spouse' : 'primary',
    accountingMethod: row.accounting_method === 'accrual' ? 'accrual' : 'cash',
    expenses: knownExpenses,
    grossReceipts: Number(row.gross_receipts ?? 0),
    returnsAllowances: Number(row.returns_allowances ?? 0),
    otherIncome: Number(row.other_income ?? 0),
  };
  return {
    id: String(row.id),
    updatedAt: String(row.updated_at),
    business: b,
    previousNet: parsed ? undefined : Number(row.net_profit ?? 0),
    previousCosts: parsed ? undefined : Number(row.cost_of_goods_sold ?? 0),
    previousExpenses: parsed ? undefined : oldExpenses,
  };
}
export function BusinessSchedulesEditor({
  returnId,
  joint,
  onSaved,
}: {
  returnId: string;
  joint: boolean;
  onSaved: () => void;
}) {
  const [rows, setRows] = useState<Entry[]>([]),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  async function load() {
    const r = await fetch('/api/tax/returns/business?returnId=' + encodeURIComponent(returnId), {
      cache: 'no-store',
    });
    const b = await r.json();
    if (!r.ok) throw new Error(b.error || 'Unable to load businesses');
    setRows((b.businesses as Record<string, unknown>[]).map(entry));
  }
  useEffect(() => {
    let active = true;
    void fetch('/api/tax/returns/business?returnId=' + encodeURIComponent(returnId), {
      cache: 'no-store',
    })
      .then(async (r) => {
        const b = await r.json();
        if (!r.ok) throw new Error(b.error || 'Unable to load businesses');
        if (active) setRows((b.businesses as Record<string, unknown>[]).map(entry));
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : 'Unable to load businesses');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [returnId]);
  const update = (i: number, patch: Partial<ScheduleCBusiness>) => {
    setRows((v) =>
      v.map((e, j) =>
        j === i
          ? { ...e, business: { ...e.business, ...patch, reviewed: patch.reviewed ?? false } }
          : e,
      ),
    );
    setMessage('');
  };
  async function save(e: Entry) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      scheduleCBusinessSchemaCheck(e.business);
      const r = await fetch('/api/tax/returns/business', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          returnId,
          businessId: e.id,
          expectedUpdatedAt: e.updatedAt,
          business: e.business,
        }),
      });
      const b = await r.json();
      if (!r.ok) {
        if (b.businessSaved) {
          await load();
          onSaved();
        }
        throw new Error(b.error || 'Unable to save business');
      }
      setRows((v) =>
        v.map((row) =>
          row === e
            ? {
                ...row,
                id: b.businessId,
                updatedAt: b.updatedAt,
                previousNet: undefined,
                previousExpenses: undefined,
                previousCosts: undefined,
              }
            : row,
        ),
      );
      onSaved();
      await load();
      setMessage(
        'Business saved. Recalculate and review your return, then authorize your signature again before export.',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save business');
    } finally {
      setBusy(false);
    }
  }
  async function remove(e: Entry, i: number) {
    if (!e.id) {
      setRows((v) => v.filter((_, j) => i !== j));
      return;
    }
    if (
      !window.confirm(
        'Remove this business from your return? Recalculate and review your return afterward.',
      )
    )
      return;
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/tax/returns/business', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ returnId, businessId: e.id, expectedUpdatedAt: e.updatedAt }),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error || 'Unable to remove business');
      setRows((v) => v.filter((row) => row.id !== e.id));
      onSaved();
      await load();
      setMessage('Business removed. Recalculate and review your return before signing.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to remove business');
    } finally {
      setBusy(false);
    }
  }
  const flags = [
    ['materiallyParticipates', 'I materially participated in this business'],
    ['newBusiness', 'I started or acquired this business during 2026'],
    ['paymentsRequire1099', 'Business payments require filing Forms 1099'],
    ['required1099Filed', 'I filed or will file required Forms 1099'],
    ['allInvestmentAtRisk', 'All investment in this business is at risk'],
  ] as const;
  return (
    <section className="mt-8 rounded-2xl border bg-white p-7">
      <h2 className="text-2xl font-bold">Business income and expenses</h2>
      <p className="mt-3 text-sm text-slate-600">
        Use one Schedule C per sole-proprietor business. Include income reported on Forms 1099-NEC
        in gross receipts. Once Schedule C records are saved, their reviewed totals are used for
        business income. Enter deductible expenses after reviewing IRS limits.
      </p>
      {rows.map((e, i) => {
        const b = e.business;
        return (
          <details key={e.id ?? 'new-' + i} open={!e.id} className="mt-5 rounded-xl border p-5">
            <summary className="cursor-pointer font-bold">
              {b.businessName || 'Business ' + (i + 1)}
            </summary>
            {e.previousNet !== undefined && (
              <p className="mt-3 text-sm">
                Previously recorded net profit: ${e.previousNet.toFixed(2)}. Review and enter the
                complete income and expense breakdown before saving this worksheet.
              </p>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(
                [
                  ['businessName', 'Business name, if separate'],
                  [
                    'principalActivity',
                    'Principal business or profession, including product or service',
                  ],
                  ['businessCode', 'Six-digit business activity code'],
                  ['ein', 'Business EIN, if issued; do not enter your SSN'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="text-sm font-semibold">
                  {label}
                  <input
                    autoComplete="off"
                    type={key === 'ein' ? 'password' : 'text'}
                    value={b[key] ?? ''}
                    onChange={(x) =>
                      update(i, { [key]: x.target.value || (key === 'ein' ? undefined : '') })
                    }
                    className="mt-2 w-full rounded border p-3"
                  />
                </label>
              ))}
              <label className="text-sm font-semibold">
                Business belongs to
                <select
                  value={b.owner}
                  onChange={(x) =>
                    update(i, { owner: x.target.value as ScheduleCBusiness['owner'] })
                  }
                  className="mt-2 w-full rounded border p-3"
                >
                  <option value="primary">Taxpayer</option>
                  {joint && <option value="spouse">Spouse</option>}
                </select>
              </label>
              <label className="text-sm font-semibold">
                Accounting method
                <select
                  value={b.accountingMethod}
                  onChange={(x) =>
                    update(i, {
                      accountingMethod: x.target.value as ScheduleCBusiness['accountingMethod'],
                    })
                  }
                  className="mt-2 w-full rounded border p-3"
                >
                  <option value="cash">Cash</option>
                  <option value="accrual">Accrual</option>
                </select>
              </label>
              {(
                [
                  ['grossReceipts', 'Gross receipts, including business Forms 1099'],
                  ['returnsAllowances', 'Returns and allowances'],
                  ['otherIncome', 'Other business income'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="text-sm font-semibold">
                  {label}
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={b[key]}
                    onChange={(x) => update(i, { [key]: Number(x.target.value) })}
                    className="mt-2 w-full rounded border p-3"
                  />
                </label>
              ))}
            </div>
            <div className="mt-4 grid gap-3">
              {flags.map(([key, label]) => (
                <label key={key} className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={b[key]}
                    onChange={(x) => update(i, { [key]: x.target.checked })}
                  />
                  {label}
                </label>
              ))}
            </div>
            <details className="mt-4 rounded border p-4">
              <summary className="cursor-pointer font-semibold">
                Deductible business expenses
              </summary>
              <p className="mt-3 text-sm">
                Enter expenses for business use of your home on the applicable home-office
                worksheet, rather than these ordinary-expense lines.
              </p>
              {e.previousExpenses && (
                <details className="mt-3 rounded border p-3">
                  <summary className="cursor-pointer text-sm font-semibold">
                    Previously recorded expense details
                  </summary>
                  <p className="mt-2 text-sm">
                    Cost of goods sold: ${e.previousCosts?.toFixed(2)}. Include the complete
                    inventory and expense breakdown in this worksheet before saving.
                  </p>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs">
                    {JSON.stringify(e.previousExpenses, null, 2)}
                  </pre>
                </details>
              )}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {BUSINESS_EXPENSE_FIELDS.map(([key, label]) => (
                  <label key={key} className="text-sm font-semibold">
                    {label}
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={b.expenses[key] ?? ''}
                      onChange={(x) =>
                        update(i, { expenses: { ...b.expenses, [key]: Number(x.target.value) } })
                      }
                      className="mt-2 w-full rounded border p-3"
                    />
                  </label>
                ))}
              </div>
              {b.otherExpenses.map((x, j) => (
                <div key={j} className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-semibold">
                    Other expense description
                    <input
                      value={x.description}
                      onChange={(v) =>
                        update(i, {
                          otherExpenses: b.otherExpenses.map((n, k) =>
                            j === k ? { ...n, description: v.target.value } : n,
                          ),
                        })
                      }
                      className="mt-2 w-full rounded border p-3"
                    />
                  </label>
                  <label className="text-sm font-semibold">
                    Deductible amount
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={x.amount}
                      onChange={(v) =>
                        update(i, {
                          otherExpenses: b.otherExpenses.map((n, k) =>
                            j === k ? { ...n, amount: Number(v.target.value) } : n,
                          ),
                        })
                      }
                      className="mt-2 w-full rounded border p-3"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      update(i, { otherExpenses: b.otherExpenses.filter((_, k) => j !== k) })
                    }
                    className="text-left font-semibold text-red-800"
                  >
                    Remove expense
                  </button>
                </div>
              ))}
              <button
                type="button"
                disabled={b.otherExpenses.length >= 20}
                onClick={() =>
                  update(i, { otherExpenses: [...b.otherExpenses, { description: '', amount: 0 }] })
                }
                className="mt-4 font-semibold text-red-800"
              >
                Add other expense
              </button>
            </details>
            <label className="mt-4 flex gap-3 text-sm">
              <input
                type="checkbox"
                checked={!!b.inventory}
                onChange={(x) =>
                  update(i, {
                    inventory: x.target.checked
                      ? {
                          method: 'cost',
                          beginning: 0,
                          purchases: 0,
                          labor: 0,
                          materials: 0,
                          otherCosts: 0,
                          ending: 0,
                        }
                      : undefined,
                  })
                }
              />
              This business has inventory or cost of goods sold
            </label>
            {b.inventory && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold">
                  Inventory valuation
                  <select
                    value={b.inventory.method}
                    onChange={(x) =>
                      update(i, {
                        inventory: {
                          ...b.inventory!,
                          method: x.target.value as 'cost' | 'lower_of_cost_or_market',
                        },
                      })
                    }
                    className="mt-2 w-full rounded border p-3"
                  >
                    <option value="cost">Cost</option>
                    <option value="lower_of_cost_or_market">Lower of cost or market</option>
                  </select>
                </label>
                {(
                  [
                    ['beginning', 'Beginning inventory'],
                    ['purchases', 'Purchases less personal withdrawals'],
                    ['labor', 'Cost of labor, excluding your own pay'],
                    ['materials', 'Materials and supplies'],
                    ['otherCosts', 'Other inventory costs'],
                    ['ending', 'Ending inventory'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="text-sm font-semibold">
                    {label}
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={b.inventory![key]}
                      onChange={(x) =>
                        update(i, { inventory: { ...b.inventory!, [key]: Number(x.target.value) } })
                      }
                      className="mt-2 w-full rounded border p-3"
                    />
                  </label>
                ))}
              </div>
            )}
            <label className="mt-5 flex items-start gap-3 font-semibold">
              <input
                type="checkbox"
                checked={b.reviewed}
                onChange={(x) => update(i, { reviewed: x.target.checked })}
              />
              I reviewed this business income, deductions and filing answers.
            </label>
            <div className="mt-5 flex flex-wrap gap-4">
              <button
                disabled={busy || !b.reviewed}
                type="button"
                onClick={() => void save(e)}
                className="rounded-xl bg-red-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
              >
                Save business worksheet
              </button>
              <button
                disabled={busy}
                type="button"
                onClick={() => void remove(e, i)}
                className="font-semibold text-red-800"
              >
                Remove business
              </button>
            </div>
          </details>
        );
      })}
      <button
        type="button"
        disabled={busy || loading}
        onClick={() => setRows((v) => [...v, { business: blank() }])}
        className="mt-5 rounded border px-4 py-2 font-semibold"
      >
        Add business
      </button>
      {error && (
        <p role="alert" className="mt-4 text-red-800">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mt-4 text-emerald-800">
          {message}
        </p>
      )}
      <a
        href="https://www.irs.gov/instructions/i1040sc"
        target="_blank"
        rel="noreferrer"
        className="mt-4 block text-sm font-semibold text-blue-800 underline"
      >
        IRS Schedule C instructions
      </a>
    </section>
  );
}
function scheduleCBusinessSchemaCheck(b: ScheduleCBusiness) {
  const parsed = scheduleCBusinessSchema.safeParse(b);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(`${issue.path.join('.')}: ${issue.message}`);
  }
}
