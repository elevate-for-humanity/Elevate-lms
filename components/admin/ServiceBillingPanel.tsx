'use client';
import { useEffect, useState, type FormEvent } from 'react';
import {
  BILLING_SERVICES,
  billingSignals,
  type ServiceBillingRecord,
  type BillingServiceId,
} from '@/lib/admin/service-billing-policy';

const money = (n: number | null | undefined) =>
  n == null
    ? 'Not verified'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const stamp = (s: string) =>
  new Date(s).toLocaleString('en-US', { timeZone: 'America/New_York', timeZoneName: 'short' });

export function ServiceBillingPanel() {
  const [records, setRecords] = useState<ServiceBillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState<BillingServiceId | null>(null);
  const [saving, setSaving] = useState(false);
  // Keep the form's revision with its values even if background polling refreshes cards.
  const [editingRecord, setEditingRecord] = useState<ServiceBillingRecord | undefined>();
  async function load(signal?: AbortSignal) {
    try {
      const response = await fetch('/api/admin/service-billing', { cache: 'no-store', signal });
      if (!response.ok) throw Error();
      const body = await response.json();
      if (!signal?.aborted) {
        setRecords(body.records);
        setError('');
      }
    } catch {
      if (!signal?.aborted)
        setError(
          'Current billing records could not be loaded. Open the provider links below to verify payments directly.',
        );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    const timer = window.setInterval(() => void load(controller.signal), 300000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || saving) return;
    const form = new FormData(event.currentTarget);
    const previous = editingRecord;
    const number = (key: string) => (form.get(key) === '' ? null : Number(form.get(key)));
    const verifiedAt = new Date(String(form.get('observedAt')));
    if (!Number.isFinite(verifiedAt.getTime())) {
      setNotice('Enter the time these billing values were verified.');
      return;
    }
    const record = {
      serviceId: editing,
      enabled: form.get('enabled') === 'on',
      currency: 'USD',
      balance: number('balance'),
      warningBalance: number('warningBalance'),
      criticalBalance: number('criticalBalance'),
      amountDue: number('amountDue'),
      dueDate: String(form.get('dueDate') || '') || null,
      paymentStatus: String(form.get('paymentStatus')),
      warningDays: number('warningDays'),
      observedAt: verifiedAt.toISOString(),
      reference: String(form.get('reference') || ''),
      notes: String(form.get('notes') || ''),
      autoRefresh: form.get('autoRefresh') === 'on',
    };
    setSaving(true);
    setNotice('');
    try {
      const response = await fetch('/api/admin/service-billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record, expectedRevision: previous?.revision ?? null }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Billing record could not be saved.');
      setRecords((rows) => [...rows.filter((r) => r.serviceId !== editing), result.record]);
      setEditing(null);
      window.dispatchEvent(new Event('service-billing-updated'));
      if (result.refreshRequired) {
        setError(
          'Record saved, but its current revision could not be reloaded. Refresh billing before another edit.',
        );
      }
      setNotice(
        result.alertsAvailable
          ? 'Verified record saved. Any new billing warnings were checked.'
          : 'Record saved. Alert delivery needs attention; check the Admin notification bell.',
      );
    } catch (failure) {
      setNotice(
        failure instanceof Error ? failure.message : 'Save failed. Refresh before retrying.',
      );
    } finally {
      setSaving(false);
    }
  }
  const selected = editingRecord;
  const attention = records.filter((r) => billingSignals(r).length).length;
  return (
    <section
      id="service-billing"
      aria-labelledby="service-billing-title"
      className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-5">
        <div>
          <h2 id="service-billing-title" className="text-xl font-black text-slate-950">
            Service bills, balances & payment links
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Keep service payments visible before an interruption. Record verified invoices and
            balances, set warning levels, and open official provider billing to pay.
          </p>
          <p className="mt-2 text-xs text-slate-600">
            Admin bell alerts and pushes to registered devices are checked hourly by the existing
            spending monitor, and after saving. Device permission and a working push configuration
            are required. Twilio can refresh from its connected account. Other balances remain
            recorded observations until a provider feed is connected.
          </p>
        </div>
        <button
          type="button"
          className="min-h-11 rounded-lg border px-4 font-bold"
          onClick={() => void load()}
        >
          Refresh billing
        </button>
      </div>
      {error && (
        <p role="alert" className="m-5 rounded-lg bg-rose-50 p-3 text-rose-900">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="m-5 rounded-lg bg-blue-50 p-3 text-blue-950">
          {notice}
        </p>
      )}
      <div className="flex flex-wrap gap-3 px-5 pt-5 text-sm font-semibold">
        <span>{attention} services need attention</span>
        <span className="text-slate-500">
          {BILLING_SERVICES.length - records.length} need verified billing records
        </span>
        {loading && <span>Loading records…</span>}
      </div>
      <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
        {BILLING_SERVICES.map((service) => {
          const record = records.find((r) => r.serviceId === service.id);
          const signals = record ? billingSignals(record) : [];
          const critical = signals.some((s) => s.severity === 'critical');
          return (
            <article
              key={service.id}
              className={`min-w-0 rounded-xl border p-4 ${critical ? 'border-rose-300 bg-rose-50' : signals.length ? 'border-amber-300 bg-amber-50' : 'border-slate-200'}`}
            >
              <h3 className="font-black text-slate-950">{service.name}</h3>
              <p className="mt-1 text-xs text-slate-600">{service.purpose}</p>
              <p className="mt-3 text-sm font-bold">
                {!record
                  ? 'Needs setup'
                  : !record.enabled
                    ? 'Alerts paused'
                    : signals.length
                      ? 'Needs attention'
                      : 'No recorded billing warning'}
              </p>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between gap-3">
                  <dt>Available balance</dt>
                  <dd>{money(record?.balance)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Invoice amount</dt>
                  <dd>{money(record?.amountDue)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Payment status</dt>
                  <dd className="capitalize">{record?.paymentStatus || 'Not verified'}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Due date (Eastern)</dt>
                  <dd>{record?.dueDate || 'Not verified'}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-slate-600">
                {record
                  ? `Record checked ${stamp(record.observedAt)} · ${record.source}`
                  : 'No verified balance or due date is recorded.'}
              </p>
              {record?.balanceCheckedAt && (
                <p className="mt-1 text-xs text-slate-600">
                  Twilio balance checked {stamp(record.balanceCheckedAt)}
                </p>
              )}
              {record?.reference && (
                <p className="mt-1 break-words text-xs">Reference: {record.reference}</p>
              )}
              {record?.notes && (
                <p className="mt-2 break-words text-xs text-slate-700">{record.notes}</p>
              )}
              {signals.length > 0 && (
                <ul className="mt-3 list-disc space-y-2 pl-4 text-xs">
                  {signals.map((s) => (
                    <li key={s.kind}>{s.message}</li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex flex-col gap-2">
                <a
                  href={service.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-lg bg-blue-700 px-3 py-2 text-sm font-bold text-white"
                >
                  {service.linkLabel} ↗
                </a>
                <button
                  type="button"
                  disabled={loading || !!error || saving}
                  className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold disabled:opacity-50"
                  onClick={() => {
                    setEditingRecord(record ? { ...record } : undefined);
                    setEditing(service.id);
                    setNotice('');
                  }}
                >
                  Update verified billing
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {editing && (
        <form
          key={`${editing}:${editingRecord?.revision ?? 'new'}`}
          onSubmit={save}
          className="m-5 space-y-4 rounded-xl border-2 border-blue-300 bg-blue-50 p-5"
        >
          <h3 className="text-lg font-black">
            Update {BILLING_SERVICES.find((s) => s.id === editing)?.name}
          </h3>
          <p className="text-sm">
            Copy current values from the provider. Leave unavailable amounts blank. Saving a paid
            invoice does not replenish a wallet or schedule another payment.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ['balance', 'Available balance (USD)', selected?.balance],
                ['amountDue', 'Invoice amount (USD)', selected?.amountDue],
                ['warningBalance', 'Low-balance warning (USD)', selected?.warningBalance ?? 20],
                ['criticalBalance', 'Critical balance (USD)', selected?.criticalBalance ?? 5],
                ['warningDays', 'Warn before due (days)', selected?.warningDays ?? 7],
              ] as const
            ).map(([name, label, value]) => (
              <label key={name} className="text-sm font-semibold">
                {label}
                <input
                  name={name}
                  type="number"
                  step={name === 'warningDays' ? 1 : '0.01'}
                  min={name === 'balance' ? undefined : name === 'warningDays' ? 1 : 0}
                  max={name === 'warningDays' ? 90 : 1000000000}
                  required={!['balance', 'amountDue'].includes(name)}
                  defaultValue={value ?? ''}
                  className="mt-1 min-h-11 w-full rounded-lg border bg-white p-2"
                />
              </label>
            ))}
            <label className="text-sm font-semibold">
              Payment status
              <select
                name="paymentStatus"
                defaultValue={selected?.paymentStatus || 'unknown'}
                className="mt-1 min-h-11 w-full rounded-lg border bg-white p-2"
              >
                {['unknown', 'due', 'failed', 'paid'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Due date (Eastern)
              <input
                name="dueDate"
                type="date"
                defaultValue={selected?.dueDate || ''}
                className="mt-1 min-h-11 w-full rounded-lg border bg-white p-2"
              />
            </label>
            <label className="text-sm font-semibold">
              Verified at (your device time)
              <input
                name="observedAt"
                type="datetime-local"
                required
                defaultValue={new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                  .toISOString()
                  .slice(0, 16)}
                className="mt-1 min-h-11 w-full rounded-lg border bg-white p-2"
              />
            </label>
            <label className="text-sm font-semibold">
              Invoice / receipt reference
              <input
                name="reference"
                maxLength={120}
                defaultValue={selected?.reference || ''}
                className="mt-1 min-h-11 w-full rounded-lg border bg-white p-2"
              />
            </label>
          </div>
          <label className="block text-sm font-semibold">
            Notes (no credentials, card details or private payment links)
            <textarea
              name="notes"
              maxLength={500}
              defaultValue={selected?.notes || ''}
              className="mt-1 w-full rounded-lg border bg-white p-2"
            />
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
            <input name="enabled" type="checkbox" defaultChecked={selected?.enabled ?? true} />
            Monitor this service and send billing alerts
          </label>
          {editing === 'twilio' && (
            <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
              <input
                name="autoRefresh"
                type="checkbox"
                defaultChecked={selected?.autoRefresh ?? false}
              />
              Refresh the connected Twilio balance automatically (read only)
            </label>
          )}
          <div className="flex gap-3">
            <button
              disabled={saving}
              className="min-h-11 rounded-lg bg-blue-700 px-4 font-bold text-white"
            >
              {saving ? 'Saving…' : 'Save verified record'}
            </button>
            <button
              type="button"
              disabled={saving}
              className="min-h-11 rounded-lg border px-4"
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
