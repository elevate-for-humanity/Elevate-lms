import Link from 'next/link';
import Image from 'next/image';
import HostShopMediaCarousel from '@/components/partners/HostShopMediaCarousel';
import profiles from '@/lib/partners/host-shop-onboarding-profiles.json';
export type OnboardingShop = (typeof profiles)[number];

export default function HostShopOnboardingProfile({ shop }: { shop: OnboardingShop }) {
  const isDbo = shop.slug === 'dbo-hair-studios';
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 px-5 py-16 text-white sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-rose-200">
            {isDbo ? 'Indianapolis · Cosmetology' : 'Elevate for Humanity · Host Shop network'}
          </p>
          {shop.logo && <Image src={shop.logo} alt={shop.name} width={112} height={112} className="mt-4 h-24 w-24 object-contain" />}
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">{shop.name}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
            {shop.businessDescription || (isDbo
              ? 'Home of the Dominican blowout on West Washington Street. Meet Evelyn Estevez and her team of stylists.'
              : 'Discover a local beauty or barbering business participating in the Elevate Host Shop onboarding process.')}
          </p>
          <p className="mt-6 inline-flex rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold">
            {shop.businessDescription ? 'Apprentice availability unconfirmed' : 'Host Shop onboarding in progress · Apprentice placement not yet confirmed'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {shop.website && <a className="inline-flex min-h-12 items-center rounded-xl bg-white px-5 py-3 font-bold text-slate-950 hover:bg-rose-100" href={shop.website} target="_blank" rel="noopener noreferrer">Explore the salon ↗</a>}
            {shop.address && <a className="inline-flex min-h-12 items-center rounded-xl border border-white/60 px-5 py-3 font-bold text-white hover:bg-white/10" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(shop.address)}`} target="_blank" rel="noopener noreferrer">Get directions ↗</a>}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-12 lg:grid-cols-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm lg:col-span-3">
          {shop.portfolio ? (
            <figure>
              <div className="relative aspect-[475/295] overflow-hidden rounded-xl">
                {/* Show the interior panel of the archived 800 × 600 portfolio. */}
                <Image src={shop.portfolio} width={800} height={600} alt={`Barber chairs and workstations inside ${shop.name}`} className="absolute bottom-0 right-0 h-auto w-[168.42%] max-w-none" />
              </div>
              <figcaption className="mt-3 text-sm text-slate-600">
                Shop interior from the published portfolio. <a href={shop.source} className="font-semibold underline" target="_blank" rel="noopener noreferrer">View the shop’s photo listing</a>
              </figcaption>
            </figure>
          ) : <>
          <h2 className="text-2xl font-black">About {shop.name}</h2>
          <p className="mt-4 leading-8 text-slate-700">
            {isDbo
              ? 'Founded in Indianapolis in 2001, Evelyn’s Beauty Salon now operates as DBO Hair Studios. Evelyn has owned the salon since 2012. Her team offers Dominican blowouts, cuts, color and styling for a range of hair textures.'
              : shop.businessDescription || 'This shop is completing its Elevate Host Shop onboarding. Its business details and training-site eligibility are reviewed separately from public business promotion.'}
          </p>
          {shop.gallery && (
            <section className="mt-6" aria-label={`${shop.name} photo gallery`}>
              <HostShopMediaCarousel shopName={shop.name} items={shop.gallery} spacious />
            </section>
          )}
          </>}
        </div>
        <aside className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm lg:col-span-2">
          <h2 className="text-xl font-black">Visit the shop</h2>
          <address className="mt-4 not-italic leading-7 text-slate-700">{shop.address || `${shop.city}, Indiana`}</address>
          <div className="mt-5 flex flex-col gap-3">
            {shop.booking && <a className="font-bold text-blue-900 underline" href={shop.booking} target="_blank" rel="noopener noreferrer">Book an appointment ↗</a>}
            {shop.phone && <a className="font-bold text-blue-900 underline" href={`tel:${shop.phone.replace(/\D/g, '')}`}>Call {shop.phone}</a>}
            {shop.website && <a className="font-bold text-blue-900 underline" href={shop.website} target="_blank" rel="noopener noreferrer">Official business website ↗</a>}
            {shop.instagram && <a className="font-bold text-blue-900 underline" href={shop.instagram} target="_blank" rel="noopener noreferrer">Instagram ↗</a>}
          </div>
        </aside>
      </section>
      <div className="mx-auto max-w-6xl px-5 pb-14">
        <Link className="inline-flex min-h-11 items-center font-bold text-blue-900 underline" href="/partners/host-shops#network-directory">Explore all Host Shops</Link>
      </div>
    </main>
  );
}
