import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// Homepage curation only. Removing a feature must never remove a partner record.
const FEATURED_SHOPS = [
  {
    name: 'Kountry Kutz Barbershop',
    program: 'Barber',
    image: '/images/partners/kountry-kutz/interior-active-enhanced-2026.webp',
    imageAlt: 'Barbers and customers inside Kountry Kutz Barbershop',
    imagePosition: '50% 50%',
    location: 'New Palestine, IN',
    shopHref: '/host-shops/kountry-kutz-barbershop',
  },
  {
    name: "Razor’s Image Barbershop",
    program: 'Barber',
    image: '/images/partners/razors-image-video-poster.webp',
    imageAlt: 'Aaron Brown of Razor’s Image Barbershop introducing his host shop',
    imagePosition: '50% 38%',
    location: 'Bloomington, IN',
    shopHref: '/host-shops/razors-image-barbershop-deedb623',
  },
  {
    name: 'Salon Saloon',
    program: 'Cosmetology',
    image: '/images/partners/salon-saloon/team-interior-enhanced-2026.webp',
    imageAlt: 'Salon Saloon team inside their South Bend salon',
    imagePosition: '50% 60%',
    location: 'South Bend, IN',
    shopHref: '/host-shops/salon-saloon',
  },
] as const;

export function HomeFeaturedHostShop() {
  return (
    <section className="bg-white px-4 py-8 sm:py-12" aria-labelledby="featured-host-shop-heading">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-red-700">Earn while you learn</p>
        <h2 id="featured-host-shop-heading" className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl">Real shops. Real experience.</h2>
        <p className="mt-3 max-w-2xl text-base leading-6 text-slate-700">Explore our featured apprenticeship host shops. Placement and availability are confirmed during enrollment.</p>
        <article className="mt-6 grid overflow-hidden rounded-2xl bg-slate-950 text-white sm:grid-cols-2">
          <div className="relative aspect-[1145/1374] bg-black"><Image src="/images/partners/cals-kutz-enhanced-promotion-2026.webp" alt="Cal Kutz Studio enhanced apprenticeship promotional collage" fill sizes="(min-width: 640px) 50vw, 100vw" className="object-contain" /></div>
          <div className="flex flex-col justify-center p-6 sm:p-8"><p className="text-sm font-bold uppercase tracking-widest text-amber-300">Featured barber partner</p><h3 className="mt-3 text-3xl font-black">Cal’s Kutz Studio</h3><p className="mt-4 text-base leading-7 text-slate-200">Turn your interest in barbering into your next step. Explore the shop’s work, meet the training environment, and ask about apprenticeship enrollment and available payment plans.</p><Link href="/host-shops/cals-kutz-studio" className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-amber-300 px-5 py-3 font-bold text-slate-950">Explore Cal’s Kutz Studio</Link><Link href="/programs/barber-apprenticeship" className="mt-3 inline-flex min-h-12 items-center justify-center rounded-xl border border-white/40 px-5 py-3 font-bold">Start your barber journey</Link></div>
        </article>
        <div data-mobile-grid="2" data-featured-shops className="mt-6 grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 sm:gap-5">
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
        <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-slate-950 p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div><h3 className="text-xl font-bold">Your shop. Their next career.</h3><p className="mt-2 max-w-xl text-sm leading-6 text-slate-200">Join the host-shop network, showcase your work, and apply to supervise apprentices.</p></div>
          <Link href="/partners/host-shop/apply" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-6 py-3 font-bold text-white hover:bg-brand-red-700">Become a Host Shop <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <Link href="/programs/esthetician-apprenticeship" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg"><Image src="/images/pexels/esthetician.webp" alt="Esthetics training and skincare practice" fill sizes="192px" loading="lazy" className="object-cover" /></div>
            <div><h3 className="font-bold text-slate-950">Esthetics Apprenticeship</h3><p className="mt-1 text-sm text-slate-700">Skincare, sanitation, client care and supervised practice.</p><span className="text-sm font-bold text-brand-red-700">Explore program →</span></div>
          </Link>
          <Link href="/programs/nail-technician-apprenticeship" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg"><Image src="/images/pexels/nail-tech.webp" alt="Nail technician training and supervised salon practice" fill sizes="192px" loading="lazy" className="object-cover" /></div>
            <div><h3 className="font-bold text-slate-950">Nail Technician Apprenticeship</h3><p className="mt-1 text-sm text-slate-700">Manicuring, nail services, sanitation and client care.</p><span className="text-sm font-bold text-brand-red-700">Explore program →</span></div>
          </Link>
        </div>
        <Link href="/partners/host-shops" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-brand-red-700">Find or become a Host Shop <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        <div />
        <Link href="/apprenticeships" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-brand-red-700">Explore apprenticeships <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
    </section>
  );
}
