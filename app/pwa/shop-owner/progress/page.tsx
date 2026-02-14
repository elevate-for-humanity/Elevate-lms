'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, Clock, Users, Building2, FileText,
  Award, Calendar, ChevronRight, Target, Zap,
  Loader2, AlertCircle
} from 'lucide-react';

interface WeeklyData {
  week: string;
  weekEnding: string;
  hours: number;
}

interface Milestone {
  hours: number;
  label: string;
  color: string;
}

interface ApprenticeProgress {
  id: string;
  name: string;
  totalHours: number;
  targetHours: number;
  weeklyAvg: number;
  trend: 'up' | 'down' | 'stable';
  nextMilestone: number;
  progress: number;
  startDate: string;
}

interface ProgressData {
  isPartner: boolean;
  apprentices: ApprenticeProgress[];
  weeklyData: WeeklyData[];
  milestones: Milestone[];
  summary: {
    totalShopHours: number;
    avgProgress: number;
    totalWeeklyHours: number;
    nextGraduation: {
      name: string;
      estimatedDate: string | null;
    } | null;
  };
}

function ProgressBar({ current, target, color = 'bg-brand-blue-500' }: { 
  current: number; 
  target: number; 
  color?: string;
}) {
  const percent = Math.min((current / target) * 100, 100);
  return (
    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
      <div 
        className={`h-full ${color} rounded-full transition-all duration-500`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function TrendIndicator({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') {
    return <span className="text-green-400 text-xs">↑ Improving</span>;
  }
  if (trend === 'down') {
    return <span className="text-red-400 text-xs">↓ Declining</span>;
  }
  return <span className="text-slate-400 text-xs">→ Stable</span>;
}

export default function ShopOwnerProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/pwa/shop-owner/progress');
      
      if (response.status === 401) {
        setError('Please sign in to view progress');
        setLoading(false);
        return;
      }
      
      if (response.status === 404) {
        setError('You are not associated with a partner shop');
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch progress');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching progress:', err);
      setError('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-white">Loading progress...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Unable to Load</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link
            href="/login?redirect=/pwa/shop-owner/progress"
            className="inline-block px-6 py-3 bg-brand-blue-600 text-white rounded-xl font-medium"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { apprentices, weeklyData, milestones, summary } = data;
  const maxWeeklyHours = Math.max(...weeklyData.map(w => w.hours), 1);

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <header className="bg-slate-700 px-4 pt-12 pb-6 safe-area-inset-top">
        <h1 className="text-2xl font-bold text-white mb-2">Shop Progress</h1>
        <p className="text-brand-blue-200">Track your team's advancement</p>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-brand-blue-200 text-xs">Total Shop Hours</p>
            <p className="text-2xl font-bold text-white">{summary.totalShopHours.toLocaleString()}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-brand-blue-200 text-xs">Avg Progress</p>
            <p className="text-2xl font-bold text-white">{summary.avgProgress}%</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Weekly Chart */}
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold">Weekly Hours</h2>
            <span className="text-brand-blue-400 text-sm">{summary.totalWeeklyHours} hrs total</span>
          </div>
          
          {weeklyData.length > 0 ? (
            <div className="flex items-end gap-2 h-32">
              {weeklyData.map((week, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-brand-blue-500 rounded-t-lg transition-all duration-300"
                    style={{ height: `${(week.hours / maxWeeklyHours) * 100}%`, minHeight: '4px' }}
                  />
                  <span className="text-slate-500 text-xs">{week.week.replace('Week ', 'W')}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center">
              <p className="text-slate-500">No data yet</p>
            </div>
          )}
        </div>

        {/* Milestone Overview */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h2 className="text-white font-bold mb-4">Milestone Tracker</h2>
          
          <div className="space-y-4">
            {milestones.map((milestone, i) => {
              const apprenticesPast = apprentices.filter(a => a.totalHours >= milestone.hours).length;
              const colorClass = `bg-${milestone.color}-500`;
              
              return (
                <div key={milestone.hours} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${colorClass}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">{milestone.label}</span>
                      <span className="text-slate-400 text-xs">{milestone.hours.toLocaleString()} hrs</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {apprentices.length > 0 ? (
                      [...Array(apprentices.length)].map((_, idx) => (
                        <div 
                          key={idx}
                          className={`w-2 h-2 rounded-full ${
                            idx < apprenticesPast ? colorClass : 'bg-slate-700'
                          }`}
                        />
                      ))
                    ) : (
                      <span className="text-slate-500 text-xs">No apprentices</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Individual Progress */}
        <div>
          <h2 className="text-white font-bold mb-4">Apprentice Progress</h2>
          
          {apprentices.length === 0 ? (
            <div className="bg-slate-800 rounded-xl p-8 text-center">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No apprentices assigned yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apprentices.map((apprentice) => {
                const hoursToNext = apprentice.nextMilestone - apprentice.totalHours;
                
                return (
                  <Link
                    key={apprentice.id}
                    href={`/pwa/shop-owner/apprentices/${apprentice.id}`}
                    className="block bg-slate-800 rounded-xl p-4 active:bg-slate-700"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-blue-500/20 rounded-full flex items-center justify-center">
                          <span className="text-brand-blue-400 font-bold">
                            {apprentice.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{apprentice.name}</p>
                          <TrendIndicator trend={apprentice.trend} />
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">
                          {apprentice.totalHours.toLocaleString()} / {apprentice.targetHours.toLocaleString()} hrs
                        </span>
                        <span className="text-white font-medium">{apprentice.progress.toFixed(1)}%</span>
                      </div>
                      <ProgressBar current={apprentice.totalHours} target={apprentice.targetHours} />
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-amber-400" />
                          <span className="text-slate-400 text-xs">
                            {hoursToNext > 0 ? `${hoursToNext} hrs to ${apprentice.nextMilestone.toLocaleString()}` : 'Complete!'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-green-400" />
                          <span className="text-slate-400 text-xs">
                            {apprentice.weeklyAvg} hrs/week avg
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span className="text-slate-400 text-sm">Next Graduation</span>
            </div>
            {summary.nextGraduation ? (
              <>
                <p className="text-white font-bold">{summary.nextGraduation.name}</p>
                <p className="text-slate-400 text-xs">
                  {summary.nextGraduation.estimatedDate 
                    ? `Est. ${new Date(summary.nextGraduation.estimatedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                    : 'Calculating...'}
                </p>
              </>
            ) : (
              <p className="text-slate-500 text-sm">No apprentices yet</p>
            )}
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-brand-blue-400" />
              <span className="text-slate-400 text-sm">This Month</span>
            </div>
            <p className="text-white font-bold">{summary.totalWeeklyHours} hrs</p>
            <p className="text-slate-400 text-xs">Last 4 weeks</p>
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-6 py-3 safe-area-inset-bottom">
        <div className="flex justify-around">
          <Link href="/pwa/shop-owner" className="flex flex-col items-center gap-1 text-slate-400">
            <Building2 className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/pwa/shop-owner/log-hours" className="flex flex-col items-center gap-1 text-slate-400">
            <Clock className="w-6 h-6" />
            <span className="text-xs">Log</span>
          </Link>
          <Link href="/pwa/shop-owner/apprentices" className="flex flex-col items-center gap-1 text-slate-400">
            <Users className="w-6 h-6" />
            <span className="text-xs">Team</span>
          </Link>
          <Link href="/pwa/shop-owner/reports" className="flex flex-col items-center gap-1 text-slate-400">
            <FileText className="w-6 h-6" />
            <span className="text-xs">Reports</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
