import { hostShopBusinessKey } from '@/lib/partners/dedupe-host-shops.mjs';
import Link from 'next/link';
import { getHostShopNetwork } from '@/lib/programs/host-shop-network';
import onboarding from '@/lib/partners/host-shop-onboarding-profiles.json';

export default async function HostShopPageNavigation() {
  const shops = await getHostShopNetwork();
  const links = [...shops.map(shop => ({ slug: shop.slug, name: shop.name })), ...onboarding.filter(shop => !shops.some(active => hostShopBusinessKey(active.name) === hostShopBusinessKey(shop.name)))];
  return <nav aria-label="Host Shop pages" className="mx-auto max-w-7xl px-4 py-4">
    <Link href="/partners/host-shops#network-directory" className="font-bold text-blue-900 underline">All Host Shops</Link>
    <details className="mt-2 rounded-xl border border-slate-200 bg-white p-3 text-slate-950">
      <summary className="cursor-pointer font-bold">Choose a shop ({links.length})</summary>
      <ul className="mt-3 grid gap-x-5 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">{links.map(shop => <li key={shop.slug}><Link href={`/host-shops/${shop.slug}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-900 underline">{shop.name}</Link></li>)}</ul>
    </details>
  </nav>;
}
