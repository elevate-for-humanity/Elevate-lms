import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// Homepage curation only. Removing a feature must never remove a partner record.
const FEATURED_SHOPS = [
  {
    name: 'Cal’s Kutz Studio',
    program: 'Barber',
    image: '/images/partners/cals-kutz-enhanced-promotion-2026.webp',
    imageAlt: 'Cal Kutz Studio enhanced apprenticeship promotional collage',
    imagePosition: '50% 50%',
    location: 'Indianapolis, IN',
    description: 'Explore hands-on barbering and apprenticeship opportunities in a working studio.',
    shopHref: '/host-shops/cals-kutz-studio',
  },
  {
    name: 'Kountry Kutz Barbershop',
    program: 'Barber',
    image: '/images/partners/kountry-kutz/interior-active-enhanced-2026.webp',
    imageAlt: 'Barbers and customers inside Kountry Kutz Barbershop',
    imagePosition: '50% 50%',
    location: 'New Palestine, IN',
    description: 'Classic cuts and modern grooming in a working Main Street barbershop.',
    shopHref: '/host-shops/kountry-kutz-barbershop',
  },
  {
    name: 'Salon Saloon',
    program: 'Cosmetology',
    image: '/images/partners/salon-saloon/team-interior-enhanced-2026.webp',
    imageAlt: 'Salon Saloon team inside their South Bend salon',
    imagePosition: '50% 60%',
    location: 'South Bend, IN',
    description:
      'Professional hair services in a welcoming salon with an experienced styling team.',
    shopHref: '/host-shops/salon-saloon',
  },
  {
    name: 'Top Shelf Barber Lounge',
    program: 'Barber',
    image: '/images/partners/top-shelf-barber-lounge/top-shelf-precision-fade-enhanced-2026.webp',
    imageAlt: 'Precision fade created by Top Shelf Barber Lounge',
    imagePosition: '50% 40%',
    location: 'Elkhart, IN',
    description: 'Precision fades, beard grooming, and hands-on barbering in Elkhart.',
    shopHref: '/host-shops/top-shelf-barber-lounge',
  },
] as const;

export function HomeFeaturedHostShop() {
  const seen = new Set<string>();
  const seenImages = new Set<string>();
  const shops = FEATURED_SHOPS.filter((shop) => {
    if (seen.has(shop.shopHref) || seenImages.has(shop.image)) return false;
    seen.add(shop.shopHref);
    seenImages.add(shop.image);
    return true;
  });
  return (
    <section
      className="bg-white px-4 py-8 sm:py-12"
      id="barber-beauty-network"
      aria-labelledby="featured-host-shop-heading"
      data-scroll-narration
      data-narration="Host Shops are working barbershops and salons where apprentices build hands-on skills with licensed supervision. Elevate supports instruction and training records. Explore a shop or join the network. Placement and availability are confirmed during enrollment."
      data-narration-style="instructor"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-red-700">
          Earn while you learn
        </p>
        <h2
          id="featured-host-shop-heading"
          className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl"
        >
          Barber &amp; Beauty Apprenticeships
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-6 text-slate-700">
          Host Shops are working barbershops and salons where apprentices build hands-on skills with
          licensed supervision. Elevate supports instruction and training records. Explore a shop or
          join the network; placement and availability are confirmed during enrollment.
        </p>
        <div
          data-beauty-programs
          className="mt-6 grid grid-cols-1 auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {[
            {
              name: 'Barber Apprenticeship',
              label: 'Barber careers',
              image: '/images/partners/host-shop-mentoring-premium-2026.webp',
              alt: 'Illustrative barber instructor mentoring an apprentice',
              href: '/programs/barber-apprenticeship',
              text: 'Build barbering, sanitation and client care skills with supervised shop experience.',
              action: 'Explore barbering',
            },
            {
              name: 'Cosmetology Apprenticeship',
              label: 'Hair and beauty careers',
              image: '/images/programs/refresh-20261101/beauty.webp',
              alt: 'Illustrative cosmetology instructor guiding salon practice',
              href: '/programs/cosmetology-apprenticeship',
              text: 'Connect related instruction with supervised hair and beauty training in a host salon.',
              action: 'Explore cosmetology',
            },
            {
              name: 'Esthetics Apprenticeship',
              label: 'Skincare careers',
              image: '/images/programs/esthetician-host-recruitment-2026.webp',
              alt: 'Illustrative esthetics instructor mentoring adult apprentices',
              href: '/programs/esthetician-apprenticeship',
              text: 'Build skincare, sanitation and client care skills through supervised practice.',
              action: 'Explore esthetics',
            },
            {
              name: 'Nail Technician Apprenticeship',
              label: 'Nail careers',
              image: '/images/refresh-20261014/nail.webp',
              alt: 'Illustrative nail technician training',
              href: '/programs/nail-technician-apprenticeship',
              text: 'Explore nail services, manicuring, sanitation and professional client care.',
              action: 'Explore nail technology',
            },
          ].map((card) => (
            <article
              key={card.name}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-sky-50"
            >
              <Link
                href={card.href}
                className="group flex h-full flex-col focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-red-700"
              >
                <div
                  data-home-card-image
                  className="relative aspect-[16/10] shrink-0 overflow-hidden bg-white"
                >
                  <Image
                    src={card.image}
                    alt={card.alt}
                    fill
                    sizes="(min-width: 1024px) 368px, (min-width: 640px) 50vw, 100vw"
                    loading="lazy"
                    className="object-contain object-center"
                  />
                </div>
                <div className="flex flex-1 flex-col p-3 sm:p-4">
                  <p className="text-xs font-semibold text-brand-red-700">{card.label}</p>
                  <h3 className="mt-1 text-base font-bold leading-snug text-slate-950 sm:text-lg">
                    {card.name}
                  </h3>
                  <p className="mt-3 text-sm leading-5 text-slate-700">{card.text}</p>
                  <span className="mt-auto inline-flex min-h-11 items-center gap-2 pt-3 text-sm font-bold text-brand-red-700">
                    {card.action} <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-950">Own a barbershop or salon?</h3>
            <p className="mt-1 text-sm leading-6 text-slate-700">
              Mentor an apprentice and join our Barber &amp; Beauty Host Shop network.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              href="/partners/host-shops"
              className="inline-flex min-h-11 items-center rounded-xl bg-brand-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-brand-red-800"
            >
              Join as a Host Shop
            </Link>
            <Link
              href="/barber-and-beauty-apprenticeship"
              className="inline-flex min-h-11 items-center px-3 py-3 text-sm font-bold text-brand-red-700"
            >
              Explore Barber &amp; Beauty <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <h3 className="mt-8 text-xl font-bold text-slate-950">Meet our Host Shops</h3>
        <div
          data-featured-shops
          className="mt-6 grid grid-cols-1 auto-rows-fr items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6"
        >
          {shops.map((shop) => (
            <article
              key={shop.name}
              data-featured-shop={shop.name}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <Link
                href={shop.shopHref}
                className="group flex h-full flex-col focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-red-700"
              >
                <div
                  data-home-card-image
                  className="relative aspect-[16/10] shrink-0 overflow-hidden bg-white"
                >
                  <Image
                    src={shop.image}
                    alt={shop.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 368px, (min-width: 640px) 50vw, 100vw"
                    loading="lazy"
                    className="object-cover"
                    style={{ objectPosition: shop.imagePosition }}
                  />
                </div>
                <div className="flex flex-1 flex-col p-3 sm:p-4">
                  <p className="text-xs font-semibold text-brand-red-700">
                    {shop.program} Host Shop
                  </p>
                  <h3 className="mt-1 text-base font-bold leading-snug text-slate-950 sm:text-lg">
                    {shop.name}
                  </h3>
                  <p className="mt-2 text-sm leading-5 text-slate-600">{shop.location}</p>
                  <p className="mt-3 text-sm leading-5 text-slate-700">{shop.description}</p>
                  <span className="mt-auto inline-flex min-h-11 items-center gap-2 pt-3 text-sm font-bold text-brand-red-700">
                    View shop <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
