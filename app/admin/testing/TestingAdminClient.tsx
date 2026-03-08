'use client';

import { useState } from 'react';
import {
  CheckCircle, Clock, XCircle, Search, Filter,
  Calendar, Users, User, Building2, ChevronDown, X,
  AlertCircle, Download,
} from 'lucide-react';

interface Booking {
  id: string;
  exam_type: string;
  exam_name: string;
  booking_type: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  participant_count: number;
  preferred_date: string;
  preferred_time: string;
  alternate_date: string | null;
  notes: string | null;
  status: string;
  confirmed_date: string | null;
  confirmed_time: string | null;
  confirmation_code: string;
  admin_notes: string | null;
  created_at: string;
}

interface Props {
  bookings: Booking[];
  stats: { pending: number; confirmed: number; total: number };
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-brand-green-100 text-brand-green-800',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-slate-100 text-slate-600',
    no_show: 'bg-orange-100 text-orange-800',
  };
  return map[status] ?? 'bg-slate-100 text-slate-600';
}

const STATUSES = ['all', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show'];

export default function TestingAdminClient({ bookings: initial, stats }: Props) {
  const [bookings, setBookings] = useState<Booking[]>(initial);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [confirmForm, setConfirmForm] = useState({ date: '', time: '', adminNotes: '' });

  const filtered = bookings.filter(b => {
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || [b.first_name, b.last_name, b.email, b.exam_name, b.confirmation_code, b.organization ?? '']
      .some(v => v.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  async function updateStatus(id: string, status: string, extra?: { confirmedDate?: string; confirmedTime?: string; adminNotes?: string }) {
    setUpdating(true);
    setUpdateError('');
    try {
      const res = await fetch(`/api/testing/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status, ...extra } : b));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status, ...extra } as Booking : null);
    } catch (e: any) {
      setUpdateError(e.message);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Testing Center</h1>
          <p className="text-slate-500 text-sm mt-1">Manage exam bookings, confirm seats, and track completions</p>
        </div>
        <a href="/testing/book" target="_blank"
          className="flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-blue-700">
          + New Booking
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'amber' },
          { label: 'Confirmed', value: stats.confirmed, icon: CheckCircle, color: 'brand-green' },
          { label: 'Total', value: stats.total, icon: Calendar, color: 'brand-blue' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border p-5">
            <div className={`w-9 h-9 rounded-lg bg-${color}-100 flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 text-${color}-600`} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">{label}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, exam, or code…"
            className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition ${
                statusFilter === s ? 'bg-brand-blue-600 text-white' : 'bg-white border text-slate-600 hover:border-brand-blue-300'
              }`}>{s === 'all' ? `All (${bookings.length})` : s.replace('_', ' ')}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No bookings found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  {['Code', 'Name', 'Exam', 'Type', 'Date / Time', 'Seats', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-brand-blue-700">{b.confirmation_code}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{b.first_name} {b.last_name}</p>
                      <p className="text-xs text-slate-400">{b.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 max-w-[180px] truncate">{b.exam_name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        {b.booking_type === 'organization' ? <Building2 className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                        {b.booking_type === 'organization' ? b.organization : 'Individual'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800">{fmtDate(b.confirmed_date ?? b.preferred_date)}</p>
                      <p className="text-xs text-slate-400">{b.confirmed_time ?? b.preferred_time}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="flex items-center gap-1 text-slate-700">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {b.participant_count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusBadge(b.status)}`}>
                        {b.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setSelected(b); setConfirmForm({ date: b.preferred_date, time: b.preferred_time, adminNotes: b.admin_notes ?? '' }); }}
                        className="text-xs text-brand-blue-600 hover:underline font-medium">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40" onClick={() => setSelected(null)}>
          <div className="bg-white h-full w-full max-w-lg shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
              <div>
                <h2 className="font-bold text-slate-900">Booking {selected.confirmation_code}</h2>
                <p className="text-xs text-slate-400">{selected.first_name} {selected.last_name}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Details */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                {[
                  ['Exam', selected.exam_name],
                  ['Type', selected.booking_type === 'organization' ? `Organization — ${selected.organization} (${selected.participant_count} seats)` : 'Individual'],
                  ['Email', selected.email],
                  ['Phone', selected.phone ?? '—'],
                  ['Preferred Date', `${fmtDate(selected.preferred_date)} at ${selected.preferred_time}`],
                  ...(selected.alternate_date ? [['Alternate Date', fmtDate(selected.alternate_date)]] : []),
                  ...(selected.notes ? [['Notes', selected.notes]] : []),
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-3">
                    <span className="text-slate-400 w-28 flex-shrink-0">{label}</span>
                    <span className="text-slate-900 font-medium">{value}</span>
                  </div>
                ))}
              </div>

              {/* Confirm form */}
              {selected.status === 'pending' && (
                <div className="border rounded-xl p-5 space-y-4">
                  <h3 className="font-semibold text-slate-900">Confirm Seat</h3>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Confirmed Date</label>
                    <input type="date" value={confirmForm.date} onChange={e => setConfirmForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Confirmed Time</label>
                    <input value={confirmForm.time} onChange={e => setConfirmForm(f => ({ ...f, time: e.target.value }))}
                      placeholder="e.g. 10:00 AM"
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Admin Notes</label>
                    <textarea value={confirmForm.adminNotes} onChange={e => setConfirmForm(f => ({ ...f, adminNotes: e.target.value }))}
                      rows={2} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none resize-none" />
                  </div>
                  {updateError && (
                    <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" /> {updateError}
                    </div>
                  )}
                  <button onClick={() => updateStatus(selected.id, 'confirmed', {
                    confirmedDate: confirmForm.date,
                    confirmedTime: confirmForm.time,
                    adminNotes: confirmForm.adminNotes,
                  })} disabled={updating || !confirmForm.date || !confirmForm.time}
                    className="w-full flex items-center justify-center gap-2 bg-brand-green-600 text-white font-semibold py-2.5 rounded-xl hover:bg-brand-green-700 disabled:opacity-50">
                    {updating ? 'Confirming…' : <><CheckCircle className="w-4 h-4" /> Confirm & Notify Candidate</>}
                  </button>
                </div>
              )}

              {/* Status actions */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { status: 'completed', label: 'Mark Completed', color: 'bg-slate-700 text-white hover:bg-slate-800' },
                    { status: 'no_show', label: 'No Show', color: 'bg-orange-500 text-white hover:bg-orange-600' },
                    { status: 'cancelled', label: 'Cancel', color: 'bg-red-600 text-white hover:bg-red-700' },
                    { status: 'pending', label: 'Reset to Pending', color: 'bg-white border text-slate-700 hover:bg-slate-50' },
                  ].filter(a => a.status !== selected.status).map(({ status, label, color }) => (
                    <button key={status} onClick={() => updateStatus(selected.id, status)} disabled={updating}
                      className={`py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 ${color}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
