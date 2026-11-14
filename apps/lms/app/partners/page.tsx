import Link from 'next/link';
import { Building2, Globe, Handshake } from 'lucide-react';

export default function PartnersPortal() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex items-center gap-3">
            <Handshake className="h-9 w-9 text-amber-700" />
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-amber-700">Partner access</p>
              <h1 className="mt-1 text-4xl font-black text-slate-950">Choose the canonical partner workspace</h1>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">
            Host Shops and workforce partners use separate role-owned workspaces. Legacy partner dashboard pages are no longer used.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-2">
        <Link href="/host-shop/dashboard" className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:border-amber-300 hover:shadow-md">
          <Building2 className="h-9 w-9 text-amber-700" />
          <h2 className="mt-4 text-2xl font-black text-slate-950">Host Shop Portal</h2>
          <p className="mt-2 text-slate-600">Manage approved Host Shop apprentices, OJL records, documents, attendance, and registered apprenticeship requirements.</p>
        </Link>
        <Link href="/workforce" className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:border-violet-300 hover:shadow-md">
          <Globe className="h-9 w-9 text-violet-700" />
          <h2 className="mt-4 text-2xl font-black text-slate-950">Workforce Portal</h2>
          <p className="mt-2 text-slate-600">Manage workforce participants, enrollments, placements, eligibility, follow-ups, supportive services, and reporting.</p>
        </Link>
      </section>
    </main>
  );
}
