'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Award, Trophy, Star, Lock, CheckCircle,
  Clock, Scissors, BookOpen, TrendingUp, Loader2,
  Sparkles, Target, Medal, Crown
} from 'lucide-react';

interface Milestone {
  id: string;
  title: string;
  description: string;
  hoursRequired: number;
  icon: 'star' | 'trophy' | 'medal' | 'crown' | 'award';
  unlocked: boolean;
  unlockedAt?: string;
  reward?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'hours' | 'training' | 'streak' | 'special';
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

const MILESTONES: Milestone[] = [
  { id: '1', title: 'First Steps', description: 'Complete your first 100 hours', hoursRequired: 100, icon: 'star', unlocked: true, unlockedAt: '2024-09-15', reward: 'Apprentice Badge' },
  { id: '2', title: 'Quarter Way', description: 'Reach 500 hours of training', hoursRequired: 500, icon: 'medal', unlocked: true, unlockedAt: '2024-11-20', reward: 'Bronze Certificate' },
  { id: '3', title: 'Halfway There', description: 'Complete 1,000 hours', hoursRequired: 1000, icon: 'trophy', unlocked: false, reward: 'Silver Certificate' },
  { id: '4', title: 'Final Stretch', description: 'Reach 1,500 hours', hoursRequired: 1500, icon: 'award', unlocked: false, reward: 'Gold Certificate' },
  { id: '5', title: 'Licensed Barber', description: 'Complete all 2,000 hours', hoursRequired: 2000, icon: 'crown', unlocked: false, reward: 'State Board Eligibility' },
];

const ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', title: 'Early Bird', description: 'Log hours before 8 AM', icon: '🌅', category: 'special', unlocked: true, unlockedAt: '2024-10-05' },
  { id: 'a2', title: 'Consistent', description: 'Log hours 5 days in a row', icon: '🔥', category: 'streak', unlocked: true, unlockedAt: '2024-10-12' },
  { id: 'a3', title: 'Bookworm', description: 'Complete 10 training modules', icon: '📚', category: 'training', unlocked: true, unlockedAt: '2024-11-01' },
  { id: 'a4', title: 'Marathon', description: 'Log 40+ hours in a week', icon: '🏃', category: 'hours', unlocked: false, progress: 32, target: 40 },
  { id: 'a5', title: 'Perfect Month', description: 'Log hours every day for a month', icon: '📅', category: 'streak', unlocked: false, progress: 18, target: 30 },
  { id: 'a6', title: 'Theory Master', description: 'Score 90%+ on all quizzes', icon: '🎓', category: 'training', unlocked: false, progress: 7, target: 10 },
  { id: 'a7', title: 'Century Club', description: 'Log 100 hours in a month', icon: '💯', category: 'hours', unlocked: false, progress: 64, target: 100 },
  { id: 'a8', title: 'Night Owl', description: 'Log hours after 8 PM', icon: '🦉', category: 'special', unlocked: true, unlockedAt: '2024-09-28' },
];

const ICON_MAP = {
  star: Star,
  trophy: Trophy,
  medal: Medal,
  crown: Crown,
  award: Award,
};

export default function MilestonesPage() {
  const [loading, setLoading] = useState(true);
  const [totalHours, setTotalHours] = useState(847);
  const [activeTab, setActiveTab] = useState<'milestones' | 'achievements'>('milestones');

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-brand-blue-500 animate-spin" />
      </div>
    );
  }

  const nextMilestone = MILESTONES.find(m => !m.unlocked);
  const unlockedAchievements = ACHIEVEMENTS.filter(a => a.unlocked).length;

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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-3xl font-bold text-white">{totalHours}</p>
            <p className="text-amber-100 text-xs">Total Hours</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-3xl font-bold text-white">{MILESTONES.filter(m => m.unlocked).length}</p>
            <p className="text-amber-100 text-xs">Milestones</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-3xl font-bold text-white">{unlockedAchievements}</p>
            <p className="text-amber-100 text-xs">Achievements</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-4 py-4">
        <div className="flex bg-slate-800 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('milestones')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'milestones' ? 'bg-amber-500 text-white' : 'text-slate-400'
            }`}
          >
            Milestones
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'achievements' ? 'bg-amber-500 text-white' : 'text-slate-400'
            }`}
          >
            Achievements
          </button>
        </div>
      </div>

      <main className="px-4 space-y-4">
        {activeTab === 'milestones' ? (
          <>
            {/* Next Milestone */}
            {nextMilestone && (
              <div className="bg-brand-blue-500/20 border border-brand-blue-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-brand-blue-400" />
                  <span className="text-brand-blue-300 text-sm font-medium">Next Milestone</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-brand-blue-500/30 rounded-xl flex items-center justify-center">
                    {(() => {
                      const Icon = ICON_MAP[nextMilestone.icon];
                      return <Icon className="w-7 h-7 text-brand-blue-400" />;
                    })()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold">{nextMilestone.title}</h3>
                    <p className="text-brand-blue-200 text-sm">{nextMilestone.description}</p>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-brand-blue-300">{totalHours} / {nextMilestone.hoursRequired} hours</span>
                        <span className="text-brand-blue-300">{Math.round((totalHours / nextMilestone.hoursRequired) * 100)}%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-blue-500 rounded-full"
                          style={{ width: `${Math.min((totalHours / nextMilestone.hoursRequired) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* All Milestones */}
            <div className="space-y-3">
              {MILESTONES.map((milestone, index) => {
                const Icon = ICON_MAP[milestone.icon];
                const progress = Math.min((totalHours / milestone.hoursRequired) * 100, 100);
                
                return (
                  <div 
                    key={milestone.id}
                    className={`bg-slate-800 rounded-xl p-4 ${!milestone.unlocked && 'opacity-60'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        milestone.unlocked ? 'bg-amber-500' : 'bg-slate-700'
                      }`}>
                        {milestone.unlocked ? (
                          <Icon className="w-6 h-6 text-white" />
                        ) : (
                          <Lock className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-medium">{milestone.title}</h3>
                          {milestone.unlocked && (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          )}
                        </div>
                        <p className="text-slate-400 text-sm">{milestone.description}</p>
                        {milestone.unlocked && milestone.unlockedAt && (
                          <p className="text-green-400 text-xs mt-1">
                            Unlocked {new Date(milestone.unlockedAt).toLocaleDateString()}
                          </p>
                        )}
                        {!milestone.unlocked && (
                          <div className="mt-2">
                            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-amber-500/50 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${milestone.unlocked ? 'text-amber-400' : 'text-slate-500'}`}>
                          {milestone.hoursRequired}
                        </p>
                        <p className="text-slate-500 text-xs">hours</p>
                      </div>
                    </div>
                    {milestone.reward && (
                      <div className={`mt-3 pt-3 border-t ${milestone.unlocked ? 'border-amber-500/30' : 'border-slate-700'}`}>
                        <p className={`text-sm ${milestone.unlocked ? 'text-amber-300' : 'text-slate-500'}`}>
                          🎁 Reward: {milestone.reward}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Achievements Tab */
          <div className="space-y-3">
            {ACHIEVEMENTS.map((achievement) => (
              <div 
                key={achievement.id}
                className={`bg-slate-800 rounded-xl p-4 ${!achievement.unlocked && 'opacity-60'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                    achievement.unlocked ? 'bg-amber-500/20' : 'bg-slate-700'
                  }`}>
                    {achievement.unlocked ? achievement.icon : '🔒'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-medium">{achievement.title}</h3>
                      {achievement.unlocked && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                    <p className="text-slate-400 text-sm">{achievement.description}</p>
                    {achievement.unlocked && achievement.unlockedAt && (
                      <p className="text-green-400 text-xs mt-1">
                        Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                    {!achievement.unlocked && achievement.progress !== undefined && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500">{achievement.progress} / {achievement.target}</span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500/50 rounded-full"
                            style={{ width: `${(achievement.progress / (achievement.target || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-6 py-3 safe-area-inset-bottom">
        <div className="flex justify-around">
          <Link href="/pwa/barber" className="flex flex-col items-center gap-1 text-slate-400">
            <Scissors className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/pwa/barber/log-hours" className="flex flex-col items-center gap-1 text-slate-400">
            <Clock className="w-6 h-6" />
            <span className="text-xs">Log</span>
          </Link>
          <Link href="/pwa/barber/training" className="flex flex-col items-center gap-1 text-slate-400">
            <BookOpen className="w-6 h-6" />
            <span className="text-xs">Learn</span>
          </Link>
          <Link href="/pwa/barber/progress" className="flex flex-col items-center gap-1 text-slate-400">
            <TrendingUp className="w-6 h-6" />
            <span className="text-xs">Progress</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
