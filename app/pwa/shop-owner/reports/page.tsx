'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, Download, Clock, Users, 
  Building2, ChevronRight, ChevronDown,
  AlertTriangle, TrendingUp, Loader2, AlertCircle,
CheckCircle, } from 'lucide-react';

type ReportPeriod = 'week' | 'month' | 'quarter' | 'year';
type ReportType = 'hours' | 'compliance' | 'progress';

interface ApprenticeReport {
  id: string;
  name: string;
  totalHours: number;
  periodHours: number;
  weeklyHours: number;
  monthlyHours: number;
  targetHours: number;
  complianceStatus: 'compliant' | 'warning' | 'non-compliant';
  lastLogDate: string | null;
  startDate: string;
  progress: number;
}

interface ReportsData {
  isPartner: boolean;
  apprentices: ApprenticeReport[];
  summary: {
    totalHours: number;
    avgHoursPerApprentice: number;
    compliantCount: number;
    totalApprentices: number;
  };
  period: string;
}

function StatCard({ label, value, icon: Icon, color }: { 
  label: string; 
  value: string | number; 
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4">
      <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-slate-500 text-sm">{label}</p>
    </div>
  );
}

function ComplianceStatusBadge({ status }: { status: ApprenticeReport['complianceStatus'] }) {
  const config = {
    compliant: { bg: 'bg-brand-green-500/20', text: 'text-brand-green-400', label: 'Compliant' },
    warning: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Warning' },
    'non-compliant': { bg: 'bg-brand-red-500/20', text: 'text-brand-red-400', label: 'Non-Compliant' },
  };
  const { bg, text, label } = config[status];
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
}

export default function ShopOwnerReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [reportType, setReportType] = useState<ReportType>('hours');
  const [expandedApprentice, setExpandedApprentice] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, [period]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pwa/shop-owner/reports?period=${period}`);
      
      if (response.status === 401) {
        setError('Please sign in to view reports');
        setLoading(false);
        return;
      }
      
      if (response.status === 404) {
        setError('You are not associated with a partner shop');
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: 'hours' | 'compliance') => {
    // In production, this would trigger a CSV/PDF download
    alert(`Exporting ${type} report. Please check your downloads folder.`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-slate-900">Loading reports...</p>
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
            href="/login?redirect=/pwa/shop-owner/reports"
            className="inline-block px-6 py-3 bg-brand-blue-600 text-white rounded-xl font-medium"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { apprentices, summary } = data;

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="bg-slate-700 px-4 pt-12 pb-6 safe-area-inset-top">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Reports</h1>
        <p className="text-white">Hours tracking and compliance reports</p>
      </header>

      <div className="px-4 py-4">
        <div className="flex gap-2 bg-white rounded-xl p-1">
          {(['week', 'month', 'quarter', 'year'] as ReportPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                period === p 
                  ? 'bg-brand-blue-600 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 grid grid-cols-2 gap-3">
        <StatCard 
          label="Total Hours" 
          value={summary.totalHours.toLocaleString()} 
          icon={Clock}
          color="bg-brand-blue-500"
        />
        <StatCard 
          label="Avg per Apprentice" 
          value={summary.avgHoursPerApprentice} 
          icon={TrendingUp}
          color="bg-brand-blue-500"
        />
        <StatCard 
          label="Apprentices" 
          value={summary.totalApprentices} 
          icon={Users}
          color="bg-brand-green-500"
        />
        <StatCard 
          label="Compliant" 
          value={`${summary.compliantCount}/${summary.totalApprentices}`} 
          icon={CheckCircle}
          color="bg-amber-500"
        />
      </div>

      <div className="px-4 py-4">
        <div className="flex gap-2">
          {([
            { type: 'hours', label: 'Hours', icon: Clock },
            { type: 'compliance', label: 'Compliance', icon: CheckCircle },
            { type: 'progress', label: 'Progress', icon: TrendingUp },
          ] as const).map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                reportType === type 
                  ? 'bg-brand-blue-600 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-slate-900 font-bold">Apprentice Details</h2>
          <button 
            onClick={() => handleExport(reportType === 'compliance' ? 'compliance' : 'hours')}
            className="flex items-center gap-2 text-brand-blue-400 text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {apprentices.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500">No apprentices assigned yet</p>
          </div>
        ) : (
          apprentices.map((apprentice) => (
            <div key={apprentice.id} className="bg-white rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedApprentice(
                  expandedApprentice === apprentice.id ? null : apprentice.id
                )}
                className="w-full flex items-center gap-4 p-4"
              >
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-brand-blue-400 font-bold text-lg">
                    {apprentice.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-slate-900 font-medium">{apprentice.name}</p>
                  <p className="text-slate-500 text-sm">
                    {apprentice.totalHours.toLocaleString()} total hours
                  </p>
                </div>
                <ComplianceStatusBadge status={apprentice.complianceStatus} />
                <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${
                  expandedApprentice === apprentice.id ? 'rotate-180' : ''
                }`} />
              </button>

              {expandedApprentice === apprentice.id && (
                <div className="px-4 pb-4 border-t border-slate-700 pt-4 space-y-3">
                  {reportType === 'hours' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">This Week</span>
                        <span className="text-white font-medium">{apprentice.weeklyHours} hrs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">This {period.charAt(0).toUpperCase() + period.slice(1)}</span>
                        <span className="text-white font-medium">{apprentice.periodHours} hrs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Hours</span>
                        <span className="text-white font-medium">{apprentice.totalHours.toLocaleString()} hrs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Last Log</span>
                        <span className="text-white font-medium">
                          {apprentice.lastLogDate 
                            ? new Date(apprentice.lastLogDate).toLocaleDateString()
                            : 'No logs yet'}
                        </span>
                      </div>
                    </>
                  )}

                  {reportType === 'compliance' && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Status</span>
                        <ComplianceStatusBadge status={apprentice.complianceStatus} />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Weekly Minimum (30 hrs)</span>
                        <span className={apprentice.weeklyHours >= 30 ? 'text-brand-green-400' : 'text-amber-400'}>
                          {apprentice.weeklyHours >= 30 ? '• Met' : '⚠ Below'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Hours Logged This Week</span>
                        <span className="text-white font-medium">{apprentice.weeklyHours} hrs</span>
                      </div>
                      {apprentice.complianceStatus === 'warning' && (
                        <div className="bg-white/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <p className="text-amber-200 text-sm">
                            Below minimum weekly hours. Ensure apprentice logs at least 30 hours per week.
                          </p>
                        </div>
                      )}
                      {apprentice.complianceStatus === 'non-compliant' && (
                        <div className="bg-white/10 border border-brand-red-500/30 rounded-lg p-3 flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-brand-red-400 flex-shrink-0 mt-0.5" />
                          <p className="text-white text-sm">
                            Significantly below minimum hours. Immediate attention required.
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {reportType === 'progress' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Progress</span>
                        <span className="text-white font-medium">
                          {apprentice.progress.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 bg-white rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white rounded-full"
                          style={{ width: `${Math.min(apprentice.progress, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Hours Remaining</span>
                        <span className="text-white font-medium">
                          {Math.max(0, apprentice.targetHours - apprentice.totalHours).toLocaleString()} hrs
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Start Date</span>
                        <span className="text-white font-medium">
                          {new Date(apprentice.startDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Est. Completion</span>
                        <span className="text-white font-medium">
                          {(() => {
                            const remaining = apprentice.targetHours - apprentice.totalHours;
                            if (remaining <= 0) return 'Complete';
                            if (apprentice.weeklyHours <= 0) return 'N/A';
                            const weeksRemaining = Math.ceil(remaining / apprentice.weeklyHours);
                            const completionDate = new Date();
                            completionDate.setDate(completionDate.getDate() + (weeksRemaining * 7));
                            return completionDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                          })()}
                        </span>
                      </div>
                    </>
                  )}

                  <Link 
                    href={`/pwa/shop-owner/apprentices/${apprentice.id}`}
                    className="flex items-center justify-center gap-2 w-full bg-slate-700 text-white py-2 rounded-lg mt-2"
                  >
                    View Full Profile
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          ))
        )}
      </main>

      <div className="px-4 py-6">
        <h3 className="text-slate-900 font-bold mb-3">Export Reports</h3>
        <div className="space-y-2">
          <button 
            onClick={() => handleExport('hours')}
            className="w-full flex items-center gap-4 bg-slate-800 rounded-xl p-4 active:bg-slate-700"
          >
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-brand-green-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-slate-900 font-medium">Monthly Hours Report</p>
              <p className="text-slate-500 text-sm">CSV format for USDOL submission</p>
            </div>
            <Download className="w-5 h-5 text-slate-500" />
          </button>
          
          <button 
            onClick={() => handleExport('compliance')}
            className="w-full flex items-center gap-4 bg-slate-800 rounded-xl p-4 active:bg-slate-700"
          >
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-brand-blue-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-slate-900 font-medium">Compliance Summary</p>
              <p className="text-slate-500 text-sm">PDF report with all apprentices</p>
            </div>
            <Download className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </div>

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
