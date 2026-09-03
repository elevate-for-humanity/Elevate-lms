'use client';

/**
 * WorkforceLiveWidget
 *
 * Polls /api/employer/workforce/live every 60s and renders a live
 * workforce summary card for the employer dashboard sidebar.
 * Shows: active clock-ins, completed today, weekly hours, at-risk count.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Activity, Clock, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';

type LiveSummary = {
  activeNow: number;
  completedToday: number;
  totalWeeklyHours: number;
  atRiskCount: number;
};

type ActiveShift = {
  id: string;
  full_name: string;
  duration_min: number | null;
  work_date: string | null;
};

export default function WorkforceLiveWidget() {
  const [summary, setSummary] = useState<LiveSummary | null>(null);
  const [activeShifts, setActiveShifts] = useState<ActiveShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch('/api/employer/workforce/live');
      if (!res.ok) return;
      const data = await res.json();
      setSummary(data.summary ?? null);
      setActiveShifts((data.activeShifts ?? []).slice(0, 5));
      setLastUpdated(new Date());
    } catch {
      // non-blocking
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 60_000);
    return () => clearInterval(interval);
  }, [fetchLive]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/2 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-slate-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand-blue-600" />
          <h3 className="text-lg font-bold text-black">Live Workforce</h3>
          {(summary?.activeNow ?? 0) > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          )}
        </div>
        <button
          onClick={fetchLive}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`p-3 rounded-lg border ${(summary?.activeNow ?? 0) > 0 ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className={`w-3.5 h-3.5 ${(summary?.activeNow ?? 0) > 0 ? 'text-green-600' : 'text-slate-400'}`} />
            <span className="text-xs text-slate-600">Clocked In</span>
          </div>
          <p className={`text-2xl font-bold ${(summary?.activeNow ?? 0) > 0 ? 'text-green-700' : 'text-slate-700'}`}>
            {summary?.activeNow ?? 0}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-1.5 mb-1">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-600">Done Today</span>
          </div>
          <p className="text-2xl font-bold text-slate-700">{summary?.completedToday ?? 0}</p>
        </div>

        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-brand-blue-600" />
            <span className="text-xs text-slate-600">Hrs This Week</span>
          </div>
          <p className="text-2xl font-bold text-brand-blue-700">{summary?.totalWeeklyHours ?? 0}</p>
        </div>

        <div className={`p-3 rounded-lg border ${(summary?.atRiskCount ?? 0) > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className={`w-3.5 h-3.5 ${(summary?.atRiskCount ?? 0) > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
            <span className="text-xs text-slate-600">At Risk</span>
          </div>
          <p className={`text-2xl font-bold ${(summary?.atRiskCount ?? 0) > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
            {summary?.atRiskCount ?? 0}
          </p>
        </div>
      </div>

      {/* Active shifts list */}
      {activeShifts.length > 0 && (
        <div className="border-t border-slate-100 pt-3 mb-3">
          <p className="text-xs font-medium text-slate-500 mb-2">Currently clocked in</p>
          <div className="space-y-1.5">
            {activeShifts.map((shift) => (
              <div key={shift.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                  <span className="text-sm text-slate-700 truncate max-w-[140px]">{shift.full_name}</span>
                </div>
                {shift.duration_min !== null && (
                  <span className="text-xs text-green-600 font-medium flex-shrink-0">
                    {shift.duration_min >= 60
                      ? `${Math.floor(shift.duration_min / 60)}h ${shift.duration_min % 60}m`
                      : `${shift.duration_min}m`}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Link
          href="/employer/apprentices"
          className="text-xs text-brand-blue-600 hover:text-brand-blue-700 font-medium"
        >
          View all apprentices →
        </Link>
        {lastUpdated && (
          <span className="text-xs text-slate-400">
            {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}
