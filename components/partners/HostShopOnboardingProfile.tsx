import Link from 'next/link';
import profiles from '@/lib/partners/host-shop-onboarding-profiles.json';
export type OnboardingShop = (typeof profiles)[number];

export default function HostShopOnboardingProfile({ shop }: { shop: OnboardingShop }) {
  const isDbo = shop.slug === 'dbo-hair-studios';
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 px-5 py-16 text-white sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-rose-200">
            {isDbo ? 'New partner spotlight · Indianapolis' : 'Elevate for Humanity · Host Shop network'}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">{shop.name}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
            {isDbo
              ? 'Meet DBO Hair Studios, an Indianapolis beauty business joining the Elevate for Humanity Host Shop community. Explore the salon and connect directly with its team.'
              : 'Discover a local beauty or barbering business participating in the Elevate Host Shop onboarding process.'}
          </p>
          <p className="mt-6 inline-flex rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold">
            Host Shop onboarding in progress · Apprentice placement not yet confirmed
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {shop.website && <a className="inline-flex min-h-12 items-center rounded-xl bg-white px-5 py-3 font-bold text-slate-950 hover:bg-rose-100" href={shop.website} target="_blank" rel="noopener noreferrer">Explore the salon ↗</a>}
            {shop.address && <a className="inline-flex min-h-12 items-center rounded-xl border border-white/60 px-5 py-3 font-bold text-white hover:bg-white/10" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(shop.address)}`} target="_blank" rel="noopener noreferrer">Get directions ↗</a>}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-12 lg:grid-cols-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm lg:col-span-3">
          <h2 className="text-2xl font-black">About {shop.name}</h2>
          <p className="mt-4 leading-8 text-slate-700">
            {isDbo
              ? 'Evelyn’s Beauty Salon, doing business as DBO Hair Studios, is located on West Washington Street in Indianapolis. As a prospective workplace training partner, the salon is working with Elevate to support supervised, practical beauty-industry learning. The shop’s services, portfolio and appointment details are available through its official website.'
              : 'This shop is completing its Elevate Host Shop onboarding. Its business details and training-site eligibility are reviewed separately from public business promotion.'}
          </p>
          {isDbo && <p className="mt-4 text-sm leading-6 text-slate-600">Official salon photos and social portfolio will appear here once the selected assets and permissions have been verified. No substitute or stock portfolio is shown.</p>}
        </div>
        <aside className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm lg:col-span-2">
          <h2 className="text-xl font-black">Visit the shop</h2>
          <address className="mt-4 not-italic leading-7 text-slate-700">{shop.address || `${shop.city}, Indiana`}</address>
          <div className="mt-5 flex flex-col gap-3">
            {shop.phone && <a className="font-bold text-blue-900 underline" href={`tel:${shop.phone.replace(/\D/g, '')}`}>Call {shop.phone}</a>}
            {shop.website && <a className="font-bold text-blue-900 underline" href={shop.website} target="_blank" rel="noopener noreferrer">Official business website ↗</a>}
          </div>
        </aside>
      </section>
      <div className="mx-auto max-w-6xl px-5 pb-14">
        <Link className="inline-flex min-h-11 items-center font-bold text-blue-900 underline" href="/partners/host-shops#network-directory">Explore all Host Shops</Link>
      </div>
    </main>
  );
}
