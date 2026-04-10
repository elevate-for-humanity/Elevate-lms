'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, TrendingUp, Award, Loader2, AlertCircle, Target } from 'lucide-react';

export interface DisciplineConfig {
  name: string;
  slug: string;           // 'cosmetology' | 'esthetician' | 'nail-tech' | 'barber'
  targetHours: number;
  color: string;          // tailwind bg class
  icon: React.ReactNode;
  stateBoard: string;     // e.g. 'Indiana State Board of Cosmetology'
}

interface WeeklyData { weekEnding: string; hours: number; status: string; }
interface Milestone  { hours: number; title: string; achieved: boolean; }
interface ProgressData {
  enrolled: boolean;
  apprentice: { name: string; totalHours: number; weeklyHours: number; startDate: string | null; shopName: string; };
  weeklyData: WeeklyData[];
  milestones: Milestone[];
  targetHours: number;
}

function fmt(h: number) { return h.toLocaleString(); }

export default function ApprenticeProgressPage({ config }: { config: DisciplineConfig }) {
  const [data, setData]       = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/pwa/${config.slug}/progress`);
        if (res.status === 401) { setError('Please sign in to view your progress'); setLoading(false); return; }
        if (res.status === 404) { setError(`You are not enrolled in the ${config.name} program`); setLoading(false); return; }
        if (!res.ok) throw new Error('Failed to load');
        setData(await res.json());
      } catch { setError('Unable to load progress. Please try again.'); }
      finally { setLoading(false); }
    }
    load();
  }, [config.slug, config.name]);

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-white animate-spin" />
    </div>
  );

  if (error || !data?.enrolled) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <AlertCircle className="w-12 h-12 text-amber-400 mb-4" />
      <p className="text-white text-lg font-semibold mb-2">{error || `Not enrolled in ${config.name}`}</p>
      <Link href={`/pwa/${config.slug}`} className="text-slate-400 text-sm mt-4">← Back to Dashboard</Link>
    </div>
  );

  const total   = data.apprentice.totalHours;
  const target  = config.targetHours;
  const pct     = Math.min(100, Math.round((total / target) * 100));
  const remaining = Math.max(0, target - total);
  const avgWeekly = data.weeklyData.filter(w => w.hours > 0).reduce((s, w) => s + w.hours, 0) /
                    Math.max(1, data.weeklyData.filter(w => w.hours > 0).length);
  const weeksLeft = avgWeekly > 0 ? Math.ceil(remaining / avgWeekly) : null;

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-24">
      {/* Header */}
      <div className={`${config.color} px-4 pt-12 pb-6`}>
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/pwa/${config.slug}`}><ArrowLeft className="w-6 h-6 text-white/80" /></Link>
          <h1 className="text-xl font-bold">My Progress</h1>
        </div>
        <p className="text-white/80 text-sm">{config.name} · {config.stateBoard}</p>
      </div>

      <div className="px-4 py-6 space-y-5">
        {/* Hours ring */}
        <div className="bg-slate-800 rounded-2xl p-5 text-center">
          <p className="text-slate-400 text-sm mb-1">Total Hours Logged</p>
          <p className="text-5xl font-bold text-white">{fmt(total)}</p>
          <p className="text-slate-400 text-sm mt-1">of {fmt(target)} required</p>
          <div className="w-full bg-slate-700 rounded-full h-3 mt-4">
            <div className={`${config.color} h-3 rounded-full transition-all`} style={{ width: `${pct}%` }} />
          </div>
          <p className="text-slate-400 text-sm mt-2">{pct}% complete · {fmt(remaining)} hours remaining</p>
          {weeksLeft && <p className="text-slate-500 text-xs mt-1">~{weeksLeft} weeks at your current pace</p>}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800 rounded-2xl p-4">
            <Clock className="w-5 h-5 text-blue-400 mb-2" />
            <p className="text-2xl font-bold">{fmt(data.apprentice.weeklyHours)}</p>
            <p className="text-slate-400 text-xs">This week</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-4">
            <Target className="w-5 h-5 text-green-400 mb-2" />
            <p className="text-2xl font-bold">{fmt(Math.round(avgWeekly * 10) / 10)}</p>
            <p className="text-slate-400 text-xs">Avg hrs/week</p>
          </div>
        </div>

        {/* Milestones */}
        <div className="bg-slate-800 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" /> Milestones
          </h2>
          <div className="space-y-3">
            {data.milestones.map((m) => (
              <div key={m.hours} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.achieved ? 'bg-amber-500' : 'bg-slate-700'}`}>
                  <Award className={`w-4 h-4 ${m.achieved ? 'text-white' : 'text-slate-500'}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${m.achieved ? 'text-white' : 'text-slate-400'}`}>{m.title}</p>
                  <p className="text-xs text-slate-500">{fmt(m.hours)} hours</p>
                </div>
                {m.achieved && <span className="text-xs text-amber-400 font-semibold">✓</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Weekly history */}
        <div className="bg-slate-800 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" /> Recent Weeks
          </h2>
          <div className="space-y-2">
            {data.weeklyData.slice(0, 8).map((w) => (
              <div key={w.weekEnding} className="flex items-center justify-between">
                <p className="text-slate-400 text-sm">Week of {w.weekEnding}</p>
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm font-semibold">{fmt(w.hours)} hrs</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    w.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                    w.status === 'pending'  ? 'bg-amber-500/20 text-amber-400' :
                    'bg-slate-700 text-slate-400'}`}>{w.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Link href={`/pwa/${config.slug}/log-hours`}
          className={`${config.color} w-full py-4 rounded-2xl font-bold text-white text-center block`}>
          Log Hours
        </Link>
      </div>
    </div>
  );
}
