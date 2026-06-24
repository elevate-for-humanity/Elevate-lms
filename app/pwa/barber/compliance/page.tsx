'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock, CheckCircle, XCircle, AlertCircle, ChevronRight,
  Scissors, BookOpen, Award, TrendingUp, Upload, ArrowLeft,
} from 'lucide-react';

interface CompletionStatus {
  is_complete: boolean;
  total_hours: number;
  gate_total_hours: boolean;
  gate_module_hours: boolean;
  gate_practicals: boolean;
  gate_signoffs: boolean;
  gate_final_signoff: boolean;
  gate_checkpoints: boolean;
  gate_final_exam: boolean;
  practicals_met: number;
  modules_signed_off: number;
  checkpoints_passed: number;
}

interface PracticalCategory {
  category_key: string;
  label: string;
  module_number: number;
  count_required: number;
  count_completed: number;
  verification_status: string;
}

interface Ledger {
  total_hours: number;
  theory_hours: number;
  practical_hours: number;
  mod1_theory: number; mod1_practical: number;
  mod2_theory: number; mod2_practical: number;
  mod3_theory: number; mod3_practical: number;
  mod4_theory: number; mod4_practical: number;
  mod5_theory: number; mod5_practical: number;
  mod6_theory: number; mod6_practical: number;
  mod7_theory: number; mod7_practical: number;
  mod8_theory: number; mod8_practical: number;
}

const MODULE_LABELS = [
  '', // 0 unused
  'Infection Control & Safety',
  'Hair Science & Scalp',
  'Tools & Ergonomics',
  'Haircutting',
  'Shaving & Beard',
  'Chemical Services',
  'Business & Professional',
  'Exam Prep',
];

const MODULE_TOTALS = [0, 200, 200, 200, 800, 300, 200, 100, 100];

function GateRow({ label, met }: { label: string; met: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-700">{label}</span>
      {met
        ? <CheckCircle className="w-5 h-5 text-green-500" />
        : <XCircle className="w-5 h-5 text-slate-300" />}
    </div>
  );
}

function HoursBar({ current, total, label }: { current: number; total: number; label: string }) {
  const pct = Math.min(100, Math.round((current / total) * 100));
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>{label}</span>
        <span>{current.toFixed(1)} / {total}h</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : 'bg-orange-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function BarberComplianceDashboard() {
  const [status, setStatus] = useState<CompletionStatus | null>(null);
  const [practicals, setPracticals] = useState<PracticalCategory[]>([]);
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/barber/completion-status').then(r => r.json()),
      fetch('/api/barber/practicals').then(r => r.json()),
      fetch('/api/pwa/barber/progress').then(r => r.json()),
    ]).then(([s, p, prog]) => {
      setStatus(s);
      setPracticals(p.categories ?? []);
      // Map progress API ledger fields if available
      if (prog?.ledger) setLedger(prog.ledger);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
      </div>
    );
  }

  const totalHours = status?.total_hours ?? 0;
  const totalPct = Math.min(100, Math.round((totalHours / 2000) * 100));

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center gap-3">
        <Link href="/pwa/barber" className="text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-bold text-slate-900">Compliance Dashboard</h1>
          <p className="text-xs text-slate-500">Indiana Barber Apprenticeship — 2,000 Hour Program</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* Total Hours Hero */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="font-semibold text-slate-900">Total Hours</span>
            </div>
            {status?.gate_total_hours && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Complete</span>
            )}
          </div>
          <div className="text-4xl font-bold text-slate-900 mb-1">
            {totalHours.toFixed(1)}
            <span className="text-xl text-slate-400 font-normal"> / 2,000</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full rounded-full transition-all ${totalPct >= 100 ? 'bg-green-500' : 'bg-orange-500'}`}
              style={{ width: `${totalPct}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">{totalPct}% complete · {Math.max(0, 2000 - totalHours).toFixed(1)}h remaining</p>
        </div>

        {/* Completion Gate */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-orange-600" />
            <span className="font-semibold text-slate-900">Completion Requirements</span>
          </div>
          {status?.is_complete && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800 font-medium text-center">
              ✅ All requirements met — eligible for state board exam
            </div>
          )}
          <GateRow label="2,000 total hours logged"          met={status?.gate_total_hours ?? false} />
          <GateRow label="All module hour minimums met"      met={status?.gate_module_hours ?? false} />
          <GateRow label="All practical counts completed"    met={status?.gate_practicals ?? false} />
          <GateRow label="All 8 module checkpoints passed"   met={status?.gate_checkpoints ?? false} />
          <GateRow label="Final exam passed (≥ 80%)"         met={status?.gate_final_exam ?? false} />
          <GateRow label="All module sign-offs by instructor" met={status?.gate_signoffs ?? false} />
          <GateRow label="Instructor final clearance"        met={status?.gate_final_signoff ?? false} />
        </div>

        {/* Module Hours Breakdown */}
        {ledger && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <span className="font-semibold text-slate-900">Hours by Module</span>
            </div>
            {[1,2,3,4,5,6,7,8].map(n => {
              const theory = (ledger as any)[`mod${n}_theory`] ?? 0;
              const practical = (ledger as any)[`mod${n}_practical`] ?? 0;
              const total = theory + practical;
              return (
                <HoursBar
                  key={n}
                  label={`M${n}: ${MODULE_LABELS[n]}`}
                  current={total}
                  total={MODULE_TOTALS[n]}
                />
              );
            })}
          </div>
        )}

        {/* Practical Requirements */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Scissors className="w-5 h-5 text-orange-600" />
              <span className="font-semibold text-slate-900">Practical Requirements</span>
            </div>
            <span className="text-xs text-slate-500">
              {status?.practicals_met ?? 0}/8 categories met
            </span>
          </div>
          <div className="space-y-3">
            {practicals.map(cat => {
              const pct = Math.min(100, Math.round((cat.count_completed / cat.count_required) * 100));
              const met = cat.verification_status === 'met';
              return (
                <div key={cat.category_key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={`font-medium ${met ? 'text-green-700' : 'text-slate-700'}`}>
                      {met && '✓ '}{cat.label}
                    </span>
                    <span className="text-slate-500 text-xs">
                      {cat.count_completed} / {cat.count_required}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${met ? 'bg-green-500' : 'bg-orange-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <Link
            href="/pwa/barber/practicals/submit"
            className="mt-4 flex items-center justify-center gap-2 w-full bg-orange-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-orange-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Submit a Practical
          </Link>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-slate-100">
          {[
            { href: '/pwa/barber/log-hours', icon: Clock, label: 'Log Training Hours' },
            { href: '/pwa/barber/training', icon: BookOpen, label: 'Continue Training' },
            { href: '/pwa/barber/history', icon: TrendingUp, label: 'Hour History' },
          ].map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-slate-700">{label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
