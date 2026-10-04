import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';

// Homepage editorial selection only. Other partners remain in the directory
// and retain their accounts, applications and apprenticeship records.
const FEATURED_SHOPS = [
  {
    name: 'Salon Saloon',
    program: 'Cosmetology apprenticeship',
    image: '/images/partners/salon-saloon/team-interior.webp',
    imageAlt: 'Salon Saloon team inside their South Bend salon',
    location: 'South Bend, Indiana',
    shopHref: '/host-shops/salon-saloon',
    programHref: '/programs/cosmetology-apprenticeship',
  },
  {
    name: 'Kountry Kutz Barbershop',
    program: 'Barber apprenticeship',
    image: '/images/partners/kountry-kutz/interior-active.webp',
    imageAlt: 'Barbers and customers inside Kountry Kutz Barbershop',
    location: 'New Palestine, Indiana',
    shopHref: '/host-shops/kountry-kutz-barbershop',
    programHref: '/programs/barber-apprenticeship',
  },
] as const;

export function HomeFeaturedHostShop() {
  return (
    <section data-home-featured-shops className="border-y border-slate-200 bg-slate-50 px-4 py-8 sm:py-12" aria-labelledby="featured-host-shop-heading">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-red-700">Featured Host Shops</p>
        <h2 id="featured-host-shop-heading" className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Earn while you learn.</h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700">Meet one salon and one barbershop where training connects with the workplace.</p>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {FEATURED_SHOPS.map((shop) => (
            <article key={shop.name} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <Link href={shop.shopHref} className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-red-700">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                  <Image src={shop.image} alt={shop.imageAlt} fill sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1200px) calc((100vw - 52px) / 2), 566px" className="object-cover object-center" loading="lazy" />
                </div>
                <div className="px-5 pt-5">
                  <h3 className="text-xl font-bold text-slate-950 sm:text-2xl">{shop.name}</h3>
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />{shop.location}</p>
                  <span className="mt-3 inline-flex min-h-11 items-center gap-2 font-bold text-brand-red-700">Explore the shop <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
                </div>
              </Link>
              <Link href={shop.programHref} className="mx-5 mb-4 inline-flex min-h-11 items-center text-sm font-semibold text-slate-700 hover:text-brand-red-700">{shop.program} details</Link>
            </article>
          ))}
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">Placement depends on approved supervision and current shop capacity. Wages and training costs are separate.</p>
      </div>
    </section>
  );
}
