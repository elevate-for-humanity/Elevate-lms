'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList, Calendar, Shield, TrendingUp,
  CheckCircle, XCircle, Clock, AlertTriangle,
  Users, Award, RefreshCw,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Booking {
  id: string; exam_type: string; exam_name: string;
  first_name: string; last_name: string; email: string;
  status: string; confirmed_date: string | null; confirmed_time: string | null;
  exam_result: string | null; payment_status: string | null;
  fee_cents: number | null; created_at: string;
  slot_id: string | null; attempts_used: number | null;
}

interface Session {
  id: string; student_name: string; student_email: string | null;
  provider: string; exam_name: string; status: string;
  result: string; score: number | null;
  started_at: string | null; completed_at: string | null;
  proctor_name: string; delivery_method: string;
  review_status: string; is_retest: boolean; created_at: string;
}

interface Slot {
  id: string; exam_type: string;
  start_time: string; end_time: string;
  capacity: number; booked_count: number;
  location: string | null; notes: string | null;
  is_cancelled: boolean;
}

interface Stats {
  totalBookings: number; confirmedBookings: number; pendingBookings: number;
  totalSessions: number; passed: number; failed: number;
  inProgress: number; flagged: number; noShows: number;
  passRate: number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const BOOKING_STATUS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-slate-100 text-slate-600',
  no_show:   'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
};

const SESSION_STATUS: Record<string, string> = {
  checked_in:  'bg-blue-100 text-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  completed:   'bg-green-100 text-green-800',
  voided:      'bg-slate-100 text-slate-600',
  no_show:     'bg-red-100 text-red-800',
};

const RESULT_BADGE: Record<string, string> = {
  pass:       'bg-green-100 text-green-800',
  fail:       'bg-red-100 text-red-800',
  incomplete: 'bg-yellow-100 text-yellow-800',
  pending:    'bg-slate-100 text-slate-600',
};

function slotStatus(slot: Slot): { label: string; cls: string } {
  if (slot.is_cancelled) return { label: 'cancelled', cls: 'bg-slate-100 text-slate-600' };
  if (slot.booked_count >= slot.capacity) return { label: 'full', cls: 'bg-amber-100 text-amber-800' };
  if (new Date(slot.end_time) < new Date()) return { label: 'completed', cls: 'bg-blue-100 text-blue-800' };
  return { label: 'open', cls: 'bg-green-100 text-green-800' };
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

// ── KPI Strip ─────────────────────────────────────────────────────────────────

function KpiStrip({ stats }: { stats: Stats }) {
  const kpis = [
    { label: 'Total Bookings',  value: stats.totalBookings,     icon: ClipboardList, color: 'text-blue-600 bg-blue-50' },
    { label: 'Confirmed',       value: stats.confirmedBookings, icon: CheckCircle,   color: 'text-green-600 bg-green-50' },
    { label: 'Pending',         value: stats.pendingBookings,   icon: Clock,         color: stats.pendingBookings > 0 ? 'text-amber-600 bg-amber-50' : 'text-slate-400 bg-slate-50' },
    { label: 'Sessions Run',    value: stats.totalSessions,     icon: Shield,        color: 'text-purple-600 bg-purple-50' },
    { label: 'Passed',          value: stats.passed,            icon: Award,         color: 'text-green-600 bg-green-50' },
    { label: 'Failed',          value: stats.failed,            icon: XCircle,       color: stats.failed > 0 ? 'text-red-600 bg-red-50' : 'text-slate-400 bg-slate-50' },
    { label: 'Pass Rate',       value: stats.passRate !== null ? `${stats.passRate}%` : '—', icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
    { label: 'Flagged',         value: stats.flagged,           icon: AlertTriangle, color: stats.flagged > 0 ? 'text-red-600 bg-red-50' : 'text-slate-400 bg-slate-50' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
      {kpis.map(k => (
        <div key={k.label} className="bg-white rounded-xl border p-3 shadow-sm">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${k.color}`}>
            <k.icon className="w-4 h-4" />
          </div>
          <p className="text-lg font-bold text-slate-900">{k.value}</p>
          <p className="text-xs text-slate-500 leading-tight">{k.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Bookings Tab ──────────────────────────────────────────────────────────────

function BookingsTab({ bookings }: { bookings: Booking[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = bookings.filter(b => {
    const name = `${b.first_name} ${b.last_name}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || b.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name or email…"
          className="border rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <div className="flex gap-2">
          {['all','pending','confirmed','cancelled','no_show','completed'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${statusFilter === s ? 'bg-blue-500 text-white' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}
            >
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <Link href="/admin/exam-authorizations" className="ml-auto text-xs text-blue-600 hover:underline">
          Exam Authorizations →
        </Link>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                {['Student','Exam','Date/Time','Status','Result','Payment','Attempts'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(b => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{b.first_name} {b.last_name}</p>
                    <p className="text-xs text-slate-500">{b.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-800">{b.exam_name || b.exam_type}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">
                    {b.confirmed_date ? `${formatDate(b.confirmed_date)} ${b.confirmed_time ?? ''}` : <span className="text-slate-400">Not scheduled</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${BOOKING_STATUS[b.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {b.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {b.exam_result
                      ? <span className={`px-2 py-0.5 rounded text-xs font-medium ${RESULT_BADGE[b.exam_result] ?? ''}`}>{b.exam_result}</span>
                      : <span className="text-slate-400 text-xs">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {b.payment_status ?? '—'}
                    {b.fee_cents ? ` · $${(b.fee_cents / 100).toFixed(0)}` : ''}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 text-center">
                    {b.attempts_used ?? 0}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No bookings match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Sessions Tab ──────────────────────────────────────────────────────────────

function SessionsTab({ sessions }: { sessions: Session[] }) {
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState('all');
  const [reviewFilter, setReviewFilter] = useState('all');

  const filtered = sessions.filter(s => {
    const matchSearch = !search || s.student_name.toLowerCase().includes(search.toLowerCase());
    const matchResult = resultFilter === 'all' || s.result === resultFilter;
    const matchReview = reviewFilter === 'all' || s.review_status === reviewFilter;
    return matchSearch && matchResult && matchReview;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search student…"
          className="border rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <div className="flex gap-2">
          {['all','pass','fail','incomplete','pending'].map(r => (
            <button key={r} onClick={() => setResultFilter(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${resultFilter === r ? 'bg-purple-500 text-white' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}>
              {r === 'all' ? 'All Results' : r}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {['all','flagged','under_review'].map(r => (
            <button key={r} onClick={() => setReviewFilter(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${reviewFilter === r ? 'bg-red-500 text-white' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}>
              {r === 'all' ? 'All Reviews' : r.replace('_', ' ')}
            </button>
          ))}
        </div>
        <Link href="/admin/proctor-portal" className="ml-auto text-xs text-purple-600 hover:underline">
          Proctor Portal →
        </Link>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                {['Student','Exam','Provider','Status','Result','Score','Proctor','Review','Date'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(s => (
                <tr key={s.id} className={`hover:bg-slate-50 ${['flagged','under_review'].includes(s.review_status) ? 'bg-red-50/40' : ''}`}>
                  <td className="px-3 py-3">
                    <p className="font-medium text-slate-900">{s.student_name}</p>
                    {s.is_retest && <span className="text-xs text-amber-600 font-medium">Retest</span>}
                  </td>
                  <td className="px-3 py-3 text-slate-700 text-xs">{s.exam_name}</td>
                  <td className="px-3 py-3 text-slate-600 text-xs capitalize">{s.provider?.replace(/_/g,' ')}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${SESSION_STATUS[s.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {s.status.replace('_',' ')}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${RESULT_BADGE[s.result] ?? 'bg-slate-100 text-slate-600'}`}>
                      {s.result}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-600 text-xs text-center">{s.score ?? '—'}</td>
                  <td className="px-3 py-3 text-slate-600 text-xs">{s.proctor_name}</td>
                  <td className="px-3 py-3">
                    {s.review_status !== 'clear'
                      ? <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">{s.review_status.replace('_',' ')}</span>
                      : <span className="text-slate-400 text-xs">clear</span>
                    }
                  </td>
                  <td className="px-3 py-3 text-slate-500 text-xs">{formatRelative(s.created_at)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">No sessions match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Schedule Tab ──────────────────────────────────────────────────────────────

function ScheduleTab({ slots }: { slots: Slot[] }) {
  const now = new Date();
  const upcoming = slots.filter(s => new Date(s.start_time) >= now && !s.is_cancelled);
  const past     = slots.filter(s => new Date(s.start_time) < now);

  function SlotCard({ slot }: { slot: Slot }) {
    const pct = slot.capacity > 0 ? Math.round((slot.booked_count / slot.capacity) * 100) : 0;
    const { label, cls } = slotStatus(slot);
    const start = new Date(slot.start_time);
    const end   = new Date(slot.end_time);
    const dateLabel = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const timeLabel = `${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} – ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    return (
      <div className={`bg-white rounded-xl border p-4 shadow-sm ${slot.is_cancelled ? 'opacity-60' : ''}`}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-semibold text-slate-900">{dateLabel}</p>
            <p className="text-xs text-slate-500 mt-0.5">{timeLabel}</p>
          </div>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>
        </div>
        <p className="text-sm text-slate-700 capitalize mb-2">{slot.exam_type?.replace(/_/g,' ')}</p>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${pct >= 100 ? 'bg-red-400' : pct >= 70 ? 'bg-amber-400' : 'bg-green-400'}`} style={{ width: `${Math.min(pct,100)}%` }} />
          </div>
          <span className="text-xs text-slate-500">{slot.booked_count}/{slot.capacity}</span>
        </div>
        {slot.location && <p className="text-xs text-slate-500">{slot.location}</p>}
        {slot.notes && <p className="text-xs text-slate-400 mt-1 italic">{slot.notes}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">Upcoming Slots ({upcoming.length})</h2>
        <Link href="/admin/exam-authorizations" className="text-xs text-blue-600 hover:underline">Manage Authorizations →</Link>
      </div>
      {upcoming.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcoming.map(s => <SlotCard key={s.id} slot={s} />)}
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-8 text-center text-slate-500">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p>No upcoming slots. Apply migration <code className="text-xs bg-slate-100 px-1 rounded">20260702000014_testing_center.sql</code> to seed slots.</p>
        </div>
      )}

      {past.length > 0 && (
        <>
          <h2 className="font-semibold text-slate-800">Past Slots ({past.length})</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {past.slice(0, 6).map(s => <SlotCard key={s.id} slot={s} />)}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Tab = 'bookings' | 'sessions' | 'schedule';

export default function TestingCenterClient({
  bookings, sessions, slots, stats,
}: {
  bookings: Booking[];
  sessions: Session[];
  slots: Slot[];
  stats: Stats;
}) {
  const [tab, setTab] = useState<Tab>('bookings');

  const tabs: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'bookings', label: 'Bookings',  icon: ClipboardList, count: bookings.length },
    { id: 'sessions', label: 'Sessions',  icon: Shield,        count: sessions.length },
    { id: 'schedule', label: 'Schedule',  icon: Calendar,      count: slots.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Testing Center</h1>
            <p className="text-slate-500 text-sm">Bookings · Sessions · Schedule · Outcomes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/proctor-portal"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Users className="w-4 h-4" />
            Proctor Portal
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <KpiStrip stats={stats} />

      {/* Flagged alert */}
      {stats.flagged > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span><strong>{stats.flagged}</strong> session{stats.flagged !== 1 ? 's' : ''} flagged for review.</span>
          <button onClick={() => setTab('sessions')} className="ml-auto text-xs font-semibold underline">View Sessions</button>
        </div>
      )}

      {/* In-progress alert */}
      {stats.inProgress > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <RefreshCw className="w-4 h-4 flex-shrink-0 animate-spin" />
          <span><strong>{stats.inProgress}</strong> session{stats.inProgress !== 1 ? 's' : ''} currently in progress.</span>
          <button onClick={() => setTab('sessions')} className="ml-auto text-xs font-semibold underline">View Sessions</button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${tab === t.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === 'bookings' && <BookingsTab bookings={bookings} />}
      {tab === 'sessions' && <SessionsTab sessions={sessions} />}
      {tab === 'schedule' && <ScheduleTab slots={slots} />}
    </div>
  );
}
