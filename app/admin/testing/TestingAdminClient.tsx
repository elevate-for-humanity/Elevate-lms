'use client';

import { useState } from 'react';
import {
  CheckCircle, Clock, XCircle, Search,
  Calendar, Users, User, Building2, X,
  AlertCircle, Plus, Trash2,
} from 'lucide-react';
import { CERT_PROVIDERS } from '@/lib/testing/proctoring-capabilities';

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

interface Slot {
  id: string;
  exam_type: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  location: string;
  notes: string | null;
  is_cancelled: boolean;
}

interface Props {
  bookings: Booking[];
  slots: Slot[];
  stats: { pending: number; confirmed: number; total: number };
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  const parsed = new Date(d + 'T12:00:00');
  if (isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

export default function TestingAdminClient({ bookings: initial, slots: initialSlots, stats }: Props) {
  const [bookings, setBookings] = useState<Booking[]>(initial);
  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [tab, setTab] = useState<'bookings' | 'slots'>('bookings');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<Booking | null>(null);

  // Slot creation form state
  const [slotForm, setSlotForm] = useState({
    exam_type: '',
    date: '',
    start_time: '09:00',
    end_time: '11:00',
    capacity: 10,
    notes: '',
  });
  const [creatingSlot, setCreatingSlot] = useState(false);
  const [slotError, setSlotError] = useState('');

  async function handleCreateSlot(e: React.FormEvent) {
    e.preventDefault();
    if (!slotForm.exam_type || !slotForm.date) {
      setSlotError('Exam type and date are required.');
      return;
    }
    setCreatingSlot(true);
    setSlotError('');
    try {
      const start = new Date(`${slotForm.date}T${slotForm.start_time}:00`);
      const end   = new Date(`${slotForm.date}T${slotForm.end_time}:00`);
      const res = await fetch('/api/testing/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_type:  slotForm.exam_type,
          start_time: start.toISOString(),
          end_time:   end.toISOString(),
          capacity:   slotForm.capacity,
          notes:      slotForm.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create slot');
      setSlots(prev => [...prev, data.slot].sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      ));
      setSlotForm({ exam_type: '', date: '', start_time: '09:00', end_time: '11:00', capacity: 10, notes: '' });
    } catch (err: unknown) {
      setSlotError(err instanceof Error ? err.message : 'Failed to create slot');
    } finally {
      setCreatingSlot(false);
    }
  }

  async function handleCancelSlot(id: string) {
    if (!confirm('Cancel this slot? Candidates with bookings will need to be notified manually.')) return;
    const res = await fetch(`/api/testing/slots?id=${id}`, { method: 'DELETE' });
    if (res.ok) setSlots(prev => prev.filter(s => s.id !== id));
  }
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

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-8 w-fit">
        {(['bookings', 'slots'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${
              tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {t === 'slots' ? 'Availability Slots' : 'Bookings'}
          </button>
        ))}
      </div>

      {/* ── SLOTS TAB ── */}
      {tab === 'slots' && (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Create slot form */}
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Availability Slot
            </h2>
            <form onSubmit={handleCreateSlot} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Exam Type *</label>
                <select required value={slotForm.exam_type}
                  onChange={e => setSlotForm(f => ({ ...f, exam_type: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none bg-white">
                  <option value="">Select exam</option>
                  {Object.values(CERT_PROVIDERS).filter(p => p.status === 'active').map(p => (
                    <option key={p.key} value={p.key}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date *</label>
                <input required type="date" value={slotForm.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setSlotForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Start Time *</label>
                  <input required type="time" value={slotForm.start_time}
                    onChange={e => setSlotForm(f => ({ ...f, start_time: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">End Time *</label>
                  <input required type="time" value={slotForm.end_time}
                    onChange={e => setSlotForm(f => ({ ...f, end_time: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Capacity (seats)</label>
                <input type="number" min={1} max={50} value={slotForm.capacity}
                  onChange={e => setSlotForm(f => ({ ...f, capacity: parseInt(e.target.value) || 1 }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes (optional)</label>
                <input type="text" value={slotForm.notes} placeholder="e.g. Room 2, bring ID"
                  onChange={e => setSlotForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none" />
              </div>
              {slotError && (
                <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{slotError}</p>
              )}
              <button type="submit" disabled={creatingSlot}
                className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                {creatingSlot ? 'Creating…' : 'Create Slot'}
              </button>
            </form>
          </div>

          {/* Upcoming slots list */}
          <div>
            <h2 className="font-bold text-slate-900 mb-4">Upcoming Slots ({slots.length})</h2>
            {slots.length === 0 ? (
              <div className="bg-white rounded-2xl border p-8 text-center text-slate-500 text-sm">
                No upcoming slots. Create one to start accepting bookings.
              </div>
            ) : (
              <div className="space-y-3">
                {slots.map(slot => {
                  const provider = Object.values(CERT_PROVIDERS).find(p => p.key === slot.exam_type);
                  const start = new Date(slot.start_time);
                  const end   = new Date(slot.end_time);
                  const seatsLeft = slot.capacity - slot.booked_count;
                  return (
                    <div key={slot.id} className="bg-white rounded-xl border p-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">{provider?.name ?? slot.exam_type}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          {' · '}
                          {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          {' – '}
                          {end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            seatsLeft === 0 ? 'bg-red-100 text-red-700' :
                            seatsLeft <= 3 ? 'bg-amber-100 text-amber-700' :
                            'bg-brand-green-100 text-brand-green-700'
                          }`}>
                            {seatsLeft}/{slot.capacity} seats
                          </span>
                          {slot.notes && <span className="text-xs text-slate-400">{slot.notes}</span>}
                        </div>
                      </div>
                      <button onClick={() => handleCancelSlot(slot.id)}
                        className="shrink-0 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Cancel slot">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── BOOKINGS TAB ── */}
      {tab === 'bookings' && <>

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
              <button onClick={() => setSelected(null)} aria-label="Close" className="text-slate-400 hover:text-slate-700">
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
      </> /* end bookings tab */}
    </div>
  );
}
