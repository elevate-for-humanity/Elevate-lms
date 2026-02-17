'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft, Award, Trophy, Star, Lock,
  Clock, Loader2, Target, Medal, Crown, Sparkles
} from 'lucide-react';

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  required_hours: number;
  completed_hours: number;
  status: string;
  milestone_type: string;
  unlocked_at: string | null;
  completed_at: string | null;
  badge_image_url: string | null;
  sort_order: number;
}

const ICON_MAP: Record<string, any> = {
  star: Star,
  trophy: Trophy,
  medal: Medal,
  crown: Crown,
  award: Award,
  target: Target,
};

export default function MilestonesPage() {
  const [loading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [totalHours, setTotalHours] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const [msRes, hoursRes] = await Promise.all([
          supabase.from('apprentice_milestones').select('*').eq('user_id', user.id).order('sort_order', { ascending: true }),
          supabase.from('hour_entries').select('hours').eq('user_id', user.id).eq('status', 'approved'),
        ]);

        const total = (hoursRes.data || []).reduce((sum, h) => sum + (Number(h.hours) || 0), 0);
        setMilestones(msRes.data || []);
        setTotalHours(Math.round(total));
      } catch {
        // Fail gracefully — show empty state
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-brand-blue-500 animate-spin" />
      </div>
    );
  }

  const unlocked = milestones.filter(m => m.status === 'completed' || m.status === 'unlocked');
  const nextMilestone = milestones.find(m => m.status !== 'completed' && m.status !== 'unlocked');

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <header className="bg-amber-500 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/pwa/barber" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Milestones & Achievements</h1>
            <p className="text-amber-100 text-sm">Track your progress</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-3xl font-bold text-white">{totalHours.toLocaleString()}</p>
            <p className="text-amber-100 text-xs">Total Hours</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-3xl font-bold text-white">{unlocked.length}</p>
            <p className="text-amber-100 text-xs">Milestones</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-3xl font-bold text-white">{milestones.length}</p>
            <p className="text-amber-100 text-xs">Total</p>
          </div>
        </div>
      </header>

      {/* Next milestone progress */}
      {nextMilestone && (
        <div className="px-4 -mt-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Next: {nextMilestone.title}</p>
              <p className="text-sm font-bold text-amber-400">
                {totalHours} / {nextMilestone.required_hours} hrs
              </p>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className="bg-amber-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(100, (totalHours / nextMilestone.required_hours) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Milestones list */}
      <div className="px-4 py-6 space-y-4">
        {milestones.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No milestones set up yet.</p>
            <p className="text-sm text-slate-500 mt-1">Your milestones will appear here as you progress.</p>
          </div>
        ) : (
          milestones.map((m) => {
            const isUnlocked = m.status === 'completed' || m.status === 'unlocked';
            const isActive = !isUnlocked && totalHours >= (m.required_hours * 0.5);
            const progress = Math.min(100, (totalHours / m.required_hours) * 100);
            const IconComponent = ICON_MAP[m.milestone_type] || Award;

            return (
              <div
                key={m.id}
                className={`rounded-xl p-4 border transition ${
                  isUnlocked
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : isActive
                      ? 'bg-slate-800 border-slate-600'
                      : 'bg-slate-800/50 border-slate-700/50 opacity-60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isUnlocked ? 'bg-amber-500' : 'bg-slate-700'
                  }`}>
                    {isUnlocked ? (
                      <IconComponent className="w-6 h-6 text-white" />
                    ) : (
                      <Lock className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-bold ${isUnlocked ? 'text-amber-400' : 'text-white'}`}>
                        {m.title}
                      </h3>
                      {isUnlocked && (
                        <Sparkles className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{m.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-400">{m.required_hours.toLocaleString()} hours required</span>
                    </div>
                    {!isUnlocked && (
                      <div className="mt-3">
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-amber-500 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{Math.round(progress)}% complete</p>
                      </div>
                    )}
                    {isUnlocked && m.completed_at && (
                      <p className="text-xs text-amber-400/70 mt-2">
                        Unlocked {new Date(m.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
