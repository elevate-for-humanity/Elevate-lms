import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { BEAUTY_TRADES } from '@/lib/programs/beauty-trade-navigation';
import { getHostShopNetwork } from '@/lib/programs/host-shop-network';
import { matchesHostShopPresentationProgram } from '@/lib/programs/host-shop-programs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Indiana Barber, Salon, Esthetics & Nail Host Shops | Elevate for Humanity',
  description: 'Choose a licensed trade to browse approved apprenticeship host businesses in Indiana, or apply free to become a Host Shop.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/host-shops' },
  robots: { index: true, follow: true },
};

/**
 * One clear entry page; trade-specific directories own their portfolios.
 * Never flatten four occupations and hundreds of images into one scrolling page.
 */
export default async function HostShopsPage() {
  const shops = await getHostShopNetwork();
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-slate-200 bg-slate-950 px-4 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-red-300">Elevate for Humanity · Host Shop Network</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">Find the right training environment for your craft.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">Choose your trade below to see businesses approved for that occupation. Every shop has its own profile, photos and contact information. Placement availability is confirmed separately.</p>
          <div className="relative mt-8 aspect-[16/7] max-w-3xl overflow-hidden rounded-2xl border border-white/20 bg-slate-800">
            <Image src="/images/partners/kountry-kutz/interior-active-enhanced-2026.webp" alt="Professional barbers at an approved Elevate apprenticeship Host Shop" fill sizes="(min-width: 768px) 768px, 100vw" className="object-cover" priority />
          </div>
          <Link href="/apprenticeships/indiana" className="mt-6 block w-fit font-bold text-white underline">
            Search the Indiana map and directory
          </Link>
          <Link href="/partners/host-shop/apply" className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-white px-6 font-bold text-slate-950 hover:bg-slate-100">
            Own a shop? Apply to host apprentices — Free
          </Link>
        </div>
      </header>
      <section className="px-4 py-14 sm:py-16" aria-labelledby="choose-trade-heading">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-red-700">Four distinct pathways</p>
          <h2 id="choose-trade-heading" className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Choose your Host Shop category</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {BEAUTY_TRADES.map(trade => {
              const count = shops.filter(shop => matchesHostShopPresentationProgram(shop, trade.programSlug)).length;
              return (
                <article key={trade.key} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-red-700">{count} approved {count === 1 ? 'location' : 'locations'}</p>
                  <h3 className="mt-3 text-2xl font-black">{trade.label}</h3>
                  <p className="mt-3 flex-1 leading-7 text-slate-700">{trade.description}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href={trade.hostHref} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-800">View {trade.label} Host Shops →</Link>
                    <Link href={trade.programHref} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-900 hover:bg-slate-50">Explore training</Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section className="border-t border-slate-200 bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-black">For licensed businesses</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">Host Shop applications are free. Approved businesses provide a licensed supervisor, a safe training environment and supervised hands-on practice. Elevate coordinates the related instruction and required training records. Approval and placement are not automatic.</p>
          <Link href="/partners/host-shop/apply" className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-red-700 px-5 font-bold text-white hover:bg-red-800">Apply to become a Host Shop</Link>
        </div>
      </section>
    </main>
  );
}
