import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { BarChart3, Users, Briefcase, ClipboardCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Workforce Board Reports',
  description: 'Performance and compliance reporting for workforce board oversight.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/workforce-board/reports' },
};

export default async function WorkforceBoardReportsPage() {
  const supabase = await createClient();

  const [{ count: participants }, { count: placements }, { count: applications }, { count: supportRequests }] =
    await Promise.all([
      supabase.from('wioa_participants').select('*', { head: true, count: 'exact' }),
      supabase.from('job_placements').select('*', { head: true, count: 'exact' }).eq('status', 'placed'),
      supabase.from('applications').select('*', { head: true, count: 'exact' }).in('status', ['submitted', 'in_review', 'approved']),
      supabase.from('wioa_support_services').select('*', { head: true, count: 'exact' }),
    ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-blue-600 mb-1">Workforce Board</p>
          <h1 className="text-3xl font-extrabold text-slate-900">Reports and Compliance</h1>
          <p className="text-slate-600 mt-2">Program metrics and reporting tools for operational oversight.</p>
        </header>

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Metric title="Participants" value={participants || 0} icon={<Users className="w-5 h-5 text-brand-blue-600" />} />
          <Metric title="Placements" value={placements || 0} icon={<Briefcase className="w-5 h-5 text-brand-green-600" />} />
          <Metric title="Active Applications" value={applications || 0} icon={<ClipboardCheck className="w-5 h-5 text-brand-orange-600" />} />
          <Metric title="Support Requests" value={supportRequests || 0} icon={<BarChart3 className="w-5 h-5 text-brand-blue-600" />} />
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Report Workbench</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/api/wioa/reporting" className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50">
              <h3 className="font-semibold text-slate-900">WIOA Reporting API</h3>
              <p className="text-sm text-slate-600 mt-1">Generate participant and outcome report payloads.</p>
            </Link>
            <Link href="/api/compliance/report" className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50">
              <h3 className="font-semibold text-slate-900">Compliance Summary API</h3>
              <p className="text-sm text-slate-600 mt-1">View current compliance summary and outstanding items.</p>
            </Link>
            <Link href="/workforce-board/reports/performance" className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50">
              <h3 className="font-semibold text-slate-900">Performance Dashboard</h3>
              <p className="text-sm text-slate-600 mt-1">Review completion, placement, and service delivery trends.</p>
            </Link>
            <Link href="/workforce-board/dashboard" className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50">
              <h3 className="font-semibold text-slate-900">Board Dashboard</h3>
              <p className="text-sm text-slate-600 mt-1">Return to workforce board operations overview.</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-600">{title}</span>
        {icon}
      </div>
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}
