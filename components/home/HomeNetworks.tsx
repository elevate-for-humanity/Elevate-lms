import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, Scissors } from 'lucide-react';

export function HomeNetworks() {
  return (
    <section className="bg-white px-4 py-8 sm:py-12" aria-labelledby="home-networks-heading">
      <div className="mx-auto max-w-6xl">
        <h2 id="home-networks-heading" className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Connect with your community.</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
            <div className="flex items-center gap-3"><Scissors className="h-6 w-6 shrink-0 text-brand-blue-800" aria-hidden="true" /><h3 className="text-xl font-bold text-slate-950">Barber & Beauty Network</h3></div>
            <p className="mt-3 text-sm leading-6 text-slate-700">Show your work. Find shops, professionals and apprenticeship connections.</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
              <Link href="/partners/host-shops" className="inline-flex min-h-11 items-center gap-2 font-bold text-brand-red-700">Explore <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              <Link href="/host-shop/apply" className="inline-flex min-h-11 items-center font-semibold text-slate-700">Join free</Link>
            </div>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
            <div className="flex items-center gap-3"><BriefcaseBusiness className="h-6 w-6 shrink-0 text-brand-blue-800" aria-hidden="true" /><h3 className="text-xl font-bold text-slate-950">Business Owners Network</h3></div>
            <p className="mt-3 text-sm leading-6 text-slate-700">Connect with employers, entrepreneurs, talent and business resources.</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
              <Link href="/business-network" className="inline-flex min-h-11 items-center gap-2 font-bold text-brand-red-700">Explore <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              <Link href="/business-network#join" className="inline-flex min-h-11 items-center font-semibold text-slate-700">Join free</Link>
            </div>
          </article>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">Network participation is free. No Store purchase is required.</p>
      </div>
    </section>
  );
}
