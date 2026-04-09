'use client';

/**
 * ApprenticeHoursHistory
 *
 * Shared hours-history page for cosmetology, nail-tech, and esthetician PWAs.
 * Shows all approved, pending, and rejected hour submissions grouped by week.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Clock, CheckCircle2, XCircle, AlertCircle,
  Loader2, Calendar, ChevronDown, ChevronUp, Plus,
} from 'lucide-react';

interface HoursEntry {
  id: string;
  date: string;
  hours: number;
  minutes?: number;
  category: string;
  notes?: string;
  status: 'approved' | 'pending' | 'rejected';
  rejectionReason?: string;
  submittedAt: string;
}

interface WeekGroup {
  weekLabel: string;
  weekStart: string;
  totalHours: number;
  entries: HoursEntry[];
}

const STATUS_CONFIG = {
  approved: {
    label: 'Approved',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    classes: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  pending: {
    label: 'Pending',
    icon: <Clock className="w-3.5 h-3.5" />,
    classes: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  rejected: {
    label: 'Rejected',
    icon: <XCircle className="w-3.5 h-3.5" />,
    classes: 'text-red-700 bg-red-50 border-red-200',
  },
};

function groupByWeek(entries: HoursEntry[]): WeekGroup[] {
  const map = new Map<string, WeekGroup>();

  for (const entry of entries) {
    const d = new Date(entry.date);
    // Week starts Monday
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    const key = monday.toISOString().split('T')[0];

    if (!map.has(key)) {
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      map.set(key, {
        weekStart: key,
        weekLabel: `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        totalHours: 0,
        entries: [],
      });
    }

    const group = map.get(key)!;
    group.entries.push(entry);
    if (entry.status === 'approved') group.totalHours += entry.hours + (entry.minutes ?? 0) / 60;
  }

  return Array.from(map.values()).sort((a, b) => b.weekStart.localeCompare(a.weekStart));
}

function EntryRow({ entry }: { entry: HoursEntry }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[entry.status];
  const entryDate = new Date(entry.date);

  return (
    <div className="border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3 py-3 px-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-900">
              {entryDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.classes}`}>
              {cfg.icon} {cfg.label}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 capitalize">{entry.category.replace(/_/g, ' ')}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-base font-black text-slate-900">
            {entry.hours}{entry.minutes ? `.${Math.round(entry.minutes / 6)}` : ''}h
          </span>
          {(entry.notes || entry.rejectionReason) && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Toggle details"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          {entry.notes && (
            <div className="bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm text-slate-600">
              <span className="font-semibold text-slate-700">Note: </span>{entry.notes}
            </div>
          )}
          {entry.rejectionReason && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 text-sm text-red-700">
              <span className="font-semibold">Rejection reason: </span>{entry.rejectionReason}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WeekCard({ group }: { group: WeekGroup }) {
  const [open, setOpen] = useState(true);
  const hasPending  = group.entries.some(e => e.status === 'pending');
  const hasRejected = group.entries.some(e => e.status === 'rejected');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <div className="text-left">
            <p className="text-sm font-bold text-slate-900">{group.weekLabel}</p>
            <p className="text-xs text-slate-500">
              {group.totalHours.toFixed(1)}h approved
              {hasPending && ' · pending review'}
              {hasRejected && ' · some rejected'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasPending && <span className="w-2 h-2 bg-amber-400 rounded-full" />}
          {hasRejected && <span className="w-2 h-2 bg-red-400 rounded-full" />}
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100">
          {group.entries
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map(entry => <EntryRow key={entry.id} entry={entry} />)}
        </div>
      )}
    </div>
  );
}

interface Props {
  discipline: string;
  apiPath: string;
  backHref: string;
  accentColor: string;
  accentText: string;
  accentBg: string;
}

export default function ApprenticeHoursHistory({
  discipline,
  apiPath,
  backHref,
  accentColor,
  accentText,
  accentBg,
}: Props) {
  const [weeks, setWeeks]         = useState<WeekGroup[]>([]);
  const [loading, setLoading]     = useState(true);
  const [authError, setAuthError] = useState(false);
  const [error, setError]         = useState('');
  const [totalApproved, setTotalApproved] = useState(0);
  const [totalPending, setTotalPending]   = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(apiPath);
      if (res.status === 401) { setAuthError(true); return; }
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      const entries: HoursEntry[] = data.entries ?? [];
      setWeeks(groupByWeek(entries));
      setTotalApproved(entries.filter(e => e.status === 'approved').reduce((s, e) => s + e.hours, 0));
      setTotalPending(entries.filter(e => e.status === 'pending').reduce((s, e) => s + e.hours, 0));
    } catch {
      setError('Could not load your hours history.');
    } finally {
      setLoading(false);
    }
  }, [apiPath]);

  useEffect(() => { load(); }, [load]);

  if (authError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center max-w-xs">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h2 className="font-bold text-slate-900 mb-2">Sign in required</h2>
          <Link href={`/login?redirect=/pwa/${discipline}/history`}
            className="inline-block bg-slate-900 text-white font-semibold px-5 py-3 rounded-xl text-sm mt-2">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 pt-12 pb-4 safe-area-inset-top">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Link href={backHref}
            className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-black text-slate-900">Hour History</h1>
            <p className="text-xs text-slate-500 capitalize">{discipline.replace(/-/g, ' ')} apprenticeship</p>
          </div>
          <Link href={`/pwa/${discipline}/log-hours`}
            className={`${accentColor} text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1`}>
            <Plus className="w-3.5 h-3.5" /> Log
          </Link>
        </div>
      </header>

      <main className="px-4 py-5 max-w-lg mx-auto space-y-4">
        {/* Summary strip */}
        {!loading && !error && (
          <div className="grid grid-cols-2 gap-3">
            <div className={`${accentBg} rounded-2xl p-4 text-center`}>
              <p className={`text-2xl font-black ${accentText}`}>{totalApproved.toFixed(1)}</p>
              <p className="text-xs text-slate-500 mt-0.5">hours approved</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-amber-700">{totalPending.toFixed(1)}</p>
              <p className="text-xs text-slate-500 mt-0.5">hours pending</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && [1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-slate-100 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-40" />
                <div className="h-3 bg-slate-100 rounded w-24" />
              </div>
            </div>
          </div>
        ))}

        {/* Error */}
        {!loading && error && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <p className="text-sm text-slate-600 mb-4">{error}</p>
            <button onClick={load}
              className="text-sm font-semibold text-slate-700 bg-slate-100 px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors">
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && weeks.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <h2 className="font-bold text-slate-900 mb-1">No hours logged yet</h2>
            <p className="text-sm text-slate-500 mb-5">Start logging your training hours to see them here.</p>
            <Link href={`/pwa/${discipline}/log-hours`}
              className={`inline-flex items-center gap-2 ${accentColor} text-white font-bold px-5 py-3 rounded-xl text-sm`}>
              <Plus className="w-4 h-4" /> Log Your First Hours
            </Link>
          </div>
        )}

        {/* Week groups */}
        {!loading && !error && weeks.map(group => (
          <WeekCard key={group.weekStart} group={group} />
        ))}
      </main>
    </div>
  );
}
