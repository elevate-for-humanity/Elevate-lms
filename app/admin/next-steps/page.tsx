'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import React from 'react';

import { useEffect, useMemo, useState } from 'react';

type Row = any;



export default function AdminNextStepsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [needs, setNeeds] = useState('');

  const [selected, setSelected] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (status) p.set('status', status);
    if (needs) p.set('needs', needs);
    return p.toString();
  }, [q, status, needs]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/next-steps?${queryString}`, {
      cache: 'no-store',
    });
    const json = await res.json();

    if (!res.ok) {
      setRows([]);
      setSummary(null);
      setLoading(false);
      return;
    }

    setRows(json.rows || []);
    setSummary(json.summary || null);
    setLoading(false);
  }

  async function savePatch(id: string, patch: Record<string, any>) {
    setSaving(true);
    const res = await fetch('/api/admin/next-steps/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, patch }),
    });
    const json = await res.json();
    setSaving(false);

    if (!res.ok) {
      alert(json?.error || 'Update failed');
      return;
    }

    // refresh list + update selected record
    await load();
    if (selected?.id === id) {
      setSelected((prev) => (prev ? { ...prev, ...patch } : prev));
    }
  }

  function downloadCsv() {
    const url = `/api/admin/next-steps/export?${queryString}`;
    window.open(url, '_blank');
  }

  useEffect(() => {
    load();
  }, [queryString]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">

      {/* Hero Image */}
      <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Next Steps' }]} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mt-4">
        <div>
          <h1 className="text-3xl font-bold">
            WorkOne / ICC Progress Dashboard
          </h1>
          <p className="mt-2 text-sm text-black leading-relaxed">
            Track inquiry → Indiana Career Connect → WorkOne appointment →
            funding → EFH onboarding → start date.
          </p>
        </div>
        <button
          onClick={downloadCsv}
          className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          Export CSV
        </button>
      </div>

      <div className="mt-6 grid gap-3 rounded-2xl border bg-white p-5 sm:grid-cols-4">
        <div>
          <label className="text-xs font-semibold text-black">Search</label>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            placeholder="Name, email, program…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-black">
            Funding status
          </label>
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-black">
            Needs attention
          </label>
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            value={needs}
            onChange={(e) => setNeeds(e.target.value)}
          >
            <option value="">All</option>
            <option value="appt">Missing appointment</option>
            <option value="docs">Missing docs</option>
            <option value="onboarding">Missing onboarding</option>
            <option value="start">Missing start date</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={load}
            className="w-full rounded-xl bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {summary && (
        <div className="mt-4 grid gap-3 sm:grid-cols-6">
          <Stat label="Total" value={summary.total} />
          <Stat label="Pending" value={summary.funding_pending} />
          <Stat label="Approved" value={summary.funding_approved} />
          <Stat label="Denied" value={summary.funding_denied} />
          <Stat label="Missing Appt" value={summary.appt_missing} />
          <Stat label="Missing Start" value={summary.start_missing} />
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border bg-white">
        <div className="border-b px-5 py-3 text-sm font-semibold">
          Students ({rows.length})
        </div>

        {loading ? (
          <div className="px-5 py-6 text-sm text-black">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-6 text-sm text-black">No results.</div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-black">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Program</th>
                  <th className="px-4 py-3">Progress</th>
                  <th className="px-4 py-3">Appointment</th>
                  <th className="px-4 py-3">Funding</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{r.student_name}</div>
                      <div className="text-xs text-black">
                        {r.student_email}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold">
                        {r.program_name || '—'}
                      </div>
                      <div className="text-xs text-black">
                        {r.program_slug || ''}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold">
                        {r.progress?.percent ?? 0}%
                      </div>
                      <div className="text-xs text-black">
                        {r.progress?.done ?? 0}/{r.progress?.total ?? 8}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {r.workone_appointment_scheduled ? (
                        <div>
                          <div className="font-semibold">
                            {r.workone_appointment_date || 'Scheduled'}
                          </div>
                          <div className="text-xs text-black">
                            {r.workone_appointment_time || ''}{' '}
                            {r.workone_location
                              ? `• ${r.workone_location}`
                              : ''}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-brand-red-700">
                          Missing
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold capitalize">
                        {r.funding_status}
                      </div>
                      <div className="text-xs text-black">
                        {r.funding_type || '—'}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-lg border px-2 py-2 text-xs font-semibold hover:bg-gray-50"
                          onClick={() => setSelected(r)}
                        >
                          Quick Edit
                        </button>

                        <button
                          className="rounded-lg border px-2 py-2 text-xs font-semibold hover:bg-gray-50"
                          disabled={saving}
                          onClick={() =>
                            savePatch(r.id, {
                              funding_status: 'approved',
                              funding_status_updated_at:
                                new Date().toISOString(),
                            })
                          }
                        >
                          Approve
                        </button>

                        <button
                          className="rounded-lg border px-2 py-2 text-xs font-semibold hover:bg-gray-50"
                          disabled={saving}
                          onClick={() =>
                            savePatch(r.id, {
                              funding_status: 'denied',
                              funding_status_updated_at:
                                new Date().toISOString(),
                            })
                          }
                        >
                          Deny
                        </button>

                        <button
                          className="rounded-lg border px-2 py-2 text-xs font-semibold hover:bg-gray-50"
                          disabled={saving}
                          onClick={() =>
                            savePatch(r.id, {
                              workone_appointment_scheduled: true,
                            })
                          }
                        >
                          Appt Done
                        </button>

                        <button
                          className="rounded-lg border px-2 py-2 text-xs font-semibold hover:bg-gray-50"
                          disabled={saving}
                          onClick={() =>
                            savePatch(r.id, {
                              efh_onboarding_call_completed: true,
                              efh_onboarding_call_completed_at:
                                new Date().toISOString(),
                            })
                          }
                        >
                          Onboarded
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <QuickEdit
          row={selected}
          saving={saving}
          onClose={() => setSelected(null)}
          onSave={(patch) => savePatch(selected.id, patch)}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-xs font-semibold text-black">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value ?? 0}</div>
    </div>
  );
}

function QuickEdit({
  row,
  saving,
  onClose,
  onSave,
}: {
  row: any;
  saving: boolean;
  onClose: () => void;
  onSave: (patch: Record<string, any>) => void;
}) {
  const [workoneDate, setWorkoneDate] = useState(
    row.workone_appointment_date || ''
  );
  const [workoneTime, setWorkoneTime] = useState(
    row.workone_appointment_time || ''
  );
  const [workoneLocation, setWorkoneLocation] = useState(
    row.workone_location || ''
  );
  const [fundingType, setFundingType] = useState(row.funding_type || '');
  const [notes, setNotes] = useState(row.staff_notes || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-bold">Quick Edit</div>
            <div className="text-sm text-black">
              {row.student_name} • {row.program_name || '—'}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border px-3 py-2 text-sm font-semibold"
          >
            Close
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="text-xs font-semibold text-black">
              WorkOne Appt Date
            </label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="YYYY-MM-DD"
              value={workoneDate}
              onChange={(e) => setWorkoneDate(e.target.value)}
            />
          </div>

          <div className="sm:col-span-1">
            <label className="text-xs font-semibold text-black">
              WorkOne Appt Time
            </label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="10:30 AM"
              value={workoneTime}
              onChange={(e) => setWorkoneTime(e.target.value)}
            />
          </div>

          <div className="sm:col-span-1">
            <label className="text-xs font-semibold text-black">
              WorkOne Location
            </label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="EmployIndy / WorkOne…"
              value={workoneLocation}
              onChange={(e) => setWorkoneLocation(e.target.value)}
            />
          </div>

          <div className="sm:col-span-1">
            <label className="text-xs font-semibold text-black">
              Funding Type
            </label>
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              value={fundingType}
              onChange={(e) => setFundingType(e.target.value)}
            >
              <option value="">—</option>
              <option value="wioa">WIOA</option>
              <option value="wrg">WRG</option>
              <option value="jri">Job Ready Indy (Job Ready Indy)</option>
              <option value="employer_paid">Employer Paid</option>
              <option value="self_pay">Self Pay</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-black">
              Staff Notes
            </label>
            <textarea
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              rows={4}
              placeholder="What they told you, blockers, next call date…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            disabled={saving}
            onClick={() =>
              onSave({
                workone_appointment_scheduled:
                  !!workoneDate || row.workone_appointment_scheduled,
                workone_appointment_date: workoneDate || null,
                workone_appointment_time: workoneTime || null,
                workone_location: workoneLocation || null,
                funding_type: fundingType || null,
                staff_notes: notes || null,
              })
            }
            className="rounded-xl bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-700 transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>

          <button
            disabled={saving}
            onClick={() =>
              onSave({
                inquiry_submitted: true,
                inquiry_submitted_at: new Date().toISOString(),
              })
            }
            className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
          >
            Mark Inquiry Submitted
          </button>

          <button
            disabled={saving}
            onClick={() =>
              onSave({
                icc_account_created: true,
                icc_account_created_at: new Date().toISOString(),
              })
            }
            className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
          >
            Mark ICC Created
          </button>

          <button
            disabled={saving}
            onClick={() =>
              onSave({
                told_advisor_efh: true,
                told_advisor_efh_at: new Date().toISOString(),
              })
            }
            className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
          >
            Told Advisor &quot;EFH&quot;
          </button>

          <button
            disabled={saving}
            onClick={() =>
              onSave({
                advisor_docs_uploaded: true,
                advisor_docs_uploaded_at: new Date().toISOString(),
              })
            }
            className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
          >
            Docs Uploaded
          </button>

          <button
            disabled={saving}
            onClick={() =>
              onSave({
                program_start_confirmed: true,
                program_start_confirmed_at: new Date().toISOString(),
              })
            }
            className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
          >
            Start Confirmed
          </button>
        </div>
      </div>
    </div>
  );
}
