'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Award, Lock, Loader2, AlertCircle, Flower2, Clock, BookOpen, TrendingUp } from 'lucide-react';

interface Milestone {
  hours: number;
  title: string;
  description: string;
  achieved: boolean;
}

const ESTHETICIAN_MILESTONES: Omit<Milestone, 'achieved'>[] = [
  { hours: 75,  title: 'First 75 Hours',        description: 'You\'ve completed your first 75 hours of esthetician training.' },
  { hours: 150, title: 'Skin Science Basics',    description: 'Demonstrated understanding of skin anatomy, disorders, and analysis.' },
  { hours: 250, title: 'Facial Specialist',      description: 'Proficiency in basic and advanced facial treatments.' },
  { hours: 350, title: 'Hair Removal Expert',    description: 'Competency in waxing, threading, and other hair removal techniques.' },
  { hours: 450, title: 'Chemical Services',      description: 'Demonstrated skill in chemical exfoliation and advanced skin treatments.' },
  { hours: 575, title: 'Makeup & Lashes',        description: 'Proficiency in makeup application and lash services.' },
  { hours: 700, title: 'State Board Ready',      description: 'All 700 hours complete. Eligible to sit for the Indiana State Board exam.' },
];

const NAV = [
  { href: '/pwa/esthetician', icon: Flower2, label: 'Home' },
  { href: '/pwa/esthetician/log-hours', icon: Clock, label: 'Log' },
  { href: '/pwa/esthetician/training', icon: BookOpen, label: 'Learn' },
  { href: '/pwa/esthetician/progress', icon: TrendingUp, label: 'Progress', active: true },
];

export default function EstheticianMilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/pwa/esthetician/dashboard')
      .then((r) => r.json())
      .then((data) => {
        const hours = data.totalHours ?? 0;
        setTotalHours(hours);
        setMilestones(ESTHETICIAN_MILESTONES.map((m) => ({ ...m, achieved: hours >= m.hours })));
      })
      .catch(() => setError('Unable to load milestone data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-rose-400 animate-spin" />
    </div>
  );

  const achieved = milestones.filter((m) => m.achieved).length;

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <header className="bg-rose-700 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/pwa/esthetician" className="w-10 h-10 bg-rose-800 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-white font-bold text-xl">Milestones</h1>
        </div>
        <div className="bg-white/10 rounded-xl p-4">
          <p className="text-rose-200 text-sm">{achieved} of {milestones.length} milestones achieved</p>
          <p className="text-white font-bold text-lg">{totalHours} / 700 hours</p>
        </div>
      </header>

      <main className="px-4 py-6 space-y-3">
        {error && (
          <div className="bg-red-500/20 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
        {milestones.map((m) => (
          <div key={m.hours} className={`bg-slate-800 rounded-xl p-4 flex items-start gap-4 ${!m.achieved ? 'opacity-50' : ''}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${m.achieved ? 'bg-rose-600' : 'bg-slate-700'}`}>
              {m.achieved ? <Award className="w-6 h-6 text-white" /> : <Lock className="w-5 h-5 text-slate-500" />}
            </div>
            <div>
              <p className={`font-bold ${m.achieved ? 'text-white' : 'text-slate-400'}`}>{m.title}</p>
              <p className="text-slate-400 text-sm">{m.description}</p>
              <p className="text-rose-400 text-xs mt-1">{m.hours} hours required</p>
            </div>
          </div>
        ))}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 flex safe-area-inset-bottom">
        {NAV.map(({ href, icon: Icon, label, active }) => (
          <Link key={href} href={href} className={`flex-1 flex flex-col items-center py-3 transition ${active ? 'text-rose-400' : 'text-slate-400 hover:text-rose-400'}`}>
            <Icon className="w-5 h-5" />
            <span className="text-xs mt-1">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
