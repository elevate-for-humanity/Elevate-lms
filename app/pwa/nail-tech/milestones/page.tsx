'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Award, Lock, Loader2, AlertCircle, Sparkles, Clock, BookOpen, TrendingUp } from 'lucide-react';

interface Milestone {
  hours: number;
  title: string;
  description: string;
  achieved: boolean;
}

const NAIL_TECH_MILESTONES: Omit<Milestone, 'achieved'>[] = [
  { hours: 50,  title: 'First 50 Hours',       description: 'You\'ve completed your first 50 hours of nail technician training.' },
  { hours: 100, title: 'Sanitation Certified',  description: 'Demonstrated mastery of infection control and sanitation protocols.' },
  { hours: 150, title: 'Manicure Proficiency',  description: 'Proficiency in basic and spa manicure techniques.' },
  { hours: 225, title: 'Pedicure Specialist',   description: 'Competency in pedicure services and foot care.' },
  { hours: 300, title: 'Nail Enhancements',     description: 'Demonstrated skill in acrylic, gel, and nail art applications.' },
  { hours: 375, title: 'Client Ready',          description: 'Consistently delivering professional-quality services to clients.' },
  { hours: 450, title: 'State Board Ready',     description: 'All 450 hours complete. Eligible to sit for the Indiana State Board exam.' },
];

const NAV = [
  { href: '/pwa/nail-tech', icon: Sparkles, label: 'Home' },
  { href: '/pwa/nail-tech/log-hours', icon: Clock, label: 'Log' },
  { href: '/pwa/nail-tech/training', icon: BookOpen, label: 'Learn' },
  { href: '/pwa/nail-tech/progress', icon: TrendingUp, label: 'Progress', active: true },
];

export default function NailTechMilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/pwa/nail-tech/dashboard')
      .then((r) => r.json())
      .then((data) => {
        const hours = data.totalHours ?? 0;
        setTotalHours(hours);
        setMilestones(NAIL_TECH_MILESTONES.map((m) => ({ ...m, achieved: hours >= m.hours })));
      })
      .catch(() => setError('Unable to load milestone data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-pink-400 animate-spin" />
    </div>
  );

  const achieved = milestones.filter((m) => m.achieved).length;

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <header className="bg-pink-700 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/pwa/nail-tech" className="w-10 h-10 bg-pink-800 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-white font-bold text-xl">Milestones</h1>
        </div>
        <div className="bg-white/10 rounded-xl p-4">
          <p className="text-pink-200 text-sm">{achieved} of {milestones.length} milestones achieved</p>
          <p className="text-white font-bold text-lg">{totalHours} / 450 hours</p>
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
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${m.achieved ? 'bg-pink-600' : 'bg-slate-700'}`}>
              {m.achieved ? <Award className="w-6 h-6 text-white" /> : <Lock className="w-5 h-5 text-slate-500" />}
            </div>
            <div>
              <p className={`font-bold ${m.achieved ? 'text-white' : 'text-slate-400'}`}>{m.title}</p>
              <p className="text-slate-400 text-sm">{m.description}</p>
              <p className="text-pink-400 text-xs mt-1">{m.hours} hours required</p>
            </div>
          </div>
        ))}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 flex safe-area-inset-bottom">
        {NAV.map(({ href, icon: Icon, label, active }) => (
          <Link key={href} href={href} className={`flex-1 flex flex-col items-center py-3 transition ${active ? 'text-pink-400' : 'text-slate-400 hover:text-pink-400'}`}>
            <Icon className="w-5 h-5" />
            <span className="text-xs mt-1">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
