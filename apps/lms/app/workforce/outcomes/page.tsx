import Link from 'next/link';
import { TrendingUp, Users } from 'lucide-react';

export default function WorkforceOutcomesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <TrendingUp className="h-10 w-10 text-emerald-600" />
        <h1 className="mt-4 text-3xl font-bold text-slate-950">Workforce Outcomes</h1>
        <p className="mt-3 max-w-2xl text-slate-600">Use the canonical workforce dashboard and participant records to review completion, credential, placement and other outcome information. This surface does not create a second outcome dataset.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/workforce/dashboard" className="rounded-lg bg-slate-950 px-4 py-2 font-semibold text-white">View outcome dashboard</Link>
          <Link href="/workforce/participants" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-800"><Users className="h-4 w-4" /> Review participants</Link>
        </div>
      </div>
    </main>
  );
}
