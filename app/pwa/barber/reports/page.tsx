'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, FileText, Download, Calendar, Clock,
  TrendingUp, Award, ChevronRight, Loader2, 
  Scissors, BookOpen
} from 'lucide-react';

interface ReportSummary {
  totalHours: number;
  thisWeek: number;
  thisMonth: number;
  pendingApproval: number;
  approved: number;
  milestoneProgress: number;
}

export default function BarberReportsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ReportSummary>({
    totalHours: 0,
    thisWeek: 0,
    thisMonth: 0,
    pendingApproval: 0,
    approved: 0,
    milestoneProgress: 0,
  });

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setSummary({
        totalHours: 847,
        thisWeek: 32,
        thisMonth: 128,
        pendingApproval: 8,
        approved: 839,
        milestoneProgress: 42,
      });
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <header className="bg-slate-800 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4">
          <Link href="/pwa/barber" className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Reports</h1>
            <p className="text-slate-400 text-sm">View and export your hours</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <span className="text-slate-400 text-sm">Total Hours</span>
            </div>
            <p className="text-3xl font-bold text-white">{summary.totalHours}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-slate-400 text-sm">This Month</span>
            </div>
            <p className="text-3xl font-bold text-white">{summary.thisMonth}</p>
          </div>
        </div>

        {/* Progress to Goal */}
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              <span className="text-white font-medium">Progress to 2,000 Hours</span>
            </div>
            <span className="text-purple-300 font-bold">{summary.milestoneProgress}%</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${summary.milestoneProgress}%` }}
            />
          </div>
          <p className="text-blue-200 text-sm mt-2">
            {2000 - summary.totalHours} hours remaining
          </p>
        </div>

        {/* Status Breakdown */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h2 className="text-white font-medium mb-4">Hours Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Approved</span>
              <span className="text-green-400 font-medium">{summary.approved} hrs</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Pending Approval</span>
              <span className="text-amber-400 font-medium">{summary.pendingApproval} hrs</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">This Week</span>
              <span className="text-white font-medium">{summary.thisWeek} hrs</span>
            </div>
          </div>
        </div>

        {/* Report Actions */}
        <div className="space-y-3">
          <h2 className="text-white font-medium">Export Reports</h2>
          
          <Link 
            href="/pwa/barber/reports/export"
            className="flex items-center gap-4 bg-blue-600 rounded-xl p-4 active:bg-blue-700"
          >
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">Export Hours Report</p>
              <p className="text-blue-200 text-sm">PDF, CSV, or Excel format</p>
            </div>
            <ChevronRight className="w-5 h-5 text-blue-200" />
          </Link>

          <Link 
            href="/pwa/barber/history"
            className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 active:bg-slate-700"
          >
            <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-slate-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">View Hour History</p>
              <p className="text-slate-400 text-sm">See all logged entries</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </Link>

          <Link 
            href="/pwa/barber/progress"
            className="flex items-center gap-4 bg-slate-800 rounded-xl p-4 active:bg-slate-700"
          >
            <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-slate-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">Detailed Progress</p>
              <p className="text-slate-400 text-sm">Charts and milestones</p>
            </div>
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
