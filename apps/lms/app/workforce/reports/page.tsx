import Link from 'next/link';
import { BarChart3, Users } from 'lucide-react';

export default function WorkforceReportsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <BarChart3 className="h-10 w-10 text-violet-600" />
        <h1 className="mt-4 text-3xl font-bold text-slate-950">Workforce Reports</h1>
        <p className="mt-3 max-w-2xl text-slate-600">Reporting is generated from the canonical workforce and participant records. Use the dashboard for program-level reporting and participant records for case-level verification.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/workforce/dashboard" className="rounded-lg bg-slate-950 px-4 py-2 font-semibold text-white">Open reporting dashboard</Link>
          <Link href="/workforce/participants" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-800"><Users className="h-4 w-4" /> Participant records</Link>
        </div>
      </div>
    </main>
  );
}
