'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { 
  ArrowLeft, Calendar, Clock, Users, TrendingUp,
  AlertCircle, Download, Share2, Loader2,
  Building2, FileText, ChevronRight, ChevronDown
} from 'lucide-react';

interface ApprenticeWeekly {
  id: string;
  name: string;
  hoursThisWeek: number;
  hoursApproved: number;
  hoursPending: number;
  daysWorked: number;
  onTrack: boolean;
}

interface WeeklyReport {
  weekEnding: string;
  shopName: string;
  totalHours: number;
  totalApproved: number;
  totalPending: number;
  apprenticeCount: number;
  avgHoursPerApprentice: number;
  apprentices: ApprenticeWeekly[];
  complianceStatus: 'compliant' | 'warning' | 'non-compliant';
}

export default function ShopWeeklyReportPage() {
  const [dbRows, setDbRows] = useState<any[]>([]);
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('settings').select('*').limit(50)
      .then(({ data }) => { if (data) setDbRows(data); });
  }, []);

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [expandedApprentice, setExpandedApprentice] = useState<string | null>(null);

  useEffect(() => {
    setTimeout(() => {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - weekEnd.getDay());
      
      setReport({
        weekEnding: weekEnd.toISOString(),
        shopName: 'Classic Cuts Barbershop',
        totalHours: 96,
        totalApproved: 72,
        totalPending: 24,
        apprenticeCount: 3,
        avgHoursPerApprentice: 32,
        complianceStatus: 'compliant',
        apprentices: [
          { id: '1', name: 'James W.', hoursThisWeek: 32, hoursApproved: 24, hoursPending: 8, daysWorked: 5, onTrack: true },
          { id: '2', name: 'Deja Williams', hoursThisWeek: 36, hoursApproved: 28, hoursPending: 8, daysWorked: 5, onTrack: true },
          { id: '3', name: 'Tyrone Davis', hoursThisWeek: 28, hoursApproved: 20, hoursPending: 8, daysWorked: 4, onTrack: false },
        ],
      });
      setLoading(false);
    }, 500);
  }, []);

  const handleShare = async () => {
    if (navigator.share && report) {
      try {
        await navigator.share({
          title: `Weekly Report - ${report.shopName}`,
          text: `Week ending ${new Date(report.weekEnding).toLocaleDateString()}: ${report.totalHours} total hours across ${report.apprenticeCount} apprentices.`,
        });
      } catch { /* share cancelled or unsupported */ }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-brand-blue-500 animate-spin" />
      </div>
    );
  }

  if (!report) return null;

  const statusConfig = {
    compliant: { bg: 'bg-brand-green-500/20', border: 'border-brand-green-500/30', text: 'text-brand-green-400', label: 'Compliant' },
    warning: { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400', label: 'Warning' },
    'non-compliant': { bg: 'bg-brand-red-500/20', border: 'border-brand-red-500/30', text: 'text-brand-red-400', label: 'Non-Compliant' },
  };

  const status = statusConfig[report.complianceStatus];

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="bg-slate-700 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link href="/pwa/shop-owner/reports" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Weekly Report</h1>
              <p className="text-brand-blue-200 text-sm">
                Week ending {new Date(report.weekEnding).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {'share' in navigator && (
              <button 
                onClick={handleShare}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
              >
                <Share2 className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-slate-900">{report.totalHours}</p>
            <p className="text-brand-blue-200 text-sm">Total Hours</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-slate-900">{report.apprenticeCount}</p>
            <p className="text-brand-blue-200 text-sm">Apprentices</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Compliance Status */}
        <div className={`${status.bg} border ${status.border} rounded-xl p-4`}>
          <div className="flex items-center gap-3">
            {report.complianceStatus === 'compliant' ? (
              <span className="text-slate-500 flex-shrink-0">•</span>
            ) : (
              <AlertCircle className={`w-6 h-6 ${status.text}`} />
            )}
            <div>
              <p className={`font-medium ${status.text}`}>{status.label}</p>
              <p className="text-slate-500 text-sm">
                {report.complianceStatus === 'compliant' 
                  ? 'All apprentices meeting weekly requirements'
                  : 'Some apprentices need attention'}
              </p>
            </div>
          </div>
        </div>

        {/* Hours Breakdown */}
        <div className="bg-white rounded-xl p-4">
          <h2 className="text-slate-900 font-medium mb-4">Hours Summary</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-white" />
                <span className="text-slate-600">Approved</span>
              </div>
              <span className="text-white font-medium">{report.totalApproved} hrs</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-white" />
                <span className="text-slate-600">Pending</span>
              </div>
              <span className="text-white font-medium">{report.totalPending} hrs</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-700">
              <span className="text-slate-600">Avg per Apprentice</span>
              <span className="text-white font-medium">{report.avgHoursPerApprentice} hrs</span>
            </div>
          </div>
          
          {/* Visual Bar */}
          <div className="mt-4 h-4 bg-white rounded-full overflow-hidden flex">
            <div 
              className="bg-white h-full"
              style={{ width: `${(report.totalApproved / report.totalHours) * 100}%` }}
            />
            <div 
              className="bg-amber-500 h-full"
              style={{ width: `${(report.totalPending / report.totalHours) * 100}%` }}
            />
          </div>
        </div>

        {/* Apprentice Breakdown */}
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-slate-900 font-medium">By Apprentice</h2>
          </div>
          <div className="divide-y divide-slate-700">
            {report.apprentices.map((apprentice) => (
              <div key={apprentice.id}>
                <button
                  onClick={() => setExpandedApprentice(
                    expandedApprentice === apprentice.id ? null : apprentice.id
                  )}
                  className="w-full p-4 flex items-center gap-4 hover:bg-slate-700/50"
                >
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-brand-blue-400 font-bold">
                      {apprentice.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-slate-900 font-medium">{apprentice.name}</p>
                      {!apprentice.onTrack && (
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <p className="text-slate-500 text-sm">
                      {apprentice.hoursThisWeek} hrs • {apprentice.daysWorked} days
                    </p>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${
                    expandedApprentice === apprentice.id ? 'rotate-180' : ''
                  }`} />
                </button>
                
                {expandedApprentice === apprentice.id && (
                  <div className="px-4 pb-4 bg-white/30">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-brand-green-400 font-bold">{apprentice.hoursApproved}</p>
                        <p className="text-slate-500 text-xs">Approved</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-amber-400 font-bold">{apprentice.hoursPending}</p>
                        <p className="text-slate-500 text-xs">Pending</p>
                      </div>
                    </div>
                    <Link 
                      href={`/pwa/shop-owner/apprentices/${apprentice.id}`}
                      className="flex items-center justify-center gap-2 text-brand-blue-400 text-sm"
                    >
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link 
            href="/pwa/shop-owner/approve-hours"
            className="flex items-center gap-4 bg-amber-600 rounded-xl p-4"
          >
            <span className="text-slate-500 flex-shrink-0">•</span>
            <span className="text-white font-medium flex-1">Approve Pending Hours</span>
            <span className="bg-white/20 px-2 py-1 rounded text-white text-sm">
              {report.totalPending} hrs
            </span>
          </Link>

          <Link 
            href="/pwa/shop-owner/reports"
            className="flex items-center gap-4 bg-slate-800 rounded-xl p-4"
          >
            <Download className="w-6 h-6 text-slate-400" />
            <span className="text-white font-medium flex-1">Export Full Report</span>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </Link>
        </div>
      </main>

      {/* Bottom Navigation */}
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
          <Link href="/pwa/shop-owner/reports" className="flex flex-col items-center gap-1 text-brand-blue-400">
            <FileText className="w-6 h-6" />
            <span className="text-xs">Reports</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
