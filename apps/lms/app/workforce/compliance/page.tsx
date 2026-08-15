import Link from 'next/link';
import { ShieldCheck, Users } from 'lucide-react';

export default function WorkforceCompliancePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <ShieldCheck className="h-10 w-10 text-blue-600" />
        <h1 className="mt-4 text-3xl font-bold text-slate-950">Workforce Compliance</h1>
        <p className="mt-3 max-w-2xl text-slate-600">Review participant records and program operations used for workforce compliance. Compliance evidence remains attached to the canonical participant and program records rather than a separate duplicate data store.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/workforce/dashboard" className="rounded-lg bg-slate-950 px-4 py-2 font-semibold text-white">Open workforce dashboard</Link>
          <Link href="/workforce/participants" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-800"><Users className="h-4 w-4" /> Review participants</Link>
        </div>
      </div>
    </main>
  );
}
