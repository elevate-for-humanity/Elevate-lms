import { readHoursPages } from '@/lib/apprenticeship/admin-hours';
import { summarizeJriReport, type JriReportRow } from '@/lib/learner/jri-report-summary';
import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { FileText, Download, ArrowLeft, CheckCircle, Briefcase, Users } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Job Ready Indy Reports | Elevate For Humanity',
};

export default async function JRIReportsPage() {
  await requireRole(['admin']);
  const supabase = await createClient();



  const rows = await readHoursPages<JriReportRow>((from, to) => supabase.from('participant_report')
    .select('enrollment_id,participant_id,full_name,email,program_title,enrollment_status,enrolled_at,placement_status')
    .eq('funding_source', 'jri').order('enrollment_id').range(from, to));
  const { enrollments: participants, total, learners, active, completed, employed, placementRate, completionRate } = summarizeJriReport(rows);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Breadcrumbs items={[{ label: 'Admin', href: '/' }, { label: 'Job Ready Indy', href: '/jri' }, { label: 'Reports' }]} />
          <div className="flex justify-between items-center mt-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Job Ready Indy Reports</h1>
              <p className="text-slate-700 mt-1">Indiana DWD compliance reporting</p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-brand-blue-50 rounded-lg flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-brand-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{total || 0}</p>
            <p className="text-sm text-slate-700 mt-1">Total Enrolled</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{completionRate}%</p>
            <p className="text-sm text-slate-700 mt-1">Completion Rate</p>
            <p className="text-xs text-slate-700 mt-0.5">{completed || 0} completed</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-3">
              <Briefcase className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{placementRate}%</p>
            <p className="text-sm text-slate-700 mt-1">Verified Placement Rate</p>
            <p className="text-xs text-slate-700 mt-0.5">{employed} of {learners} learners</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-brand-orange-50 rounded-lg flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-brand-orange-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{active || 0}</p>
            <p className="text-sm text-slate-700 mt-1">Currently Active</p>
          </div>
        </div>

        {/* Report Types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { href: '/api/reports/participants/export?funding=jri', title: 'Enrollment Report', desc: 'All participants with enrollment dates and program assignments', period: 'Current period' },
            { href: '/api/reports/participants/export?funding=jri&status=completed', title: 'Completion Report', desc: 'Participants who completed training with credential outcomes', period: 'Current period' },
            { href: '/api/reports/participants/export?funding=jri', title: 'Employment Outcomes', desc: 'Post-program employment status and wage data', period: 'Current period' },
          ].map((r) => (
            <div key={r.title} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 bg-brand-blue-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-brand-blue-600" />
                </div>
                <Link href={r.href} className="flex items-center gap-1 text-xs text-brand-blue-600 hover:text-brand-blue-800 border border-brand-blue-200 px-2 py-1 rounded">
                  <Download className="w-3 h-3" /> Export CSV
                </Link>
              </div>
              <h3 className="font-semibold text-slate-900">{r.title}</h3>
              <p className="text-sm text-slate-700 mt-1">{r.desc}</p>
              <p className="text-xs text-slate-700 mt-2">{r.period}</p>
            </div>
          ))}
        </div>

        {/* Full Participant Table */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-5 border-b">
            <h2 className="text-base font-semibold text-slate-900">JRI Training Enrollments</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-700 uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-700 uppercase">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-700 uppercase">Program</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-700 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-700 uppercase">Employment</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-700 uppercase">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {participants && participants.length > 0 ? participants.map((p: any) => (
                  <tr key={p.enrollment_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{p.full_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{p.email || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{p.program_title || '—'}</td>
                    <td className="px-4 py-3 capitalize text-slate-700">{p.enrollment_status || '—'}</td>
                    <td className="px-4 py-3 capitalize text-slate-700">{p.placement_status || 'Not recorded'}</td>
                    <td className="px-4 py-3 text-slate-700 text-xs">{p.enrolled_at ? new Date(p.enrolled_at).toLocaleDateString() : '—'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-700">No participants yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
