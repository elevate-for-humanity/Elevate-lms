import type { Metadata } from 'next';
import Link from 'next/link';
import HostShopNetworkDirectory from '@/components/partners/HostShopNetworkDirectory';
import { getHostShopNetwork } from '@/lib/programs/host-shop-network';
import { matchesHostShopProgram } from '@/lib/programs/host-shop-programs';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Barber Apprenticeship Host Shops | Elevate for Humanity',
  description: 'Explore participating barber apprenticeship locations, view shop portfolios, and contact a shop.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/barber-apprenticeship/host-shops' },
};

export default async function BarberHostShopsPage() {
  const shops = (await getHostShopNetwork()).filter((shop) => matchesHostShopProgram(shop, 'barber-apprenticeship'));
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-white sm:px-6 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <Link href="/programs/barber-apprenticeship" className="inline-flex min-h-12 items-center font-bold text-white underline">Back to Barber Apprenticeship</Link>
        <p className="mt-8 text-sm font-bold uppercase tracking-widest text-red-400">Barber apprenticeship locations</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Find your barber training community.</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">Explore participating barbershops, see their work, and contact each business. Admissions confirms supervision, program approval, and placement availability before training begins.</p>
        <HostShopNetworkDirectory shops={shops} programSlug="barber-apprenticeship" />
        <div className="mt-12 flex flex-wrap gap-4">
          <Link href="/partners/host-shop/apply" className="rounded-xl bg-red-700 px-6 py-4 font-bold text-white">Apply to become a Host Shop</Link>
          <Link href="/partners/host-shops" className="rounded-xl border border-white/40 px-6 py-4 font-bold text-white">Explore all barber &amp; beauty locations</Link>
        </div>
      </div>
    </main>
  );
}
