import Image from 'next/image';
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Users, Calendar, Award, Clock, CheckCircle2, AlertTriangle,
  Download, Plus, GraduationCap, Briefcase, FileText, Shield,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cohort Tracker | Admin',
  description: 'Track cohort enrollment, credentials, attendance, and outcomes.',
  robots: { index: false, follow: false },
};

const COHORT_1 = {
  id: 'HVAC-2026-C1',
  name: 'HVAC Technician — Cohort 1 (La Plaza)',
  program: 'HVAC Technician Pathway',
  partner: 'La Plaza',
  startDate: '2026-02-24',
  endDate: '2026-07-10',
  weeks: 20,
  totalHours: 400,
  rtiHours: 240,
  ojtHours: 160,
  status: 'active',
  credentials: [
    { name: 'EPA 608 Universal', issuer: 'EPA-Approved Certifier', examWeek: 'Week 7–8', required: true },
    { name: 'OSHA 30 — Construction', issuer: 'OSHA / CareerSafe', examWeek: 'Week 3–4', required: true },
    { name: 'Residential HVAC Cert 1', issuer: 'Industry Certification Body', examWeek: 'Week 12', required: true },
    { name: 'Residential HVAC Cert 2 — Refrigeration', issuer: 'Industry Certification Body', examWeek: 'Week 14', required: true },
    { name: 'CPR / First Aid', issuer: 'AHA / Red Cross', examWeek: 'Week 2', required: true },
    { name: 'Rise Up — Retail Fundamentals', issuer: 'NRF', examWeek: 'Week 16', required: false },
  ],
  schedule: [
    { weeks: '1–2', title: 'HVAC Fundamentals + Safety Orientation', hours: 40 },
    { weeks: '3–4', title: 'Heating Systems + OSHA 30', hours: 40 },
    { weeks: '5–6', title: 'Cooling Systems + Refrigeration', hours: 40 },
    { weeks: '7–8', title: 'EPA 608 Prep + Certification Exam', hours: 40 },
    { weeks: '9–10', title: 'Installation Techniques', hours: 40 },
    { weeks: '11–12', title: 'Troubleshooting + Diagnostics', hours: 40 },
    { weeks: '13–16', title: 'Advanced Systems + Career Prep', hours: 80 },
    { weeks: '17–20', title: 'OJT Externship at Employer Sites', hours: 80 },
  ],
};

export default async function CohortTrackerPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  // Try to get enrolled HVAC students
  let students: any[] = [];
  if (supabase) {
    const { data } = await db
      .from('profiles')
      .select('id, full_name, email, phone, enrollment_status, created_at')
      .eq('role', 'student')
      .in('enrollment_status', ['active', 'enrolled'])
      .order('created_at', { ascending: false })
      .limit(10);
    students = data ?? [];
  }

  const c = COHORT_1;

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/about-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <Breadcrumbs items={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Cohorts' },
          ]} />
        </div>

        {/* Cohort Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-brand-blue-600 bg-brand-blue-50 px-2 py-0.5 rounded-full">{c.id}</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{c.name}</h1>
              <p className="text-sm text-gray-500 mt-1">Partner: {c.partner} | Program: {c.program}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { label: 'Start', value: new Date(c.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), icon: Calendar },
              { label: 'End', value: new Date(c.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), icon: Calendar },
              { label: 'Weeks', value: c.weeks, icon: Clock },
              { label: 'Total Hours', value: c.totalHours, icon: Clock },
              { label: 'RTI Hours', value: c.rtiHours, icon: FileText },
              { label: 'OJT Hours', value: c.ojtHours, icon: Briefcase },
              { label: 'Students', value: students.length || 2, icon: Users },
              { label: 'Credentials', value: c.credentials.filter(cr => cr.required).length, icon: Award },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
                <s.icon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-gray-900">{s.value}</div>
                <div className="text-[10px] text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Roster */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" /> Student Roster
                </h2>
                <Link href="/admin/students" className="text-xs text-brand-blue-600 font-medium">Manage Students</Link>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Student</th>
                    <th className="px-6 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Enrolled</th>
                    <th className="px-6 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Attendance</th>
                    <th className="px-6 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Credentials</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(students.length > 0 ? students.slice(0, 5) : [
                    { id: '1', full_name: 'Student 1 (pending enrollment)', email: '—', enrollment_status: 'enrolled', created_at: c.startDate },
                    { id: '2', full_name: 'Student 2 (pending enrollment)', email: '—', enrollment_status: 'enrolled', created_at: c.startDate },
                  ]).map((s: any) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <div className="text-sm font-medium text-gray-900">{s.full_name || 'Unknown'}</div>
                        <div className="text-[10px] text-gray-400">{s.email}</div>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          s.enrollment_status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          s.enrollment_status === 'enrolled' ? 'bg-brand-blue-100 text-brand-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>{s.enrollment_status || 'pending'}</span>
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-500">
                        {s.created_at ? new Date(s.created_at).toLocaleDateString('en-US') : '—'}
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-500">—</td>
                      <td className="px-6 py-3 text-xs text-gray-500">0 / {c.credentials.filter(cr => cr.required).length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Program Schedule */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" /> Program Schedule
                </h2>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Weeks</th>
                    <th className="px-6 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Module</th>
                    <th className="px-6 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Hours</th>
                    <th className="px-6 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {c.schedule.map((m, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-xs font-medium text-gray-900">{m.weeks}</td>
                      <td className="px-6 py-3 text-xs text-gray-700">{m.title}</td>
                      <td className="px-6 py-3 text-xs text-gray-500">{m.hours}h</td>
                      <td className="px-6 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          i === 0 ? 'bg-brand-blue-100 text-brand-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>{i === 0 ? 'Starting Monday' : 'Upcoming'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Credential Tracker + Reporting */}
          <div className="space-y-6">
            {/* Credential Tracker */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-gray-400" /> Credential Tracker
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {c.credentials.map((cr, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      cr.required ? 'bg-brand-blue-100' : 'bg-gray-200'
                    }`}>
                      <Award className={`w-3 h-3 ${cr.required ? 'text-brand-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-900">{cr.name}</div>
                      <div className="text-[10px] text-gray-500">{cr.issuer}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">Exam: {cr.examWeek}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium flex-shrink-0">
                      Scheduled
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reporting Status */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" /> Reporting
              </h2>
              <div className="space-y-2.5">
                {[
                  { label: 'Report Frequency', value: 'Bi-weekly during program' },
                  { label: 'Format', value: 'CSV + PDF (Salesforce-compatible)' },
                  { label: 'Post-Placement', value: '90-day and 180-day follow-up' },
                  { label: 'Escalation', value: 'Alert after 2 consecutive absences' },
                  { label: 'LOC Contact', value: 'Dulce Vega (La Plaza)' },
                ].map((r) => (
                  <div key={r.label} className="flex items-start justify-between">
                    <span className="text-xs text-gray-600">{r.label}</span>
                    <span className="text-xs text-gray-900 font-medium text-right max-w-[55%]">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Institutional Authority */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-400" /> Institutional Status
              </h2>
              <div className="space-y-2">
                {[
                  { label: 'DOL Registered Sponsor', ok: true },
                  { label: 'ETPL Approved', ok: true },
                  { label: 'Certiport Testing Center', ok: true },
                  { label: 'EPA 608 Exam Partner', ok: false, note: 'Pending — contact Mainstream/ESCO' },
                  { label: 'Employer Externship MOU', ok: false, note: 'Pending — secure by Week 10' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{s.label}</span>
                    {s.ok ? (
                      <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Confirmed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium" title={s.note}>
                        <AlertTriangle className="w-2.5 h-2.5" /> Pending
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
