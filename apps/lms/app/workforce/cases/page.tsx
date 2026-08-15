import Link from 'next/link';
import { AlertTriangle, Users } from 'lucide-react';

export default function WorkforceCasesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <AlertTriangle className="h-10 w-10 text-amber-600" />
        <h1 className="mt-4 text-3xl font-bold text-slate-950">Workforce Case Review</h1>
        <p className="mt-3 max-w-2xl text-slate-600">Case review stays anchored to canonical participant records so interventions, enrollment state and supporting information do not diverge across parallel case tables.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/workforce/participants" className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 font-semibold text-white"><Users className="h-4 w-4" /> Review participant cases</Link>
          <Link href="/workforce/dashboard" className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-800">Workforce dashboard</Link>
        </div>
      </div>
    </main>
  );
}
