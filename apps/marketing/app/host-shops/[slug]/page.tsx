import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BadgeCheck, ExternalLink, MapPin, Navigation, Phone } from 'lucide-react';
import {
  FEATURED_BEAUTY_HOST_PARTNERS,
  getFeaturedHostPartnerBySlug,
} from '@/lib/apprenticeship-programs/host-partners';

const SITE_URL = 'https://www.elevateforhumanity.org';

type PageProps = { params: Promise<{ slug: string }> };

const PROGRAM_LABELS: Record<string, string> = {
  'barber-apprenticeship': 'Barber Apprenticeship',
  'cosmetology-apprenticeship': 'Cosmetology Apprenticeship',
  'nail-technician-apprenticeship': 'Nail Technician Apprenticeship',
};

function programLabel(slug: string) {
  return PROGRAM_LABELS[slug] ?? slug.replace(/-/g, ' ');
}
function programHref(slug: string) {
  return `/programs/${slug}`;
}
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
  const programNames = shop.programs.map(programLabel);
  const description = `${publicName} in ${shop.city}, Indiana is part of Elevate for Humanity’s apprenticeship host-shop network for ${programNames.join(', ')}. Find verified contact details, map information, and direct program links.`;
  return {
    title: `${publicName} | Indiana Apprenticeship Host Shop`,
    description,
    keywords: [
      publicName,
      `${publicName} ${shop.city}`,
      `${shop.businessType === 'HairSalon' ? 'salon' : 'barber shop'} ${shop.city} Indiana`,
      ...programNames.map((name) => `${name} ${shop.city}`),
      'Indiana apprenticeship host shop',
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
  const sameAs = [shop.websiteUrl, shop.bookingUrl, shop.socialUrl, shop.onlineListingUrl].filter((value): value is string => Boolean(value));
  const canonical = `${SITE_URL}/host-shops/${shop.slug}`;
  const programNames = shop.programs.map(programLabel);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': shop.businessType ?? 'LocalBusiness',
    '@id': `${canonical}#business`,
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
    areaServed: { '@type': 'City', name: `${shop.city}, Indiana` },
    knowsAbout: programNames,
  };

  return (
    <main className="bg-white text-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-14">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-red-300">Elevate apprenticeship host shop</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{publicName}</h1>
            {shop.dba ? <p className="mt-2 text-sm font-semibold text-slate-400">Legal name: {shop.name}</p> : null}
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">{shop.marketingBlurb ?? shop.note}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {shop.programs.map((program) => (
                <Link key={program} href={programHref(program)} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black text-white hover:bg-white/15">
                  {programLabel(program)}
                </Link>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              {shop.phone ? <a href={`tel:${shop.phone.replace(/[^0-9+]/g, '')}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-red-500"><Phone className="h-4 w-4" /> Call {shop.phone}</a> : null}
              <a href={directionsUrl(address)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/25 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-white/10"><Navigation className="h-4 w-4" /> Directions</a>
            </div>
          </div>
          {image ? (
            <div className="relative min-h-[320px] overflow-hidden rounded-3xl border border-white/10 bg-slate-900 sm:min-h-[420px]">
              <Image src={image.src} alt={image.alt} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className={image.kind === 'flyer' ? 'object-contain bg-white p-4' : 'object-cover'} />
            </div>
          ) : <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-white/10 bg-slate-900 p-10 text-center"><div><p className="text-3xl font-black">{publicName}</p><p className="mt-3 text-slate-300">{shop.city}, Indiana</p></div></div>}
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-2xl font-black">Visit or contact the shop</h2>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="flex items-start gap-3 font-bold text-slate-900"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-red-700" /><span>{address}</span></p>
              {shop.phone ? <a href={`tel:${shop.phone.replace(/[^0-9+]/g, '')}`} className="mt-4 flex items-center gap-3 font-bold text-slate-900 hover:text-brand-red-700"><Phone className="h-5 w-5 text-brand-red-700" /> {shop.phone}</a> : <p className="mt-4 text-sm font-semibold text-slate-600">A direct public phone number has not been verified. Use the verified shop contact link below.</p>}
            </div>
            <div className="mt-5 flex flex-col gap-3">
              {shop.websiteUrl ? <a href={shop.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-between rounded-xl border border-slate-300 px-4 py-2.5 font-bold hover:bg-slate-50">{shop.websiteLabel ?? 'Visit shop website'} <ExternalLink className="h-4 w-4" /></a> : null}
              {shop.bookingUrl ? <a href={shop.bookingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-between rounded-xl border border-slate-300 px-4 py-2.5 font-bold hover:bg-slate-50">Book shop services <ExternalLink className="h-4 w-4" /></a> : null}
              {shop.socialUrl ? <a href={shop.socialUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-between rounded-xl border border-slate-300 px-4 py-2.5 font-bold hover:bg-slate-50">{shop.socialLabel ?? 'Photos & social'} <ExternalLink className="h-4 w-4" /></a> : null}
              {shop.onlineListingUrl ? <a href={shop.onlineListingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-between rounded-xl border border-slate-300 px-4 py-2.5 font-bold hover:bg-slate-50">{shop.onlineListingLabel ?? 'View shop listing'} <ExternalLink className="h-4 w-4" /></a> : null}
              {shop.resourceUrl ? <a href={shop.resourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-between rounded-xl border border-brand-red-200 bg-brand-red-50 px-4 py-2.5 font-bold text-brand-red-800 hover:bg-brand-red-100">{shop.resourceLabel ?? 'View apprenticeship document'} <ExternalLink className="h-4 w-4" /></a> : null}
            </div>
          </div>
          <div className="h-[360px] overflow-hidden rounded-2xl border border-slate-300 sm:h-[480px]"><iframe title={`Map — ${publicName}`} src={mapEmbedUrl(address)} className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-red-700">Future apprentices</p>
            <h2 className="mt-2 text-3xl font-black">Interested in training through {publicName}?</h2>
            <p className="mx-auto mt-4 max-w-3xl leading-7 text-slate-700">Start on the exact Elevate program page for the license pathway you want. Host-shop placement, available positions, funding, and any transfer-hour documentation are reviewed during enrollment.</p>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shop.programs.map((program) => (
              <Link key={program} href={programHref(program)} className="rounded-2xl border border-slate-300 bg-white p-4 text-center font-extrabold text-slate-950 hover:border-brand-red-300 hover:bg-brand-red-50">
                View {programLabel(program)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-3xl border border-blue-200 bg-blue-50 p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <BadgeCheck className="mt-0.5 h-6 w-6 shrink-0 text-blue-700" />
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-blue-700">For this host shop’s web team</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Create a verified backlink to the program you host.</h2>
              <p className="mt-3 text-sm font-medium leading-6 text-slate-700">Add a plain-text link on your Careers, About, or Apprenticeship page. Keep the wording factual and link to the exact Elevate program page so applicants and search engines can verify the partnership.</p>
              <div className="mt-5 space-y-3">
                {shop.programs.map((program) => {
                  const label = programLabel(program);
                  const absolute = `${SITE_URL}${programHref(program)}`;
                  return (
                    <div key={program} className="rounded-xl border border-blue-200 bg-white p-4">
                      <div className="text-sm font-black text-slate-950">Suggested anchor text</div>
                      <p className="mt-1 text-sm text-slate-700">Proud Host Shop partner for the <a className="font-bold text-blue-700 underline" href={absolute}>{`Elevate for Humanity ${label}`}</a>.</p>
                      <code className="mt-3 block overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{`<a href="${absolute}">Elevate for Humanity ${label}</a>`}</code>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
