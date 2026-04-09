'use client';

/**
 * ApprenticeProgress
 *
 * Shared progress page for cosmetology, nail-tech, and esthetician PWAs.
 * Shows hours progress toward licensure, LMS completion, state board eligibility,
 * and upcoming milestones.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Award, Clock, BookOpen, CheckCircle2,
  Lock, AlertCircle, Loader2, TrendingUp, Star,
  ChevronRight, ExternalLink,
} from 'lucide-react';

interface ProgressData {
  totalHoursApproved: number;
  totalHoursPending: number;
  requiredHours: number;
  transferHours: number;
  lmsCompleted: boolean;
  lmsProgressPct: number;
  practicalSkillsVerified: boolean;
  checkpointsPassed: number;
  checkpointsTotal: number;
  programLabel: string;
  partnerShopName?: string;
  weeklyAvgHours?: number;
  projectedCompletionDate?: string;
}

interface MilestoneProps {
  pct: number;
  label: string;
  reached: boolean;
  accentColor: string;
}

function Milestone({ pct, label, reached, accentColor }: MilestoneProps) {
  return (
    <div className={`flex flex-col items-center gap-1 ${reached ? '' : 'opacity-40'}`}>
      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
        reached
          ? `${accentColor} border-transparent text-white`
          : 'border-slate-300 text-slate-400 bg-white'
      }`}>
        {reached ? <CheckCircle2 className="w-4 h-4" /> : `${pct}%`}
      </div>
      <span className="text-xs text-slate-500 text-center leading-tight">{label}</span>
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
  accentBorder: string;
  stateBoardHref: string;
  lmsHref: string;
}

export default function ApprenticeProgress({
  discipline,
  apiPath,
  backHref,
  accentColor,
  accentText,
  accentBg,
  accentBorder,
  stateBoardHref,
  lmsHref,
}: Props) {
  const [data, setData]           = useState<ProgressData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [authError, setAuthError] = useState(false);
  const [error, setError]         = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(apiPath);
      if (res.status === 401) { setAuthError(true); return; }
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      setData(json.progress ?? json);
    } catch {
      setError('Could not load your progress.');
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
          <Link href={`/login?redirect=/pwa/${discipline}/progress`}
            className="inline-block bg-slate-900 text-white font-semibold px-5 py-3 rounded-xl text-sm mt-2">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const hoursTotal    = data ? data.totalHoursApproved + data.transferHours : 0;
  const required      = data?.requiredHours ?? 1500;
  const pct           = Math.min(100, Math.round((hoursTotal / required) * 100));
  const hoursLeft     = Math.max(0, required - hoursTotal);
  const isEligible    = data ? hoursTotal >= required && data.lmsCompleted : false;

  const MILESTONES = [25, 50, 75, 100];

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
            <h1 className="text-lg font-black text-slate-900">My Progress</h1>
            <p className="text-xs text-slate-500 capitalize">{discipline.replace(/-/g, ' ')} apprenticeship</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-5 max-w-lg mx-auto space-y-4">

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
          </div>
        )}

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

        {!loading && !error && data && (
          <>
            {/* Eligibility banner */}
            {isEligible ? (
              <div className="bg-emerald-600 rounded-2xl p-5 text-white flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="font-black text-lg">Eligible to test!</p>
                  <p className="text-emerald-100 text-sm">You&apos;ve met all requirements for the state board exam.</p>
                </div>
                <Link href={stateBoardHref}
                  className="bg-white text-emerald-700 font-bold text-xs px-3 py-2 rounded-xl flex-shrink-0">
                  Schedule
                </Link>
              </div>
            ) : (
              <div className={`${accentBg} border ${accentBorder} rounded-2xl p-5`}>
                <div className="flex items-center gap-3 mb-1">
                  <TrendingUp className={`w-5 h-5 ${accentText} flex-shrink-0`} />
                  <p className={`font-bold ${accentText}`}>On track for licensure</p>
                </div>
                <p className="text-slate-600 text-sm">
                  {hoursLeft > 0
                    ? `${hoursLeft.toFixed(1)} hours remaining toward your ${required.toLocaleString()}-hour requirement.`
                    : 'Hours complete — finish your LMS coursework to unlock the state board exam.'}
                </p>
              </div>
            )}

            {/* Hours progress card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${accentText}`} /> Training Hours
                </h2>
                <Link href={`/pwa/${discipline}/history`}
                  className={`text-xs font-semibold ${accentText} flex items-center gap-1`}>
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Big number */}
              <div className="text-center mb-4">
                <p className={`text-5xl font-black ${accentText}`}>{hoursTotal.toFixed(1)}</p>
                <p className="text-slate-500 text-sm">of {required.toLocaleString()} hours</p>
              </div>

              {/* Progress bar */}
              <div className="bg-slate-100 rounded-full h-3 mb-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-700 ${accentColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Milestones */}
              <div className="flex justify-between mt-4">
                {MILESTONES.map(m => (
                  <Milestone
                    key={m}
                    pct={m}
                    label={`${Math.round(required * m / 100)}h`}
                    reached={pct >= m}
                    accentColor={accentColor}
                  />
                ))}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100">
                <div className="text-center">
                  <p className="text-lg font-black text-slate-900">{data.totalHoursApproved.toFixed(1)}</p>
                  <p className="text-xs text-slate-500">approved</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-amber-600">{data.totalHoursPending.toFixed(1)}</p>
                  <p className="text-xs text-slate-500">pending</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-slate-900">{data.transferHours.toFixed(1)}</p>
                  <p className="text-xs text-slate-500">transfer</p>
                </div>
              </div>

              {data.weeklyAvgHours && data.weeklyAvgHours > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-500">
                    Averaging <strong className="text-slate-700">{data.weeklyAvgHours.toFixed(1)}h/week</strong>
                    {data.projectedCompletionDate && (
                      <> · on track to finish by <strong className="text-slate-700">
                        {new Date(data.projectedCompletionDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </strong></>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* LMS progress card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className={`w-4 h-4 ${accentText}`} /> Theory Coursework
                </h2>
                <Link href={lmsHref}
                  className={`text-xs font-semibold ${accentText} flex items-center gap-1`}>
                  Open LMS <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                    <circle
                      cx="32" cy="32" r="28" fill="none"
                      stroke={data.lmsCompleted ? '#10b981' : '#7c3aed'}
                      strokeWidth="6"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      strokeDashoffset={`${2 * Math.PI * 28 * (1 - (data.lmsProgressPct ?? 0) / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-black text-slate-900">{data.lmsProgressPct ?? 0}%</span>
                  </div>
                </div>
                <div className="flex-1">
                  {data.lmsCompleted ? (
                    <div className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-bold">Theory complete</span>
                    </div>
                  ) : (
                    <p className="font-semibold text-slate-900">In progress</p>
                  )}
                  <p className="text-sm text-slate-500 mt-1">
                    {data.checkpointsPassed} of {data.checkpointsTotal} checkpoints passed
                  </p>
                  {!data.lmsCompleted && (
                    <Link href={lmsHref}
                      className={`inline-flex items-center gap-1.5 mt-2 text-xs font-bold ${accentText} ${accentBg} px-3 py-1.5 rounded-lg`}>
                      Continue coursework <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Requirements checklist */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900">Licensure Checklist</h2>
              </div>
              {[
                {
                  label: `${required.toLocaleString()} training hours`,
                  done: hoursTotal >= required,
                  detail: `${hoursTotal.toFixed(1)} / ${required.toLocaleString()}h`,
                },
                {
                  label: 'LMS theory coursework',
                  done: data.lmsCompleted,
                  detail: `${data.lmsProgressPct ?? 0}% complete`,
                },
                {
                  label: 'Practical skills verified',
                  done: data.practicalSkillsVerified,
                  detail: data.practicalSkillsVerified ? 'Verified by mentor' : 'Pending mentor sign-off',
                },
                {
                  label: 'State board exam',
                  done: false,
                  detail: isEligible ? 'Ready to schedule' : 'Unlocks when requirements are met',
                  locked: !isEligible,
                },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 last:border-0">
                  {item.locked ? (
                    <Lock className="w-5 h-5 text-slate-300 flex-shrink-0" />
                  ) : item.done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.detail}</p>
                  </div>
                  {item.done && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Done
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* State board CTA */}
            <Link href={stateBoardHref}
              className="flex items-center gap-4 bg-white rounded-2xl border border-slate-200 p-5 hover:border-purple-300 transition-colors group">
              <div className={`w-12 h-12 ${accentBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Star className={`w-6 h-6 ${accentText}`} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900">State Board Exam</p>
                <p className="text-sm text-slate-500">
                  {isEligible ? 'You\'re eligible — schedule now' : 'View requirements and exam info'}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </Link>
          </>
        )}
      </main>
    </div>
  );
}
