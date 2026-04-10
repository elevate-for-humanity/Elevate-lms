'use client';

/**
 * ApprenticeHome — shared PWA home page for cosmetology, nail-tech,
 * and esthetician apprentices. Mirrors the barber PWA home.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock, BookOpen, Award, ChevronRight,
  Plus, TrendingUp, AlertCircle, Loader2,
  LogIn, UserPlus, Sparkles, Hand, Flower2, Scissors,
} from 'lucide-react';

const DISCIPLINE_CONFIG = {
  cosmetology: {
    label: 'Cosmetology Apprentice',
    icon: <Sparkles className="w-10 h-10 text-white" />,
    color: 'bg-purple-700',
    lightColor: 'bg-purple-500',
    targetHours: 2000, // Indiana DOL Registered Apprenticeship
    applyHref: '/programs/cosmetology-apprenticeship/apply',
    logHref: '/pwa/cosmetology/log-hours',
    historyHref: '/pwa/cosmetology/history',
    progressHref: '/pwa/cosmetology/progress',
    lmsHref: '/lms/dashboard',
    subtitle: 'Track your hours, access training, and progress toward your cosmetology license.',
  },
  'nail-tech': {
    label: 'Nail Tech Apprentice',
    icon: <Hand className="w-10 h-10 text-white" />,
    color: 'bg-pink-700',
    lightColor: 'bg-pink-500',
    targetHours: 450,
    applyHref: '/programs/nail-technician-apprenticeship/apply',
    logHref: '/pwa/nail-tech/log-hours',
    historyHref: '/pwa/nail-tech/history',
    progressHref: '/pwa/nail-tech/progress',
    lmsHref: '/lms/dashboard',
    subtitle: 'Track your hours, access training, and progress toward your nail technician license.',
  },
  esthetician: {
    label: 'Esthetician Apprentice',
    icon: <Flower2 className="w-10 h-10 text-white" />,
    color: 'bg-rose-700',
    lightColor: 'bg-rose-500',
    targetHours: 700,
    applyHref: '/programs/esthetician/apply',
    logHref: '/pwa/esthetician/log-hours',
    historyHref: '/pwa/esthetician/history',
    progressHref: '/pwa/esthetician/progress',
    lmsHref: '/lms/dashboard',
    subtitle: 'Track your hours, access training, and progress toward your esthetician license.',
  },
};

interface ApprenticeData {
  name: string;
  totalHours: number;
  weeklyHours: number;
  startDate: string | null;
}

interface Props {
  discipline: 'cosmetology' | 'nail-tech' | 'esthetician';
}

function LandingPage({ discipline }: Props) {
  const config = DISCIPLINE_CONFIG[discipline];
  return (
    <div className="min-h-screen bg-slate-900">
      <div className={`${config.color} px-6 pt-16 pb-12 text-center`}>
        <div className={`w-20 h-20 ${config.lightColor} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
          {config.icon}
        </div>
        <h1 className="text-3xl font-black text-white mb-3">{config.label}</h1>
        <p className="text-white/70 text-lg max-w-xs mx-auto">{config.subtitle}</p>
      </div>
      <div className="px-6 py-8 space-y-4 max-w-sm mx-auto">
        <Link href="/login" className="flex items-center justify-between bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <LogIn className="w-6 h-6 text-slate-600" />
            <div>
              <p className="font-bold text-slate-900">Sign In</p>
              <p className="text-xs text-slate-500">Access your apprentice dashboard</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </Link>
        <Link href={config.applyHref} className="flex items-center justify-between bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-slate-600" />
            <div>
              <p className="font-bold text-slate-900">Apply to Program</p>
              <p className="text-xs text-slate-500">Start your apprenticeship application</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </Link>
      </div>
    </div>
  );
}

function Dashboard({ data, discipline }: { data: ApprenticeData; discipline: Props['discipline'] }) {
  const config = DISCIPLINE_CONFIG[discipline];
  const pct = Math.min(100, Math.round((data.totalHours / config.targetHours) * 100));
  const remaining = Math.max(0, config.targetHours - data.totalHours);

  return (
    <div className="min-h-screen bg-slate-900 pb-8">
      {/* Header */}
      <div className={`${config.color} px-5 pt-12 pb-6`}>
        <p className="text-white/70 text-sm">Welcome back</p>
        <h1 className="text-2xl font-black text-white">{data.name}</h1>
      </div>

      <div className="px-4 -mt-4 space-y-4 max-w-lg mx-auto">

        {/* Hours progress card */}
        <div className="bg-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
              <Clock className="w-4 h-4" /> Total Hours
            </div>
            <span className="text-xs text-slate-400">{pct}% complete</span>
          </div>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-4xl font-black text-white">{data.totalHours.toLocaleString()}</span>
            <span className="text-slate-400 text-sm mb-1">/ {config.targetHours.toLocaleString()} required</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div className="h-2.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          {remaining > 0 && (
            <p className="text-xs text-slate-400 mt-2">{remaining.toLocaleString()} hours remaining</p>
          )}
        </div>

        {/* This week */}
        <div className="bg-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-white font-bold">{data.weeklyHours}h this week</p>
              <p className="text-xs text-slate-400">Keep it up</p>
            </div>
          </div>
          <Link href={config.logHref} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-1">
            <Plus className="w-4 h-4" /> Log
          </Link>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: config.logHref,     icon: <Plus className="w-5 h-5" />,      label: 'Log Hours' },
            { href: config.historyHref, icon: <Clock className="w-5 h-5" />,     label: 'Hour History' },
            { href: config.progressHref,icon: <Award className="w-5 h-5" />,     label: 'My Progress' },
            { href: config.lmsHref,     icon: <BookOpen className="w-5 h-5" />,  label: 'Training' },
          ].map(item => (
            <Link key={item.href} href={item.href} className="bg-slate-800 rounded-2xl p-4 flex items-center gap-3 hover:bg-slate-700 transition-colors">
              <span className="text-slate-400">{item.icon}</span>
              <span className="text-white text-sm font-semibold">{item.label}</span>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}

export default function ApprenticeHome({ discipline }: Props) {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<ApprenticeData | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (d?.user) {
          setAuthed(true);
          return fetch(`/api/pwa/${discipline}/dashboard`).then(r => r.json());
        }
      })
      .then(d => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [discipline]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!authed) return <LandingPage discipline={discipline} />;

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
          <p className="text-white font-bold">No apprenticeship found</p>
          <p className="text-slate-400 text-sm">Contact Elevate staff to get enrolled.</p>
          <Link href={DISCIPLINE_CONFIG[discipline].applyHref} className="inline-block mt-2 bg-white text-slate-900 font-bold px-5 py-2.5 rounded-xl text-sm">Apply Now</Link>
        </div>
      </div>
    );
  }

  return <Dashboard data={data} discipline={discipline} />;
}
