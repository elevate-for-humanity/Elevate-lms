import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, MapPin, Navigation, Phone } from 'lucide-react';
import HostShopShowcase from '@/components/programs/beauty/HostShopShowcase';
import { FEATURED_BEAUTY_HOST_PARTNERS } from '@/lib/apprenticeship-programs/host-partners';

function programLabel(program: string) {
  return program
    .replace(/-apprenticeship$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function directionsUrl(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^0-9+]/g, '')}`;
}

export default function FeaturedHostPartners({ programSlug }: { programSlug?: string }) {
  const requiredBusinessType =
    programSlug === 'barber-apprenticeship'
      ? 'BarberShop'
      : programSlug === 'cosmetology-apprenticeship'
        ? 'HairSalon'
        : undefined;
  const matchingShops = programSlug
    ? FEATURED_BEAUTY_HOST_PARTNERS.filter(
        (shop) =>
          shop.programs.includes(programSlug) &&
          (!requiredBusinessType || shop.businessType === requiredBusinessType),
      )
    : FEATURED_BEAUTY_HOST_PARTNERS;
  const shops =
    programSlug === 'barber-apprenticeship'
      ? [...matchingShops].sort((left, right) => {
          if (left.slug === 'razors-image-barbershop') return -1;
          if (right.slug === 'razors-image-barbershop') return 1;
          return 0;
        })
      : matchingShops;

  if (!shops.length) return null;

  return (
    <>
      {programSlug !== 'cosmetology-apprenticeship' ? (
        <HostShopShowcase
          shops={shops}
          mediaOverrides={{
            'generations-hair-llc': {
              src: '/images/partners/generations-hair/highlighted-curls-home.webp',
              alt: 'Highlighted dimensional curls created by Generations Hair LLC in Martinsville, Indiana',
              kind: 'photo',
            },
          }}
        />
      ) : null}

      <section
        className="border-y border-slate-200 bg-slate-50 px-4 py-14 sm:px-6 sm:py-16"
        id="host-shops"
      >
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-extrabold uppercase tracking-[0.16em] text-brand-red-700">
            Training network & local businesses
          </p>
          <h2 className="mt-2 text-center text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Visit, book, and train with our host-shop network
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-center text-base font-medium leading-7 text-slate-700">
            Each participating shop is a real local business. Use the contact, website, and map
            links below to support the shops, explore services, or learn about future apprenticeship
            opportunities.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {shops.map((shop) => {
              const stillMedia = shop.media?.filter((media) => media.kind !== 'video') ?? [];
              const image =
                shop.slug === 'razors-image-barbershop'
                  ? {
                      src: '/images/partners/razors-image-video-poster.webp',
                      alt: "Razor's Image host barbershop representative",
                      kind: 'photo' as const,
                    }
                  : shop.slug === 'generations-hair-llc'
                    ? {
                        src: '/images/partners/generations-hair/highlighted-curls-card.webp',
                        alt: 'Highlighted dimensional curls created by Generations Hair LLC',
                        kind: 'photo' as const,
                      }
                    : (stillMedia[1] ?? stillMedia[0]);
              const secondaryImage =
                shop.slug === 'razors-image-barbershop'
                  ? {
                      src: '/images/partners/razors-image-apprenticeship-flyer.webp',
                      alt: "Razor's Image Barber Apprenticeship Program artwork",
                    }
                  : undefined;
              const video =
                shop.slug === 'razors-image-barbershop'
                  ? {
                      src: '/videos/partners/razors-image-host-barbershop.mp4',
                      alt: "Razor's Image owner describing the barber apprenticeship opportunity",
                      kind: 'video' as const,
                    }
                  : shop.media?.find((media) => media.kind === 'video');
              const fullAddress = `${shop.address}, ${shop.city}, ${shop.state} ${shop.zip}`;
              return (
                <article
                  key={shop.slug}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  {video ? (
                    <div className="bg-slate-950 px-4 py-5 sm:px-6">
                      <div
                        className={
                          secondaryImage
                            ? 'grid items-stretch gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(150px,0.72fr)]'
                            : ''
                        }
                      >
                        <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl">
                          <video
                            controls
                            playsInline
                            preload="metadata"
                            poster={image?.src}
                            aria-label={video.alt}
                            className="aspect-[9/16] max-h-[680px] w-full bg-black object-contain"
                          >
                            <source src={video.src} type="video/mp4" />
                            Your browser does not support embedded video.
                          </video>
                        </div>
                        {secondaryImage ? (
                          <div className="grid gap-4">
                            {image ? (
                              <div className="relative min-h-52 overflow-hidden rounded-2xl border border-white/15 bg-white shadow-xl">
                                <Image
                                  src={image.src}
                                  alt={image.alt}
                                  fill
                                  sizes="(max-width: 640px) 100vw, 24vw"
                                  className="object-cover"
                                />
                              </div>
                            ) : null}
                            <div className="relative min-h-52 overflow-hidden rounded-2xl border border-white/15 bg-white shadow-xl">
                              <Image
                                src={secondaryImage.src}
                                alt={secondaryImage.alt}
                                fill
                                sizes="(max-width: 640px) 100vw, 24vw"
                                className="object-contain"
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div className="mx-auto mt-4 max-w-xl text-center text-white">
                        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-red-300">
                          Participating host barbershop
                        </p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-200">
                          Razor&apos;s Image provides an approved workplace training environment.
                          Elevate for Humanity administers the DOL-registered Barber Apprenticeship;
                          enrollment, eligibility, placement, wages, and licensing remain subject to
                          the applicable program and employer requirements.
                        </p>
                      </div>
                    </div>
                  ) : image ? (
                    <div className="relative aspect-[4/3] max-h-[440px] overflow-hidden bg-white sm:aspect-[16/10]">
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-contain bg-white"
                      />
                    </div>
                  ) : null}

                  <div className="p-6 sm:p-7">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-2xl font-black tracking-tight text-slate-950">
                          {shop.dba ?? shop.name}
                        </h3>
                        {shop.dba ? (
                          <p className="mt-1 text-sm font-semibold text-slate-600">
                            Legal name: {shop.name}
                          </p>
                        ) : null}
                      </div>
                      <span className="rounded-full bg-brand-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-brand-blue-800">
                        {shop.city}, {shop.state}
                      </span>
                    </div>

                    <p className="mt-4 text-sm font-medium leading-6 text-slate-700">
                      {shop.marketingBlurb ?? shop.note}
                    </p>

                    <div className="mt-5 space-y-3 border-y border-slate-100 py-5">
                      <p className="flex items-start gap-2 text-sm font-bold text-slate-800">
                        <MapPin
                          className="mt-0.5 h-4 w-4 shrink-0 text-brand-red-700"
                          aria-hidden="true"
                        />
                        <span>{fullAddress}</span>
                      </p>
                      {shop.phone ? (
                        <a
                          href={phoneHref(shop.phone)}
                          className="flex items-center gap-2 text-sm font-bold text-slate-800 hover:text-brand-red-700"
                        >
                          <Phone className="h-4 w-4 text-brand-red-700" aria-hidden="true" />
                          {shop.phone}
                        </a>
                      ) : (
                        <p className="text-sm font-semibold text-slate-600">
                          Direct public phone not yet verified — use the shop contact link below.
                        </p>
                      )}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {shop.programs.map((program) => (
                        <span
                          key={program}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700"
                        >
                          {programLabel(program)}
                        </span>
                      ))}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        href={`/host-shops/${shop.slug}`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-red-600 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-brand-red-700"
                      >
                        Shop profile
                      </Link>
                      <a
                        href={directionsUrl(fullAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-extrabold text-slate-900 transition hover:bg-slate-50"
                      >
                        <Navigation className="h-4 w-4" aria-hidden="true" /> Map & directions
                      </a>
                      {shop.websiteUrl ? (
                        <a
                          href={shop.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-extrabold text-slate-900 transition hover:bg-slate-50"
                        >
                          {shop.websiteLabel ?? 'Visit shop website'}{' '}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : null}
                      {shop.bookingUrl ? (
                        <a
                          href={shop.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-extrabold text-slate-900 transition hover:bg-slate-50"
                        >
                          Book services
                        </a>
                      ) : null}
                      {shop.socialUrl ? (
                        <a
                          href={shop.socialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-extrabold text-slate-900 transition hover:bg-slate-50"
                        >
                          {shop.socialLabel ?? 'Photos & social'}
                        </a>
                      ) : null}
                      {shop.onlineListingUrl ? (
                        <a
                          href={shop.onlineListingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-extrabold text-slate-900 transition hover:bg-slate-50"
                        >
                          {shop.onlineListingLabel ?? 'View shop listing'}
                        </a>
                      ) : null}
                      {shop.resourceUrl ? (
                        <a
                          href={shop.resourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-red-200 bg-brand-red-50 px-4 py-2 text-sm font-extrabold text-brand-red-800 transition hover:bg-brand-red-100"
                        >
                          {shop.resourceLabel ?? 'View shop document'}
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
