'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users, GraduationCap, DollarSign, TrendingUp, ArrowRight,
  Clock, AlertTriangle, ChevronRight, Search,
  Bell, Eye, Mail, XCircle, BarChart3, Circle,
} from 'lucide-react';

const PERIODS = ['This Week', 'This Month', 'This Quarter', 'This Year'] as const;

const METRICS: Record<string, { enrolled: number; completed: number; placed: number; funding: string; compliance: number }> = {
  'This Week': { enrolled: 14, completed: 3, placed: 2, funding: '$12,400', compliance: 96 },
  'This Month': { enrolled: 47, completed: 18, placed: 11, funding: '$84,200', compliance: 94 },
  'This Quarter': { enrolled: 142, completed: 67, placed: 48, funding: '$312,800', compliance: 92 },
  'This Year': { enrolled: 487, completed: 234, placed: 189, funding: '$1.2M', compliance: 94 },
};

const TREND = [32, 45, 38, 52, 61, 47, 58, 72, 65, 81, 74, 89];
const TREND_LABELS = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];

const ACTIVITY = [
  { id: 1, type: 'enrollment', text: 'Tanya Washington applied for IT Support', time: '12 min ago', actionable: true },
  { id: 2, type: 'completion', text: 'Maria Gonzalez completed Phlebotomy certification', time: '1 hour ago', actionable: false },
  { id: 3, type: 'alert', text: 'Andre Mitchell attendance dropped below 75%', time: '2 hours ago', actionable: true },
  { id: 4, type: 'placement', text: 'Tyler Robinson hired by Swift Transport (CDL)', time: '3 hours ago', actionable: false },
  { id: 5, type: 'enrollment', text: 'Destiny Harris applied for CNA Training', time: '4 hours ago', actionable: true },
  { id: 6, type: 'compliance', text: 'Q4 PIRL report due in 3 days', time: '5 hours ago', actionable: true },
  { id: 7, type: 'funding', text: 'WIOA ITA approved for Robert Lee — $4,200', time: '6 hours ago', actionable: false },
  { id: 8, type: 'completion', text: 'Keisha Brown passed Medical Assistant midterm', time: 'Yesterday', actionable: false },
];

const AT_RISK = [
  { name: 'Andre Mitchell', program: 'Welding', issue: 'Attendance 72%', severity: 'high' },
  { name: 'DeShawn Williams', program: 'HVAC', issue: 'Missed 2 check-ins', severity: 'medium' },
];

export default function AdminDemoClient({ students, programs, metrics, recentActivity }: any) {
  const [period, setPeriod] = useState<string>('This Month');
  const [toast, setToast] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');

  const m = METRICS[period] || METRICS['This Month'];
  const maxTrend = Math.max(...TREND);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const dismiss = (id: number) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  const visibleActivity = ACTIVITY.filter(a => !dismissed.has(a.id));

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-brand-green-600 text-white px-4 py-3 rounded-lg shadow-xl text-sm font-medium animate-fade-in-up">
          {toast}
        </div>
      )}

      {/* Period selector + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:ring-2 focus:ring-brand-red-500 outline-none"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 animate-fade-in-up">
        {[
          { label: 'Enrolled', value: m.enrolled, icon: Users, color: 'text-brand-blue-600 bg-brand-blue-50', link: '/demo/admin/enrollments' },
          { label: 'Completed', value: m.completed, icon: GraduationCap, color: 'text-brand-green-600 bg-brand-green-50', link: '/demo/admin/outcomes' },
          { label: 'Placed', value: m.placed, icon: TrendingUp, color: 'text-purple-600 bg-purple-50', link: '/demo/admin/outcomes' },
          { label: 'Funding', value: m.funding, icon: DollarSign, color: 'text-amber-600 bg-amber-50', link: '/demo/admin/funding' },
          { label: 'Compliance', value: `${m.compliance}%`, icon: Circle, color: 'text-emerald-600 bg-emerald-50', link: '/demo/admin/compliance' },
        ].map(stat => (
          <Link key={stat.label} href={stat.link} className="bg-white rounded-xl border p-4 hover:shadow-md transition group">
            <div className={`p-2 rounded-lg ${stat.color} w-fit mb-2`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              {stat.label}
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
            </div>
          </Link>
        ))}
      </div>

      {/* Two-column: Trend chart + Activity feed */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Enrollment trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-400" /> Enrollment Trend
            </h3>
            <span className="text-xs text-brand-green-600 font-medium">+18% vs last quarter</span>
          </div>
          <div className="flex items-end gap-1.5 h-32">
            {TREND.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t transition-all hover:opacity-80 cursor-pointer ${
                    i === TREND.length - 1 ? 'bg-brand-red-500' : 'bg-brand-blue-200'
                  }`}
                  style={{ height: `${(val / maxTrend) * 100}%` }}
                  title={`${TREND_LABELS[i]}: ${val} enrollments`}
                  onClick={() => showToast(`${TREND_LABELS[i]}: ${val} new enrollments`)}
                />
                <span className="text-[10px] text-gray-400">{TREND_LABELS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className="lg:col-span-3 bg-white rounded-xl border">
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-400" /> Activity Feed
            </h3>
            <span className="text-xs text-gray-400">{visibleActivity.length} items</span>
          </div>
          <div className="divide-y max-h-[280px] overflow-y-auto">
            {visibleActivity.map(a => (
              <div key={a.id} className="px-5 py-3 flex items-start justify-between gap-3 hover:bg-gray-50">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`mt-0.5 p-1 rounded-full flex-shrink-0 ${
                    a.type === 'enrollment' ? 'bg-brand-blue-100' :
                    a.type === 'completion' ? 'bg-brand-green-100' :
                    a.type === 'alert' ? 'bg-brand-red-100' :
                    a.type === 'placement' ? 'bg-purple-100' :
                    a.type === 'compliance' ? 'bg-amber-100' :
                    'bg-gray-100'
                  }`}>
                    {a.type === 'enrollment' && <Users className="w-3 h-3 text-brand-blue-600" />}
                    {a.type === 'completion' && <GraduationCap className="w-3 h-3 text-brand-green-600" />}
                    {a.type === 'alert' && <AlertTriangle className="w-3 h-3 text-brand-red-600" />}
                    {a.type === 'placement' && <TrendingUp className="w-3 h-3 text-purple-600" />}
                    {a.type === 'compliance' && <Clock className="w-3 h-3 text-amber-600" />}
                    {a.type === 'funding' && <DollarSign className="w-3 h-3 text-brand-green-600" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 truncate">{a.text}</p>
                    <p className="text-xs text-gray-400">{a.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {a.actionable && a.type === 'enrollment' && (
                    <button onClick={() => { dismiss(a.id); showToast('Application opened for review'); }} className="text-xs text-brand-blue-600 hover:underline flex items-center gap-0.5">
                      <Eye className="w-3 h-3" /> Review
                    </button>
                  )}
                  {a.actionable && a.type === 'alert' && (
                    <button onClick={() => { dismiss(a.id); showToast('Intervention flagged — case manager notified'); }} className="text-xs text-brand-red-600 hover:underline flex items-center gap-0.5">
                      <Mail className="w-3 h-3" /> Intervene
                    </button>
                  )}
                  {a.actionable && a.type === 'compliance' && (
                    <button onClick={() => { dismiss(a.id); showToast('PIRL report generation started'); }} className="text-xs text-amber-600 hover:underline flex items-center gap-0.5">
                      <ArrowRight className="w-3 h-3" /> Generate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* At-risk students */}
      {AT_RISK.length > 0 && (
        <div className="bg-brand-red-50 border border-brand-red-200 rounded-xl p-5">
          <h3 className="font-semibold text-brand-red-900 text-sm mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Students Needing Attention
          </h3>
          <div className="space-y-2">
            {AT_RISK.map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-brand-red-100">
                <div>
                  <span className="font-medium text-gray-900 text-sm">{s.name}</span>
                  <span className="text-gray-500 text-xs ml-2">{s.program}</span>
                  <span className={`ml-2 text-xs font-medium ${s.severity === 'high' ? 'text-brand-red-600' : 'text-amber-600'}`}>{s.issue}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => showToast(`Outreach email sent to ${s.name}`)} className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                    Send Outreach
                  </button>
                  <button onClick={() => showToast(`Case opened for ${s.name}`)} className="text-xs bg-brand-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-red-700 transition">
                    Open Case
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Review Applications', count: 2, href: '/demo/admin/applications', color: 'text-brand-blue-600' },
          { label: 'Compliance Dashboard', count: 1, href: '/demo/admin/compliance', color: 'text-amber-600' },
          { label: 'Generate Reports', count: 0, href: '/demo/admin/reports', color: 'text-purple-600' },
          { label: 'Manage Partners', count: 0, href: '/demo/admin/partners', color: 'text-brand-green-600' },
        ].map(link => (
          <Link key={link.label} href={link.href} className="bg-white rounded-xl border p-4 hover:shadow-md transition group flex items-center justify-between">
            <div>
              <span className={`text-sm font-medium ${link.color}`}>{link.label}</span>
              {link.count > 0 && (
                <span className="ml-2 bg-brand-red-100 text-brand-red-700 text-xs font-bold px-1.5 py-0.5 rounded-full">{link.count}</span>
              )}
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition" />
          </Link>
        ))}
      </div>
    </div>
  );
}
