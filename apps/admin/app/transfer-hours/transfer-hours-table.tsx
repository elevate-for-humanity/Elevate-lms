'use client';

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { approveTransferHours, denyTransferHours } from './actions';

interface TransferHour {
  id: string;
  enrollment_id: string;
  hours_requested: number;
  hours_approved?: number | null;
  category?: string | null;
  evidence_description?: string | null;
  evidence_file_url?: string | null;
  status: string;
  reviewed_at?: string | null;
  notes?: string | null;
  created_at: string;
  enrollment?: {
    student?: { full_name?: string | null; email?: string | null } | null;
    program?: { name?: string | null; title?: string | null; slug?: string | null } | null;
  } | null;
}

export function TransferHoursTable({ transferHours }: { transferHours: TransferHour[] }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');
  const [selected, setSelected] = useState<TransferHour | null>(null);
  const [approvedHours, setApprovedHours] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => transferHours.filter((row) => {
    const program = row.enrollment?.program?.title || row.enrollment?.program?.name || row.enrollment?.program?.slug || '';
    const student = row.enrollment?.student?.full_name || row.enrollment?.student?.email || '';
    const needle = search.toLowerCase();
    return (filter === 'all' || row.status === filter) && `${student} ${program}`.toLowerCase().includes(needle);
  }), [transferHours, search, filter]);

  async function approve() {
    if (!selected) return;
    setSaving(true);
    try {
      await approveTransferHours(selected.id, Number(approvedHours) || selected.hours_requested, notes);
      toast.success('Transfer hours approved');
      window.location.reload();
    } catch {
      toast.error('Failed to approve request');
    } finally {
      setSaving(false);
    }
  }

  async function deny() {
    if (!selected) return;
    setSaving(true);
    try {
      await denyTransferHours(selected.id, notes);
      toast.success('Transfer request denied');
      window.location.reload();
    } catch {
      toast.error('Failed to deny request');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student or program" className="min-w-64 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm" />
        <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="all">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="denied">Denied</option></select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50"><tr>{['Student','Program','Requested','Approved','Category','Status','Evidence','Action'].map((label) => <th key={label} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? <tr><td colSpan={8} className="p-8 text-center text-slate-500">No transfer-hour requests match this view.</td></tr> : rows.map((row) => {
              const program = row.enrollment?.program?.title || row.enrollment?.program?.name || row.enrollment?.program?.slug || 'Program not recorded';
              return <tr key={row.id} className="hover:bg-slate-50"><td className="px-4 py-3"><p className="font-bold text-slate-900">{row.enrollment?.student?.full_name || 'Unknown student'}</p><p className="text-xs text-slate-500">{row.enrollment?.student?.email || '—'}</p></td><td className="px-4 py-3 text-slate-700">{program}</td><td className="px-4 py-3 font-bold text-slate-900">{row.hours_requested}</td><td className="px-4 py-3 text-slate-700">{row.hours_approved ?? '—'}</td><td className="px-4 py-3 text-slate-700">{row.category || '—'}</td><td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black capitalize text-slate-700">{row.status}</span></td><td className="px-4 py-3">{row.evidence_file_url ? <a href={row.evidence_file_url} target="_blank" rel="noreferrer" className="font-bold text-brand-blue-700 hover:underline">Open evidence</a> : row.evidence_description || '—'}</td><td className="px-4 py-3">{row.status === 'pending' ? <button type="button" onClick={() => { setSelected(row); setApprovedHours(String(row.hours_requested)); setNotes(row.notes || ''); }} className="rounded-lg bg-brand-blue-700 px-3 py-2 text-xs font-black text-white">Review</button> : '—'}</td></tr>;
            })}
          </tbody>
        </table>
      </div>

      {selected && <div className="border-t border-slate-200 bg-slate-50 p-5"><h3 className="font-black text-slate-950">Review transfer request</h3><p className="mt-1 text-sm text-slate-600">Requested: {selected.hours_requested} hours</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-bold text-slate-700">Approved hours<input type="number" min="0" max={selected.hours_requested} value={approvedHours} onChange={(event) => setApprovedHours(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="text-sm font-bold text-slate-700">Reviewer notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2" /></label></div><div className="mt-4 flex gap-3"><button type="button" disabled={saving} onClick={() => void approve()} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-black text-white disabled:opacity-50">Approve</button><button type="button" disabled={saving} onClick={() => void deny()} className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-black text-white disabled:opacity-50">Deny</button><button type="button" onClick={() => setSelected(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700">Cancel</button></div></div>}
    </section>
  );
}
