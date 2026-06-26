'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Award, Lock, Loader2, AlertCircle, Scissors, Clock, BookOpen, TrendingUp } from 'lucide-react';

interface Milestone {
  hours: number;
  title: string;
  description: string;
  achieved: boolean;
  achievedAt?: string;
}

const COSMETOLOGY_MILESTONES: Omit<Milestone, 'achieved' | 'achievedAt'>[] = [
  { hours: 100,  title: 'First 100 Hours',        description: 'You\'ve completed your first 100 hours of salon training.' },
  { hours: 250,  title: 'Shampoo & Conditioning',  description: 'Proficiency in scalp analysis, shampoo techniques, and conditioning treatments.' },
  { hours: 500,  title: 'Quarter Way There',        description: '500 hours complete. You\'re building real salon skills.' },
  { hours: 750,  title: 'Chemical Services',        description: 'Demonstrated competency in color, perms, and relaxers.' },
  { hours: 1000, title: 'Halfway to Licensure',     description: '1,000 hours complete. You\'re halfway to your Indiana Cosmetology License.' },
  { hours: 1250, title: 'Skin & Nail Services',     description: 'Proficiency in facials, waxing, manicures, and pedicures.' },
  { hours: 1500, title: 'Advanced Techniques',      description: 'Mastery of advanced cutting, coloring, and styling techniques.' },
  { hours: 1750, title: 'Salon Management',         description: 'Completed business, sanitation, and client management modules.' },
  { hours: 2000, title: 'State Board Ready',        description: 'All 2,000 hours complete. Eligible to sit for the Indiana State Board exam.' },
];

const NAV = [
  { href: '/pwa/cosmetology', icon: Scissors, label: 'Home' },
  { href: '/pwa/cosmetology/log-hours', icon: Clock, label: 'Log' },
  { href: '/pwa/cosmetology/training', icon: BookOpen, label: 'Learn' },
  { href: '/pwa/cosmetology/progress', icon: TrendingUp, label: 'Progress' },
];

export default function CosmetologyMilestonesPage() {
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/pwa/cosmetology/progress')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { setTotalHours(d.apprentice?.totalHours ?? 0); })
      .catch(e => { if (e === 401) setError('Please sign in'); else setError('Failed to load'); })
      .finally(() => setLoading(false));
  }, []);

  const milestones: Milestone[] = COSMETOLOGY_MILESTONES.map(m => ({
    ...m,
    achieved: totalHours >= m.hours,
  }));

  const achieved = milestones.filter(m => m.achieved).length;

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center"><Loader2 className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-spin" /><p className="text-white">Loading milestones...</p></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="text-center"><AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" /><p className="text-slate-400 mb-4">{error}</p><Link href="/login?redirect=/pwa/cosmetology/milestones" className="px-6 py-3 bg-purple-600 text-white rounded-xl">Sign In</Link></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <header className="bg-purple-700 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/pwa/cosmetology" className="w-10 h-10 bg-purple-800 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-white font-bold text-xl">Milestones</h1>
        </div>
        <div className="bg-white/10 rounded-xl p-4 flex items-center justify-between">
          <div><p className="text-purple-200 text-sm">Achieved</p><p className="text-3xl font-black text-white">{achieved} / {milestones.length}</p></div>
          <Award className="w-12 h-12 text-purple-300" />
        </div>
      </header>

      <main className="px-4 py-6 space-y-3">
        {milestones.map((m) => (
          <div key={m.hours} className={`rounded-xl p-4 ${m.achieved ? 'bg-green-500/20 border border-green-500/30' : 'bg-slate-800'}`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${m.achieved ? 'bg-green-500' : 'bg-slate-700'}`}>
                {m.achieved ? <Award className="w-6 h-6 text-white" /> : <Lock className="w-5 h-5 text-slate-500" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className={`font-bold ${m.achieved ? 'text-green-300' : 'text-white'}`}>{m.title}</p>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${m.achieved ? 'bg-green-500/30 text-green-300' : 'bg-slate-700 text-slate-400'}`}>{m.hours.toLocaleString()} hrs</span>
                </div>
                <p className={`text-sm mt-1 ${m.achieved ? 'text-green-400' : 'text-slate-400'}`}>{m.description}</p>
                {!m.achieved && totalHours > 0 && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min((totalHours / m.hours) * 100, 100)}%` }} />
                    </div>
                    <p className="text-slate-500 text-xs mt-1">{Math.max(0, m.hours - totalHours).toLocaleString()} hours to go</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-6 py-3 safe-area-inset-bottom">
        <div className="flex justify-around">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 text-slate-400">
              <Icon className="w-6 h-6" /><span className="text-xs">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
