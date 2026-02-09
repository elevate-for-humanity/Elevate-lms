'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Mail, Calendar, Clock, TrendingUp,
  Award, CheckCircle, AlertCircle, Loader2, Share2,
  Scissors, BookOpen, ChevronRight
} from 'lucide-react';

interface WeeklySummary {
  weekEnding: string;
  totalHours: number;
  practicalHours: number;
  theoryHours: number;
  sanitationHours: number;
  approvedHours: number;
  pendingHours: number;
  daysWorked: number;
  avgHoursPerDay: number;
  cumulativeHours: number;
  progressPercent: number;
  milestonesReached: string[];
  supervisorName: string;
  shopName: string;
}

export default function WeeklySummaryPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<WeeklySummary | null>(null);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - weekEnd.getDay()); // Last Sunday
      
      setSummary({
        weekEnding: weekEnd.toISOString(),
        totalHours: 32,
        practicalHours: 24,
        theoryHours: 6,
        sanitationHours: 2,
        approvedHours: 24,
        pendingHours: 8,
        daysWorked: 5,
        avgHoursPerDay: 6.4,
        cumulativeHours: 847,
        progressPercent: 42,
        milestonesReached: [],
        supervisorName: 'James Williams',
        shopName: 'Classic Cuts Barbershop',
      });
      setLoading(false);
    }, 500);
  }, []);

  const handleShare = async () => {
    if (navigator.share && summary) {
      try {
        await navigator.share({
          title: 'Weekly Hours Summary',
          text: `Week ending ${new Date(summary.weekEnding).toLocaleDateString()}: ${summary.totalHours} hours logged. Total progress: ${summary.cumulativeHours}/2,000 hours (${summary.progressPercent}%)`,
        });
      } catch (err) {
        // User cancelled
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <header className="bg-slate-700 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link href="/pwa/barber" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Weekly Summary</h1>
              <p className="text-blue-200 text-sm">
                Week ending {new Date(summary.weekEnding).toLocaleDateString()}
              </p>
            </div>
          </div>
          {'share' in navigator && (
            <button 
              onClick={handleShare}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
            >
              <Share2 className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {/* Week Total */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
          <p className="text-blue-200 text-sm mb-1">Hours This Week</p>
          <p className="text-5xl font-bold text-white mb-2">{summary.totalHours}</p>
          <p className="text-blue-200 text-sm">
            {summary.daysWorked} days worked • {summary.avgHoursPerDay.toFixed(1)} hrs/day avg
          </p>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Hours Breakdown */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h2 className="text-white font-medium mb-4">Hours Breakdown</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-slate-300">Practical Training</span>
              </div>
              <span className="text-white font-medium">{summary.practicalHours} hrs</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-slate-300">Theory/Classroom</span>
              </div>
              <span className="text-white font-medium">{summary.theoryHours} hrs</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-slate-300">Sanitation</span>
              </div>
              <span className="text-white font-medium">{summary.sanitationHours} hrs</span>
            </div>
          </div>
          
          {/* Visual Bar */}
          <div className="mt-4 h-4 bg-slate-700 rounded-full overflow-hidden flex">
            <div 
              className="bg-blue-500 h-full"
              style={{ width: `${(summary.practicalHours / summary.totalHours) * 100}%` }}
            />
            <div 
              className="bg-blue-500 h-full"
              style={{ width: `${(summary.theoryHours / summary.totalHours) * 100}%` }}
            />
            <div 
              className="bg-green-500 h-full"
              style={{ width: `${(summary.sanitationHours / summary.totalHours) * 100}%` }}
            />
          </div>
        </div>

        {/* Approval Status */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h2 className="text-white font-medium mb-4">Approval Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
              <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{summary.approvedHours}</p>
              <p className="text-green-400 text-sm">Approved</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
              <Clock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{summary.pendingHours}</p>
              <p className="text-amber-400 text-sm">Pending</p>
            </div>
          </div>
        </div>

        {/* Cumulative Progress */}
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <span className="text-purple-300 font-medium">Overall Progress</span>
          </div>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-3xl font-bold text-white">{summary.cumulativeHours}</p>
              <p className="text-blue-200 text-sm">of 2,000 hours</p>
            </div>
            <p className="text-2xl font-bold text-purple-300">{summary.progressPercent}%</p>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-slate-700 rounded-full"
              style={{ width: `${summary.progressPercent}%` }}
            />
          </div>
          <p className="text-blue-200 text-sm mt-2">
            {2000 - summary.cumulativeHours} hours remaining
          </p>
        </div>

        {/* Training Location */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h2 className="text-white font-medium mb-3">Training Location</h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Scissors className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-white font-medium">{summary.shopName}</p>
              <p className="text-slate-400 text-sm">Supervisor: {summary.supervisorName}</p>
            </div>
          </div>
        </div>

        {/* Milestones */}
        {summary.milestonesReached.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-amber-400" />
              <span className="text-amber-300 font-medium">Milestones Reached This Week!</span>
            </div>
            {summary.milestonesReached.map((milestone, index) => (
              <div key={index} className="flex items-center gap-2 text-white">
                <CheckCircle className="w-4 h-4 text-amber-400" />
                <span>{milestone}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Link 
            href="/pwa/barber/history"
            className="flex items-center gap-4 bg-slate-800 rounded-xl p-4"
          >
            <Calendar className="w-6 h-6 text-slate-400" />
            <span className="text-white font-medium flex-1">View Full History</span>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </Link>
          
          <Link 
            href="/pwa/barber/reports/export"
            className="flex items-center gap-4 bg-slate-800 rounded-xl p-4"
          >
            <Mail className="w-6 h-6 text-slate-400" />
            <span className="text-white font-medium flex-1">Export Report</span>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </Link>
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
          <Link href="/pwa/barber/progress" className="flex flex-col items-center gap-1 text-slate-400">
            <TrendingUp className="w-6 h-6" />
            <span className="text-xs">Progress</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
