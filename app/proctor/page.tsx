'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus, RefreshCw, Search, Filter, Clock, CheckCircle2,
  XCircle, AlertTriangle, Users, Calendar,
} from 'lucide-react';
import type { ExamSession, ExamSessionStatus } from '@/lib/proctor/types';
import { STATUS_CONFIG, RESULT_CONFIG, EXAM_PROVIDERS } from '@/lib/proctor/types';

type FilterStatus = 'all' | ExamSessionStatus;

export default function ProctorDashboard() {
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/proctor/sessions?${params}`);
      if (!res.ok) throw new Error('Failed to load sessions');
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err) {
      setError('Failed to load proctor sessions. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const todaySessions = sessions.filter(
    (s) => new Date(s.created_at).toDateString() === new Date().toDateString()
  );
  const activeSessions = sessions.filter((s) => s.status === 'in_progress');
  const completedToday = todaySessions.filter((s) => s.status === 'completed');
  const passedToday = completedToday.filter((s) => s.result === 'pass');

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Calendar className="w-5 h-5" />} label="Today's Sessions" value={todaySessions.length} color="bg-brand-blue-50 text-brand-blue-700" />
        <StatCard icon={<Clock className="w-5 h-5" />} label="Active Now" value={activeSessions.length} color="bg-yellow-50 text-yellow-700" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Completed Today" value={completedToday.length} color="bg-brand-green-50 text-brand-green-700" />
        <StatCard icon={<Users className="w-5 h-5" />} label="Passed Today" value={passedToday.length} color="bg-emerald-50 text-emerald-700" />
      </div>

      {/* Active sessions alert */}
      {activeSessions.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-900">{activeSessions.length} exam{activeSessions.length > 1 ? 's' : ''} in progress</p>
            <p className="text-sm text-yellow-700 mt-1">
              {activeSessions.map((s) => s.student_name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              className="pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm appearance-none bg-white focus:ring-2 focus:ring-brand-blue-500"
            >
              <option value="all">All Status</option>
              <option value="checked_in">Checked In</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="voided">Voided</option>
              <option value="no_show">No Show</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSessions}
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-3 py-2.5 border border-slate-200 rounded-lg hover:bg-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/proctor/new"
            className="inline-flex items-center gap-1.5 text-sm bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Session
          </Link>
        </div>
      </div>

      {/* Session list */}
      {error && (
        <div className="bg-brand-red-50 border border-brand-red-200 rounded-xl p-4 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-brand-red-600" />
          <p className="text-brand-red-800 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-white rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <ClipboardIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No exam sessions yet</h3>
          <p className="text-slate-500 mb-6">Start a new session to begin proctoring.</p>
          <Link
            href="/proctor/new"
            className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Start First Session
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <SessionRow key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-3xl font-black">{value}</div>
    </div>
  );
}

function SessionRow({ session }: { session: ExamSession }) {
  const statusCfg = STATUS_CONFIG[session.status];
  const resultCfg = RESULT_CONFIG[session.result];
  const providerLabel = EXAM_PROVIDERS[session.provider]?.label || session.provider;
  const time = new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = new Date(session.created_at).toLocaleDateString();

  return (
    <Link
      href={`/proctor/session/${session.id}`}
      className="block bg-white rounded-xl border border-slate-200 p-5 hover:border-brand-blue-300 hover:shadow-sm transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-slate-900 truncate">{session.student_name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
            {session.status === 'completed' && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${resultCfg.color}`}>
                {resultCfg.label}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            {session.exam_name} &middot; {providerLabel} &middot; {date} at {time}
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          {session.id_verified && (
            <span className="inline-flex items-center gap-1 text-brand-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> ID
            </span>
          )}
          <span>Proctor: {session.proctor_name}</span>
        </div>
      </div>
    </Link>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}
