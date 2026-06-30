import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Workforce Performance Metrics',
  description: 'Key performance outcomes for workforce board programs.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/workforce-board/reports/performance' },
};

export default async function WorkforceBoardPerformancePage() {
  const supabase = await createClient();

  const [{ count: totalParticipants }, { count: employed }, { count: supportServices }, { count: ieps }] =
    await Promise.all([
      supabase.from('wioa_participants').select('*', { head: true, count: 'exact' }),
      supabase.from('wioa_employment').select('*', { head: true, count: 'exact' }),
      supabase.from('wioa_support_services').select('*', { head: true, count: 'exact' }),
      supabase.from('wioa_iep').select('*', { head: true, count: 'exact' }),
    ]);

  const employmentRate = totalParticipants ? Math.round(((employed || 0) / totalParticipants) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-blue-600 mb-1">Workforce Board</p>
          <h1 className="text-3xl font-extrabold text-slate-900">Performance Metrics</h1>
          <p className="text-slate-600 mt-2">Outcome indicators used for board-level monitoring and reporting.</p>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card label="Participants" value={totalParticipants || 0} />
          <Card label="Employment Outcomes" value={employed || 0} />
          <Card label="Employment Rate" value={`${employmentRate}%`} />
          <Card label="Support Services" value={supportServices || 0} />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Program Notes</h2>
          <p className="text-slate-700 mb-4">
            Metrics are sourced from current WIOA participant, support-service, IEP, and employment records.
            Use these indicators to identify progress gaps and prioritize intervention.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/workforce-board/reports" className="px-5 py-2.5 rounded-lg bg-brand-blue-600 text-white hover:bg-brand-blue-700 font-semibold">
              Back to Reports
            </Link>
            <Link href="/workforce-board/participants" className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-800 hover:bg-white font-semibold">
              View Participants
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="text-2xl font-extrabold text-slate-900 mt-1">{value}</p>
    </div>
  );
}
