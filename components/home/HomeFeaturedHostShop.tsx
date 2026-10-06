import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// Homepage curation only. Removing a feature must never remove a partner record.
const FEATURED_SHOPS = [
  {
    name: 'Salon Saloon',
    program: 'Cosmetology',
    image: '/images/partners/salon-saloon/team-interior.webp',
    imageAlt: 'Salon Saloon team inside their South Bend salon',
    imagePosition: '50% 60%',
    location: 'South Bend, IN',
    shopHref: '/host-shops/salon-saloon',
  },
  {
    name: 'Kountry Kutz Barbershop',
    program: 'Barber',
    image: '/images/partners/kountry-kutz/interior-active.webp',
    imageAlt: 'Barbers and customers inside Kountry Kutz Barbershop',
    imagePosition: '50% 50%',
    location: 'New Palestine, IN',
    shopHref: '/host-shops/kountry-kutz-barbershop',
  },
] as const;

export function HomeFeaturedHostShop() {
  return (
    <section className="bg-white px-4 py-8 sm:py-12" aria-labelledby="featured-host-shop-heading">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-red-700">Earn while you learn</p>
        <h2 id="featured-host-shop-heading" className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl">Real shops. Real experience.</h2>
        <p className="mt-3 max-w-2xl text-base leading-6 text-slate-700">Explore our featured apprenticeship host shops. Placement and availability are confirmed during enrollment.</p>
        <div data-mobile-grid="2" data-featured-shops className="mt-6 grid max-w-3xl grid-cols-2 items-stretch gap-3 sm:gap-5">
          {FEATURED_SHOPS.map((shop) => (
            <article key={shop.name} data-featured-shop={shop.name} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <Link href={shop.shopHref} className="group flex h-full flex-col focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-red-700">
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <Image src={shop.image} alt={shop.imageAlt} fill sizes="(min-width: 800px) 374px, (min-width: 640px) calc((100vw - 52px) / 2), calc((100vw - 44px) / 2)" loading="lazy" className="object-cover" style={{ objectPosition: shop.imagePosition }} />
                </div>
                <div className="flex flex-1 flex-col p-3 sm:p-4">
                  <p className="text-xs font-semibold text-brand-red-700">{shop.program}</p>
                  <h3 className="mt-1 text-base font-bold leading-snug text-slate-950 sm:text-lg">{shop.name}</h3>
                  <p className="mt-2 text-sm leading-5 text-slate-600">{shop.location}</p>
                  <span className="mt-auto inline-flex min-h-11 items-center gap-2 pt-3 text-sm font-bold text-brand-red-700">View shop <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></span>
                </div>
              </Link>
            </article>
          ))}
        </div>
        <Link href="/apprenticeships" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-brand-red-700">Explore apprenticeships <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
    </section>
  );
}
