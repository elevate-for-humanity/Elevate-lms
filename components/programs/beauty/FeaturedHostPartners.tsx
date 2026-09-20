import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, MapPin, Navigation, Phone } from 'lucide-react';
import HostShopShowcase from '@/components/programs/beauty/HostShopShowcase';
import {
  FEATURED_BEAUTY_HOST_PARTNERS,
  type FeaturedHostPartnerMedia,
} from '@/lib/apprenticeship-programs/host-partners';

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

export default function FeaturedHostPartners({
  programSlug,
  showDirectory = true,
}: {
  programSlug?: string;
  showDirectory?: boolean;
}) {
  // Program enrollment is the source of truth. Some verified partners operate
  // combined salon/barber businesses, so businessType must not hide a host that
  // is explicitly approved for this pathway.
  const matchingShops = programSlug
    ? FEATURED_BEAUTY_HOST_PARTNERS.filter((shop) => shop.programs.includes(programSlug))
    : FEATURED_BEAUTY_HOST_PARTNERS;
  const shops =
    programSlug === 'barber-apprenticeship'
      ? [...matchingShops].sort((left, right) => {
          if (left.slug === 'razors-image-barbershop') return -1;
          if (right.slug === 'razors-image-barbershop') return 1;
          return 0;
        })
      : matchingShops;

  // Show every verified barber host in one directory, including Kountry Kutz.
  // The prior exclusion made the featured shop disappear from the network list.
  const directoryShops = shops;

  if (!shops.length) {
    const pathway = programLabel(programSlug ?? 'beauty-apprenticeship');
    const image =
      programSlug === 'esthetician-apprenticeship'
        ? '/images/pexels/esthetician.webp'
        : '/images/pages/nail-tech-hero.webp';
    return (
      <section
        id="host-shops"
        className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="grid lg:grid-cols-2 lg:items-stretch">
          <div className="relative min-h-[280px] bg-slate-100 lg:min-h-[420px]">
            <Image
              src={image}
              alt={`${pathway} supervised workplace training`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div className="flex flex-col justify-center p-7 sm:p-10">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-red-700">
              {pathway} Host Shops
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Placement is matched and verified before training begins.
            </h2>
            <p className="mt-4 leading-7 text-slate-700">
              No public Host Shop is currently assigned to this pathway. Elevate confirms occupation
              approval, supervisor qualifications, location, and available placement before
              presenting a shop to an applicant.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/apply/student"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-red-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-brand-red-700"
              >
                Apply for this pathway
              </Link>
              <Link
                href="/partners/host-shops"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-brand-blue-700 px-5 py-2.5 text-sm font-extrabold text-brand-blue-900 hover:bg-sky-50"
              >
                Become a Host Shop
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      {programSlug !== 'barber-apprenticeship' ? (
        <HostShopShowcase
          shops={shops}
          enableNarration
          mediaOverrides={{
            'generations-hair-llc': {
              src: '/images/partners/generations-hair/highlighted-curls-home.webp',
              alt: 'Highlighted dimensional curls created by Generations Hair LLC in Martinsville, Indiana',
              kind: 'photo',
            },
          }}
        />
      ) : null}

      {showDirectory ? (
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
              links below to support the shops, explore services, or learn about future
              apprenticeship opportunities.
            </p>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {directoryShops.map((shop) => {
                const stillMedia = shop.media?.filter((media) => media.kind !== 'video') ?? [];
                const image =
                  shop.slug === 'razors-image-barbershop'
                    ? {
                        src: '/images/partners/razors-image-logo.jpg',
                        alt: "Razor's Image Barbershop official logo",
                        kind: 'photo' as const,
                      }
                    : shop.slug === 'generations-hair-llc'
                        ? {
                            src: '/images/partners/generations-hair/highlighted-curls-card.webp',
                            alt: 'Highlighted dimensional curls created by Generations Hair LLC',
                            kind: 'photo' as const,
                          }
                        : (stillMedia[1] ?? stillMedia[0]);
                const video: FeaturedHostPartnerMedia | undefined =
                  shop.slug === 'razors-image-barbershop'
                    ? {
                        src: '/videos/partners/razors-image-host-barbershop.mp4',
                        alt: "Razor's Image owner describing the barber apprenticeship opportunity",
                        kind: 'video' as const,
                        script:
                          "Welcome to Razor's Image Barbershop in Bloomington, Indiana, a participating Barber Apprenticeship Host Shop. In this video, the shop owner introduces the workplace and the opportunity for approved apprentices to develop barbering, sanitation, client service, grooming, and professional shop skills under qualified supervision. Placement, wages, supervision, enrollment, and licensing requirements are confirmed through Elevate before training begins.",
                      }
                    : shop.media?.find((media) => media.kind === 'video');
                const fullAddress = `${shop.address}, ${shop.city}, ${shop.state} ${shop.zip}`;
                return (
                  <article
                    key={shop.slug}
                    className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ${shop.slug === 'razors-image-barbershop' ? 'lg:col-span-2' : ''}`}
                  >
                    {video ? (
                      <div
                        className="bg-slate-950 px-4 py-5 sm:px-6"
                        data-scroll-narration
                        data-narration={video.script}
                        data-narration-rate="0.84"
                        data-narration-style="instructor"
                      >
                        <div>
                          <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl">
                            {image ? (
                              <Image
                                src={image.src}
                                alt=""
                                fill
                                sizes="(max-width: 640px) 100vw, 36vw"
                                className="object-cover opacity-90"
                                aria-hidden="true"
                              />
                            ) : null}
                            <video
                              controls
                              playsInline
                              preload="metadata"
                              poster={image?.src}
                              aria-label={video.alt}
                              className="relative z-10 mx-auto aspect-[9/16] max-h-[460px] w-full bg-transparent object-contain sm:max-h-[520px]"
                            >
                              <source src={video.src} type="video/mp4" />
                              Your browser does not support embedded video.
                            </video>
                          </div>
                          {stillMedia.length ? (
                            <div className="mx-auto mt-4 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3">
                              {stillMedia.map((media) => (
                                <div
                                  key={media.src}
                                  className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/15 bg-white"
                                >
                                  <Image
                                    src={media.src}
                                    alt={media.alt}
                                    fill
                                    unoptimized={media.src.startsWith('http')}
                                    sizes="(max-width: 640px) 50vw, 220px"
                                    className="object-contain"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <div className="mx-auto mt-4 max-w-xl text-center text-white">
                          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-red-300">
                            Participating host{' '}
                            {shop.businessType === 'BarberShop' ? 'barbershop' : 'salon'}
                          </p>
                          <p className="mt-2 text-sm font-semibold leading-6 text-slate-200">
                            {shop.name} provides a supervised workplace training environment for the{' '}
                            {programSlug ? programLabel(programSlug) : 'selected'} pathway.
                            Enrollment, placement, wages, and licensing remain subject to the
                            applicable program, employer, and state requirements.
                          </p>
                        </div>
                        {video.script ? (
                          <details className="mx-auto mt-4 max-w-xl rounded-xl border border-white/20 bg-slate-950/30 p-4 text-white">
                            <summary className="cursor-pointer text-sm font-black">
                              Read the {shop.dba ?? shop.name} video script
                            </summary>
                            <p className="mt-3 text-sm font-medium leading-6 text-slate-100">
                              {video.script}
                            </p>
                          </details>
                        ) : null}
                      </div>
                    ) : image ? (
                      <div className="bg-white">
                        <div className="relative aspect-[4/3] max-h-[440px] overflow-hidden bg-white sm:aspect-[16/10]">
                          <Image
                            src={image.src}
                            alt={image.alt}
                            fill
                            unoptimized={image.src.startsWith('http')}
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            className="object-contain bg-white"
                          />
                        </div>
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
      ) : null}
    </>
  );
}
