import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink, MapPin, Navigation, Phone } from 'lucide-react';
import {
  FEATURED_BEAUTY_HOST_PARTNERS,
  getFeaturedHostPartnerBySlug,
} from '@/lib/apprenticeship-programs/host-partners';

const SITE_URL = 'https://www.elevateforhumanity.org';

type PageProps = {
  params: Promise<{ slug: string }>;
};

function fullAddress(shop: (typeof FEATURED_BEAUTY_HOST_PARTNERS)[number]) {
  return `${shop.address}, ${shop.city}, ${shop.state} ${shop.zip}`;
}

function directionsUrl(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

function mapEmbedUrl(address: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`;
}

export function generateStaticParams() {
  return FEATURED_BEAUTY_HOST_PARTNERS.map((shop) => ({ slug: shop.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const shop = getFeaturedHostPartnerBySlug(slug);
  if (!shop) return {};

  const publicName = shop.dba ?? shop.name;
  const canonical = `${SITE_URL}/host-shops/${shop.slug}`;
  const description = `${publicName} in ${shop.city}, Indiana is part of Elevate for Humanity’s apprenticeship host-shop network. Find the shop address, phone, map, website, booking information, and barber apprenticeship details.`;

  return {
    title: `${publicName} | Indiana Barber Apprenticeship Host Shop`,
    description,
    keywords: [
      publicName,
      `${publicName} ${shop.city}`,
      `barber shop ${shop.city} Indiana`,
      `barber apprenticeship ${shop.city}`,
      'Indiana barber apprenticeship host shop',
      'Elevate for Humanity host shop',
    ],
    alternates: { canonical },
    openGraph: {
      title: `${publicName} | Apprenticeship Host Shop`,
      description,
      url: canonical,
      type: 'website',
      images: shop.media?.[0]?.src ? [{ url: shop.media[0].src, alt: shop.media[0].alt }] : undefined,
    },
  };
}

export default async function HostShopProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const shop = getFeaturedHostPartnerBySlug(slug);
  if (!shop) return notFound();

  const publicName = shop.dba ?? shop.name;
  const address = fullAddress(shop);
  const image = shop.media?.[0];
  const sameAs = [shop.websiteUrl, shop.bookingUrl, shop.socialUrl, shop.onlineListingUrl].filter(
    (value): value is string => Boolean(value),
  );
  const canonical = `${SITE_URL}/host-shops/${shop.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': shop.businessType ?? 'BarberShop',
    name: publicName,
    legalName: shop.name,
    url: canonical,
    description: shop.marketingBlurb ?? shop.note,
    telephone: shop.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: shop.address,
      addressLocality: shop.city,
      addressRegion: shop.state,
      postalCode: shop.zip,
      addressCountry: 'US',
    },
    sameAs: sameAs.length ? sameAs : undefined,
    areaServed: {
      '@type': 'City',
      name: `${shop.city}, Indiana`,
    },
  };

  return (
    <main className="bg-white text-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-14">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-red-300">
              Elevate apprenticeship host shop
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{publicName}</h1>
            {shop.dba ? <p className="mt-2 text-sm font-semibold text-slate-400">Legal name: {shop.name}</p> : null}
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              {shop.marketingBlurb ?? shop.note}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {shop.phone ? (
                <a
                  href={`tel:${shop.phone.replace(/[^0-9+]/g, '')}`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-red-500"
                >
                  <Phone className="h-4 w-4" /> Call {shop.phone}
                </a>
              ) : null}
              <a
                href={directionsUrl(address)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/25 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-white/10"
              >
                <Navigation className="h-4 w-4" /> Directions
              </a>
            </div>
          </div>

          {image ? (
            <div className="relative min-h-[320px] overflow-hidden rounded-3xl border border-white/10 bg-slate-900 sm:min-h-[420px]">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className={image.kind === 'flyer' ? 'object-contain bg-white p-4' : 'object-cover'}
              />
            </div>
          ) : (
            <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-white/10 bg-slate-900 p-10 text-center">
              <div>
                <p className="text-3xl font-black">{publicName}</p>
                <p className="mt-3 text-slate-300">{shop.city}, Indiana</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-2xl font-black">Visit or contact the shop</h2>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="flex items-start gap-3 font-bold text-slate-900">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-red-700" />
                <span>{address}</span>
              </p>
              {shop.phone ? (
                <a
                  href={`tel:${shop.phone.replace(/[^0-9+]/g, '')}`}
                  className="mt-4 flex items-center gap-3 font-bold text-slate-900 hover:text-brand-red-700"
                >
                  <Phone className="h-5 w-5 text-brand-red-700" /> {shop.phone}
                </a>
              ) : (
                <p className="mt-4 text-sm font-semibold text-slate-600">
                  A direct public phone number has not been verified. Use the verified shop contact link below.
                </p>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-3">
              {shop.websiteUrl ? (
                <a href={shop.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-between rounded-xl border border-slate-300 px-4 py-2.5 font-bold hover:bg-slate-50">
                  {shop.websiteLabel ?? 'Visit shop website'} <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
              {shop.bookingUrl ? (
                <a href={shop.bookingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-between rounded-xl border border-slate-300 px-4 py-2.5 font-bold hover:bg-slate-50">
                  Book shop services <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
              {shop.socialUrl ? (
                <a href={shop.socialUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-between rounded-xl border border-slate-300 px-4 py-2.5 font-bold hover:bg-slate-50">
                  {shop.socialLabel ?? 'Photos & social'} <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
              {shop.onlineListingUrl ? (
                <a href={shop.onlineListingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-between rounded-xl border border-slate-300 px-4 py-2.5 font-bold hover:bg-slate-50">
                  {shop.onlineListingLabel ?? 'View shop listing'} <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
              {shop.resourceUrl ? (
                <a href={shop.resourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-between rounded-xl border border-brand-red-200 bg-brand-red-50 px-4 py-2.5 font-bold text-brand-red-800 hover:bg-brand-red-100">
                  {shop.resourceLabel ?? 'View apprenticeship document'} <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          </div>

          <div>
            <div className="h-[360px] overflow-hidden rounded-2xl border border-slate-300 sm:h-[480px]">
              <iframe
                title={`Map — ${publicName}`}
                src={mapEmbedUrl(address)}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-red-700">Future apprentices</p>
          <h2 className="mt-2 text-3xl font-black">Interested in training through an approved host shop?</h2>
          <p className="mx-auto mt-4 max-w-3xl leading-7 text-slate-700">
            Start with the Elevate barber apprenticeship application. Host-shop placement, available positions, funding, and transfer-hour documentation are reviewed as part of enrollment.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/programs/barber-apprenticeship/apply" className="rounded-xl bg-brand-red-600 px-6 py-3 font-extrabold text-white hover:bg-brand-red-700">
              Apply for Barber Apprenticeship
            </Link>
            <Link href="/programs/barber-apprenticeship#host-shops" className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-extrabold text-slate-900 hover:bg-slate-50">
              View all host shops
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
