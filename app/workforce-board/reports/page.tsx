import Image from 'next/image';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, Calendar, FileText, Download, Clock, AlertTriangle } from 'lucide-react';
import {

  getUpcomingDeadlines,
  calculateWIOAPerformance,
} from '@/lib/compliance/wioa-reporting';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Workforce Reports | Elevate For Humanity',
  description: 'WIOA performance reports, quarterly submissions, and workforce analytics.',
  robots: { index: false, follow: false },
};

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');


  // WIOA deadlines from lib
  const deadlines = getUpcomingDeadlines();

  // WIOA performance metrics
  let performance: any = null;
  try {
    performance = await calculateWIOAPerformance();
  } catch {
    // May fail if tables empty
  }

  // Enrollment counts
  const [totalEnrollments, activeEnrollments, completions] = await Promise.all([
    supabase.from('enrollments').select('id', { count: 'exact', head: true }),
    supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('partner_completions').select('id', { count: 'exact', head: true }),
  ]);

  const reports = [
    { name: 'Performance Report', description: 'WIOA performance metrics and outcomes', href: '/workforce-board/reports/performance', icon: BarChart3 },
    { name: 'Enrollment Report', description: 'Participant enrollment and demographics', href: '/admin/reports', icon: FileText },
    { name: 'Outcome Report', description: 'Employment and credential attainment', href: '/admin/reports/charts', icon: BarChart3 },
    { name: 'Financial Report', description: 'Funding utilization and cost per participant', href: '/admin/reports', icon: Download },
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/workforce-board-page-4.jpg" alt="Workforce board" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-gray-500">
              <li><Link href="/workforce-board" className="hover:text-primary">Workforce Board</Link></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Reports</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">Workforce Reports</h1>
          <p className="text-gray-600 mt-2">WIOA performance tracking, quarterly submissions, and compliance reporting</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-5">
            <p className="text-sm text-gray-600">Total Enrollments</p>
            <p className="text-3xl font-bold mt-1">{totalEnrollments.count ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <p className="text-sm text-gray-600">Active Participants</p>
            <p className="text-3xl font-bold mt-1">{activeEnrollments.count ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <p className="text-sm text-gray-600">Completions</p>
            <p className="text-3xl font-bold mt-1">{completions.count ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <p className="text-sm text-gray-600">Employment Rate</p>
            <p className="text-3xl font-bold mt-1">{performance?.employmentRate ? `${Math.round(performance.employmentRate)}%` : '—'}</p>
          </div>
        </div>

        {/* WIOA Performance */}
        {performance && (
          <div className="bg-white rounded-xl border p-6 mb-8">
            <h2 className="text-lg font-bold mb-4">WIOA Performance Indicators</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { label: 'Employment Q2', value: performance.employmentQ2, target: 70 },
                { label: 'Employment Q4', value: performance.employmentQ4, target: 65 },
                { label: 'Median Earnings Q2', value: performance.medianEarningsQ2, target: null, prefix: '$' },
                { label: 'Credential Rate', value: performance.credentialRate, target: 60 },
                { label: 'Measurable Skill Gains', value: performance.skillGains, target: 50 },
              ].map((m) => (
                <div key={m.label} className="p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">{m.label}</p>
                  <p className="text-2xl font-bold mt-1">
                    {m.prefix || ''}{m.value != null ? (typeof m.value === 'number' ? (m.prefix ? m.value.toLocaleString() : `${Math.round(m.value)}%`) : m.value) : '—'}
                  </p>
                  {m.target && m.value != null && (
                    <p className={`text-xs mt-1 ${m.value >= m.target ? 'text-brand-green-600' : 'text-brand-red-600'}`}>
                      Target: {m.target}% {m.value >= m.target ? '(Met)' : '(Below)'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Deadlines */}
        {deadlines.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
            <h2 className="font-bold text-amber-800 flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5" /> Upcoming Reporting Deadlines
            </h2>
            <div className="space-y-2">
              {deadlines.map((d, i) => {
                const daysLeft = Math.ceil((new Date(d.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-amber-200 last:border-0">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <div>
                        <p className="text-sm font-medium text-amber-900">{d.name}</p>
                        <p className="text-xs text-amber-700">{d.description}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${daysLeft <= 14 ? 'text-brand-red-600' : 'text-amber-700'}`}>
                      {daysLeft > 0 ? `${daysLeft} days` : 'Overdue'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Report Links */}
        <div className="grid md:grid-cols-2 gap-4">
          {reports.map((r) => (
            <Link key={r.name} href={r.href}
              className="bg-white rounded-xl border p-6 hover:shadow-md transition flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <r.icon className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{r.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{r.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
