import Image from 'next/image';
import HostShopMediaCarousel from '@/components/partners/HostShopMediaCarousel';
import { matchesHostShopProgram } from '@/lib/programs/host-shop-programs';
import { getProgramHeroImage, getProgramImageAlt } from '@/lib/images/programImages';
import { getHostShopNetwork } from '@/lib/programs/host-shop-network';
import type { FeaturedHostPartner } from '@/lib/apprenticeship-programs/host-partners';
import Link from 'next/link';
import { ExternalLink, MapPin, Navigation, Phone } from 'lucide-react';
import HostShopShowcase from '@/components/programs/beauty/HostShopShowcase';

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

export default async function FeaturedHostPartners({
  programSlug,
  showDirectory = true,
}: {
  programSlug?: string;
  showDirectory?: boolean;
}) {
  // Every public pathway uses the same live directory and exact occupation filter.
  const network = await getHostShopNetwork();
  const shops: FeaturedHostPartner[] = network
    .filter((shop) => !programSlug || matchesHostShopProgram(shop, programSlug))
    .map((shop) => ({
      slug: shop.slug,
      name: shop.name,
      city: shop.city,
      state: shop.state,
      zip: '',
      address: shop.address,
      programs: programSlug ? [programSlug] : shop.programs,
      phone: shop.phone,
      marketingBlurb: shop.description,
      websiteUrl: shop.website,
      bookingUrl: shop.booking,
      socialUrl: shop.social,
      media: (programSlug === 'nail-technician-apprenticeship'
        ? [...(shop.gallery ?? [])].sort(
            (a, b) => Number(/nail/i.test(b.url)) - Number(/nail/i.test(a.url)),
          )
        : (shop.gallery ?? [])
      ).map((item) => ({
        src: item.url,
        alt: item.alt || `${shop.name} portfolio`,
        kind: 'photo' as const,
      })),
    }));

  // Show every verified barber host in one directory, including Kountry Kutz.
  // The prior exclusion made the featured shop disappear from the network list.
  const directoryShops = shops;

  if (!shops.length) {
    const pathway = programLabel(programSlug ?? 'beauty-apprenticeship');
    const image = getProgramHeroImage(programSlug ?? 'cosmetology-apprenticeship');
    return (
      <section
        id="host-shops"
        className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="grid lg:grid-cols-2 lg:items-stretch">
          <div className="relative aspect-[4/3] bg-slate-100 lg:self-center">
            <Image
              src={image}
              alt={getProgramImageAlt(programSlug ?? 'cosmetology-apprenticeship')}
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
              We're looking for new Host Shops.
            </h2>
            <p className="mt-4 leading-7 text-slate-700">
              Licensed {pathway.toLowerCase()} businesses: help the next generation build real
              skills. Apply free to become a Host Shop and showcase your business in the Elevate
              network. Apprentice placement and supervision are confirmed before training begins.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/apply/student"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-red-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-brand-red-700"
              >
                Apply for this pathway
              </Link>
              <Link
                href="/host-shop/apply"
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

            <div
              data-mobile-grid="2"
              className="mt-6 grid grid-cols-2 items-stretch gap-3 md:grid-cols-3 xl:grid-cols-4"
            >
              {directoryShops.map((shop) => {
                const stillMedia = shop.media?.filter((media) => media.kind !== 'video') ?? [];

                const fullAddress = shop.address;
                return (
                  <article
                    key={shop.slug}
                    className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                  >
                    <HostShopMediaCarousel
                      shopName={shop.dba ?? shop.name}
                      compact
                      items={stillMedia.map((item) => ({ url: item.src, alt: item.alt }))}
                    />

                    <div className="flex flex-1 flex-col p-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-black tracking-tight text-slate-950 sm:text-base">
                            <Link
                              href={`/host-shops/${shop.slug}`}
                              className="hover:text-brand-red-700"
                            >
                              {shop.dba ?? shop.name}
                            </Link>
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

                      <p className="mt-3 line-clamp-2 text-xs font-medium leading-5 text-slate-700">
                        {shop.marketingBlurb ?? shop.note}
                      </p>

                      <div className="mt-3 space-y-2 border-y border-slate-100 py-3">
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

                      <div className="mt-auto flex flex-wrap gap-3 pt-6">
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
