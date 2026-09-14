import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';

const FEATURED_SHOPS = [
  {
    name: 'Salon Saloon',
    program: 'Cosmetology Apprenticeship',
    image: '/images/partners/salon-saloon/team-interior.webp',
    imageAlt: 'Salon Saloon team inside the South Bend cosmetology apprenticeship host salon',
    address: '1740 S Bend Ave, Suite A, South Bend, Indiana',
    shopHref: '/host-shops/salon-saloon',
    programHref: '/programs/cosmetology-apprenticeship',
  },
  {
    name: 'Kountry Kutz Barbershop',
    program: 'Barber Apprenticeship',
    image: '/images/partners/kountry-kutz/interior-active.webp',
    imageAlt: 'Barbers and customers inside Kountry Kutz apprenticeship host barbershop',
    address: '56 W Main St, Suite A, New Palestine, Indiana',
    shopHref: '/host-shops/kountry-kutz-barbershop',
    programHref: '/programs/barber-apprenticeship',
  },
] as const;

export function HomeFeaturedHostShop() {
  return (
    <section className="border-y border-slate-200 bg-slate-950 px-4 py-12 text-white" aria-labelledby="featured-host-shop-heading">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">Featured apprenticeship shops</p>
        <h2 id="featured-host-shop-heading" className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">See where cosmetology and barber apprentices train.</h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {FEATURED_SHOPS.map((shop) => (
            <article key={shop.name} className="overflow-hidden rounded-3xl border border-white/15 bg-slate-900">
              <div className="relative min-h-[280px] sm:min-h-[340px]">
                <Image src={shop.image} alt={shop.imageAlt} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 to-transparent p-6 pt-20">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-red-300">{shop.program}</p>
                  <h3 className="mt-2 text-2xl font-black">{shop.name}</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="flex items-start gap-2 text-sm font-bold text-slate-200"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{shop.address}</p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link href={shop.shopHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-5 py-3 font-black text-white hover:bg-brand-red-700">Tour the Shop <ArrowRight className="h-4 w-4" /></Link>
                  <Link href={shop.programHref} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white px-5 py-3 font-black text-white hover:bg-white hover:text-slate-950">View Program</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
