import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, Scissors, Store } from 'lucide-react';

export function HomeNetworks() {
  return (
    <section className="border-y border-slate-200 bg-white px-4 py-16" aria-labelledby="home-networks-heading">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-red-700">More than training</p>
        <h2 id="home-networks-heading" className="mt-3 max-w-4xl text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">Join a network. Showcase what you do. Grow from there.</h2>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">Elevate connects training with real businesses and professional communities. Network participation and directory listings are free; optional business products and subscriptions live in the Elevate Store.</p>
        <div className="mt-9 grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl bg-slate-950 p-7 text-white shadow-xl sm:p-9">
            <Scissors className="h-9 w-9 text-red-300" aria-hidden="true" />
            <h3 className="mt-5 text-3xl font-black">Barber & Beauty Network</h3>
            <p className="mt-4 leading-7 text-slate-300">For barbers, cosmetologists, nail professionals, estheticians, salons, spas and apprentices. Create a free business profile, share your work, connect with the industry and tell visitors when you are accepting clients or apprentices.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/partners/host-shops" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-red-600 px-5 py-3 font-black text-white hover:bg-brand-red-700">Explore the Network <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/host-shop/apply" className="inline-flex min-h-12 items-center rounded-xl border border-white px-5 py-3 font-black text-white hover:bg-white hover:text-slate-950">Join Free</Link>
            </div>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-slate-50 p-7 shadow-sm sm:p-9">
            <BriefcaseBusiness className="h-9 w-9 text-brand-blue-700" aria-hidden="true" />
            <h3 className="mt-5 text-3xl font-black text-slate-950">Business Owners Network</h3>
            <p className="mt-4 leading-7 text-slate-700">A separate network for employers, entrepreneurs and small businesses to connect with workforce opportunities, talent, apprenticeship pathways and business resources without mixing the experience into the beauty community.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/employers" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-blue-700 px-5 py-3 font-black text-white hover:bg-brand-blue-800">Business & Employer Resources <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/store#marketplace" className="inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-5 py-3 font-black text-slate-950 hover:border-brand-blue-700"><Store className="h-4 w-4" /> Explore Store</Link>
            </div>
          </article>
        </div>
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold leading-6 text-amber-950">Joining a network does not require a Store purchase. The Store is there for members who later want tools such as the AI Website Builder, online business products or other subscriptions.</div>
      </div>
    </section>
  );
}
