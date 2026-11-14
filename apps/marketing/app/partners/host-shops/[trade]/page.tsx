import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import HostShopNetworkDirectory from '@/components/partners/HostShopNetworkDirectory';
import { BEAUTY_TRADES, getBeautyTrade } from '@/lib/programs/beauty-trade-navigation';
import { getHostShopNetwork } from '@/lib/programs/host-shop-network';
import { matchesHostShopPresentationProgram } from '@/lib/programs/host-shop-programs';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ trade: string }> };

export function generateStaticParams() {
  return BEAUTY_TRADES.map(({ key }) => ({ trade: key }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { trade: key } = await params;
  const trade = getBeautyTrade(key);
  if (!trade) return { title: 'Host Shop category unavailable', robots: { index: false } };
  return {
    title: `${trade.label} Host Shops | Elevate for Humanity`,
    description: `Explore approved Indiana ${trade.label.toLowerCase()} host businesses and their individual portfolios. Placement availability is confirmed by admissions.`,
    alternates: { canonical: `https://www.elevateforhumanity.org${trade.hostHref}` },
  };
}

export default async function HostShopsByTrade({ params }: Props) {
  const { trade: key } = await params;
  const trade = getBeautyTrade(key);
  if (!trade) notFound();

  // Canonical approved operational records determine both public visibility
  // and occupation eligibility. Never infer a shop's trade from its images/name.
  const shops = (await getHostShopNetwork()).filter(shop =>
    matchesHostShopPresentationProgram(shop, trade.programSlug),
  );

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-slate-200 bg-slate-50 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <Link href="/partners/host-shops" className="text-sm font-semibold text-blue-800 underline">
            ← All Host Shop categories
          </Link>
          <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.18em] text-red-700">Approved Host Shop directory</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{trade.label} Host Shops</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">{trade.description} View business profiles and portfolios relevant to this field only. Training placement and current capacity are confirmed separately.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={trade.programHref} className="inline-flex min-h-12 items-center rounded-xl bg-slate-950 px-5 font-bold text-white">View {trade.title}</Link>
            <Link href="/partners/host-shop/apply" className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 bg-white px-5 font-bold text-slate-950">Become a Host Shop — Free</Link>
          </div>
        </div>
      </header>
      <nav aria-label="Choose a Host Shop occupation" className="border-b border-slate-200 px-4 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-2">
          {BEAUTY_TRADES.map(item => (
            <Link key={item.key} href={item.hostHref}
              aria-current={item.key === trade.key ? 'page' : undefined}
              className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-bold ${item.key === trade.key ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-800 hover:border-slate-800'}`}>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      <section className="bg-slate-950 px-4 py-10 text-white" aria-label={`${trade.label} businesses`}>
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-black">Explore {trade.label.toLowerCase()} businesses</h2>
          <p className="mt-2 text-slate-300">Each listing has its own profile. Only businesses approved for this occupation appear here.</p>
          <HostShopNetworkDirectory shops={shops} programSlug={trade.programSlug} />
        </div>
      </section>
    </main>
  );
}
