'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Clock, Award, Loader2, AlertCircle, BookOpen, Scissors } from 'lucide-react';

const TARGET_HOURS = 2000;

interface WeeklyData {
  weekEnding: string;
  hours: number;
  status: string;
}

interface Milestone {
  hours: number;
  title: string;
  achieved: boolean;
}

interface ProgressData {
  enrolled: boolean;
  apprentice: {
    name: string;
    totalHours: number;
    weeklyHours: number;
    startDate: string | null;
    shopName: string;
    nextMilestone: number;
  };
  weeklyData: WeeklyData[];
  milestones: Milestone[];
  targetHours: number;
}

function formatHours(hours: number): string {
  return hours.toLocaleString();
}

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/pwa/barber/progress');
      
      if (response.status === 401) {
        setError('Please sign in to view your progress');
        setLoading(false);
        return;
      }
      
      if (response.status === 404) {
        setError('You are not enrolled in the barber apprenticeship program');
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-slate-900">Loading progress...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-brand-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Unable to Load</h1>
          <p className="text-slate-500 mb-6">{error}</p>
          <Link
            href="/login?redirect=/pwa/barber/progress"
            className="inline-block px-6 py-3 bg-brand-blue-600 text-white rounded-xl font-medium"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { apprentice, weeklyData, milestones, targetHours } = data;
  const totalHours = apprentice.totalHours;
  const progressPercent = (totalHours / targetHours) * 100;
  
  // Calculate weekly average from actual data
  const avgWeeklyHours = weeklyData.length > 0 
    ? weeklyData.reduce((sum, w) => sum + w.hours, 0) / weeklyData.length 
    : 0;
  
  const weeksRemaining = avgWeeklyHours > 0 
    ? Math.ceil((targetHours - totalHours) / avgWeeklyHours) 
    : 0;

  // Format weekly data for display
  const formattedWeeklyData = weeklyData.map((week, index) => {
    const weekDate = new Date(week.weekEnding);
    const startDate = new Date(weekDate);
    startDate.setDate(startDate.getDate() - 6);
    
    return {
      week: index === 0 ? 'This Week' : index === 1 ? 'Last Week' : `${index + 1} Weeks Ago`,
      hours: week.hours,
      date: `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      status: week.status,
    };
  });

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="bg-brand-blue-600 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/pwa/barber" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-slate-900 font-bold text-xl">My Progress</h1>
        </div>

        {/* Main Progress */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
          <div className="text-center mb-4">
            <p className="text-6xl font-black text-slate-900">{formatHours(totalHours)}</p>
            <p className="text-brand-blue-200">of {formatHours(targetHours)} hours</p>
          </div>
          
          <div className="h-4 bg-white/20 rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-white rounded-full"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-slate-900">{progressPercent.toFixed(0)}%</p>
              <p className="text-brand-blue-200 text-xs">Complete</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{formatHours(Math.max(0, targetHours - totalHours))}</p>
              <p className="text-brand-blue-200 text-xs">Remaining</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{weeksRemaining > 0 ? `~${weeksRemaining}` : '-'}</p>
              <p className="text-brand-blue-200 text-xs">Weeks Left</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Weekly Average */}
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-brand-green-400" />
            <span className="text-slate-500 text-sm">Weekly Average</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{avgWeeklyHours.toFixed(1)} hrs/week</p>
          <p className="text-slate-500 text-sm mt-1">
            {weeklyData.length > 0 ? `Based on last ${weeklyData.length} weeks` : 'No data yet'}
          </p>
        </div>

        {/* Milestones */}
        <div>
          <h2 className="text-slate-900 font-bold text-lg mb-4">Milestones</h2>
          <div className="space-y-3">
            {milestones.map((milestone) => (
              <div 
                key={milestone.hours}
                className={`rounded-xl p-4 ${
                  milestone.achieved 
                    ? 'bg-brand-green-500/20 border border-brand-green-500/30' 
                    : 'bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    milestone.achieved ? 'bg-brand-green-500' : 'bg-slate-700'
                  }`}>
                    <Award className={`w-6 h-6 ${milestone.achieved ? 'text-white' : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${milestone.achieved ? 'text-brand-green-200' : 'text-white'}`}>
                      {milestone.title}
                    </p>
                    <p className={`text-sm ${milestone.achieved ? 'text-brand-green-300' : 'text-slate-400'}`}>
                      {formatHours(milestone.hours)} hours
                    </p>
                  </div>
                  {milestone.achieved && (
                    <span className="text-brand-green-400 text-sm font-medium">Achieved!</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly History */}
        <div>
          <h2 className="text-slate-900 font-bold text-lg mb-4">Recent Weeks</h2>
          {formattedWeeklyData.length > 0 ? (
            <div className="space-y-3">
              {formattedWeeklyData.map((week, index) => (
                <div key={index} className="bg-white rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-900 font-medium">{week.week}</p>
                      <p className="text-slate-500 text-sm">{week.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">{week.hours}</p>
                      <p className="text-slate-500 text-sm">hours</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 text-center">
              <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500">No hours logged yet</p>
              <Link 
                href="/pwa/barber/log-hours"
                className="inline-block mt-4 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm"
              >
                Log Your First Hours
              </Link>
            </div>
          )}
        </div>

        {/* Shop Info */}
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Scissors className="w-5 h-5 text-brand-blue-400" />
            <span className="text-slate-500 text-sm">Training Location</span>
          </div>
          <p className="text-slate-900 font-medium">{apprentice.shopName}</p>
          {apprentice.startDate && (
            <p className="text-slate-500 text-sm mt-1">
              Started {new Date(apprentice.startDate).toLocaleDateString()}
            </p>
          )}
        </div>
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
          <Link href="/pwa/barber/progress" className="flex flex-col items-center gap-1 text-brand-blue-400">
            <TrendingUp className="w-6 h-6" />
            <span className="text-xs">Progress</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
