import Link from 'next/link';
import profiles from '@/lib/partners/host-shop-onboarding-profiles.json';
export type OnboardingShop = (typeof profiles)[number];
export default function HostShopOnboardingProfile({ shop }: { shop: OnboardingShop }) {
  return <main className="mx-auto max-w-5xl space-y-5 px-4 py-7 text-slate-950">
    <p className="text-sm font-bold text-amber-800">Host Shop onboarding in progress</p>
    <h1 className="text-3xl font-black">{shop.name}</h1>
    <p>This business is completing Elevate’s Host Shop onboarding. Apprentice placement and training-site approval are not yet confirmed.</p>
    <section className="rounded-xl border p-5">
      <h2 className="text-xl font-bold">Location and contact</h2>
      <p className="mt-2">{shop.address || `${shop.city}, Indiana — street address awaiting confirmation`}</p>
      <div className="mt-3 flex flex-wrap gap-3">
        {shop.phone && <a className="inline-flex min-h-11 items-center font-bold text-blue-900 underline" href={`tel:${shop.phone.replace(/\D/g, '')}`}>Call {shop.phone}</a>}
        {shop.website && <a className="inline-flex min-h-11 items-center font-bold text-blue-900 underline" href={shop.website} target="_blank" rel="noopener noreferrer">Visit business website</a>}
        {shop.address && <a className="inline-flex min-h-11 items-center font-bold text-blue-900 underline" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(shop.address)}`} target="_blank" rel="noopener noreferrer">Get directions</a>}
      </div>
    </section>
    <Link className="inline-flex min-h-11 items-center font-bold text-blue-900 underline" href="/partners/host-shops#network-directory">Explore all Host Shops</Link>
  </main>;
}
