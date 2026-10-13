import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, Scissors } from 'lucide-react';

export function HomeNetworks() {
  return (
    <section className="bg-white px-4 py-8 sm:py-12" aria-labelledby="home-networks-heading">
      <div className="mx-auto max-w-6xl">
        <h2 id="home-networks-heading" className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Connect with the network</h2>
        <p className="mt-3 text-base leading-6 text-slate-700">Free profiles and connections. No Store purchase required.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Scissors className="h-6 w-6 shrink-0 text-brand-red-700" aria-hidden="true" />
              <h3 className="text-lg font-bold text-slate-950">Barber & Beauty</h3>
            </div>
            <p className="mt-3 text-base leading-6 text-slate-700">Showcase your work and connect with shops, beauty professionals and apprentices.</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
              <Link href="/partners/host-shops" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-brand-red-700">Explore network <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              <Link href="/host-shop/apply" className="inline-flex min-h-11 items-center text-sm font-bold text-slate-800">Join free</Link>
            </div>
          </article>
          <article className="rounded-2xl border border-slate-200 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <BriefcaseBusiness className="h-6 w-6 shrink-0 text-brand-red-700" aria-hidden="true" />
              <h3 className="text-lg font-bold text-slate-950">Business Owners</h3>
            </div>
            <p className="mt-3 text-base leading-6 text-slate-700">Connect your business with talent, workforce opportunities and resources.</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
              <Link href="/business-network" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-brand-red-700">Explore network <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              <Link href="/business-network#join" className="inline-flex min-h-11 items-center text-sm font-bold text-slate-800">Join free</Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
