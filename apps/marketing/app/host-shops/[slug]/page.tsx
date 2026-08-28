import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink, MapPin, Navigation, Phone, ShieldCheck } from 'lucide-react';
import HostShopMediaCarousel from '@/components/partners/HostShopMediaCarousel';
import { getFeaturedHostPartnerBySlug, type FeaturedHostPartner } from '@/lib/apprenticeship-programs/host-partners';
import { getPublicHostShopBySlug } from '@/lib/partners/public-host-shops';
import { getApprovedShopByPublicSlug } from '@/lib/programs/host-shops';

export const dynamic = 'force-dynamic';
const SITE_URL = 'https://www.elevateforhumanity.org';
type PageProps = { params: Promise<{ slug: string }> };

function directionsUrl(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}
function mapEmbedUrl(address: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`;
}
function applyHref(program: string, shopName: string, shopId: string) {
  const slug = program.includes('cosmet') ? 'cosmetology-apprenticeship' : program.includes('esthetic') ? 'esthetician-apprenticeship' : program.includes('nail') ? 'nail-technician-apprenticeship' : 'barber-apprenticeship';
  return `/programs/${slug}/apply?hostShop=${encodeURIComponent(shopName)}&hostShopId=${shopId}`;
}
function programLabel(program: string) {
  if (program.includes('cosmet')) return 'Cosmetology Apprenticeship';
  if (program.includes('esthetic')) return 'Esthetician Apprenticeship';
  if (program.includes('nail')) return 'Nail Technician Apprenticeship';
  return 'Barber Apprenticeship';
}
function dedupeMedia(items: Array<{ url: string; alt?: string; source?: string }>) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.url.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [profile, approved] = await Promise.all([getPublicHostShopBySlug(slug), getApprovedShopByPublicSlug(slug)]);
  if (!profile || !approved) {
    const featured = getFeaturedHostPartnerBySlug(slug);
    if (!featured) return {};
    const canonical = `${SITE_URL}/host-shops/${featured.slug}`;
    const image = featured.media?.find((media) => media.kind !== 'video');
    return {
      title: `${featured.dba ?? featured.name} | Apprenticeship Host Shop Partner`,
      description: featured.marketingBlurb ?? featured.note,
      alternates: { canonical },
      openGraph: {
        title: `${featured.dba ?? featured.name} | Apprenticeship Host Shop Partner`,
        description: featured.marketingBlurb ?? featured.note,
        url: canonical,
        type: 'website',
        images: image ? [{ url: image.src, alt: image.alt }] : undefined,
      },
    };
  }
  const canonical = `${SITE_URL}/host-shops/${profile.public_slug}`;
  const description = approved.description || `${approved.name} is an approved Elevate apprenticeship Host Site${approved.city ? ` in ${approved.city}, ${approved.state}` : ''}.`;
  const gallery = Array.isArray(profile.media_gallery) ? profile.media_gallery : [];
  const image = gallery[0]?.url || profile.logo_url || profile.flyer_url;
  return {
    title: `${approved.name} | Apprenticeship Host Site`,
    description,
    alternates: { canonical },
    openGraph: { title: `${approved.name} | Apprenticeship Host Site`, description, url: canonical, type: 'website', images: image ? [{ url: image, alt: `${approved.name} Host Site` }] : undefined },
  };
}

export default async function HostShopProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const [profile, approved] = await Promise.all([getPublicHostShopBySlug(slug), getApprovedShopByPublicSlug(slug)]);
  if (!profile || !approved) {
    const featured = getFeaturedHostPartnerBySlug(slug);
    if (!featured) return notFound();
    return <FeaturedHostShopProfile shop={featured} />;
  }

  const address = [approved.address, approved.city, approved.state, approved.zip].filter(Boolean).join(', ');
  const externalUrl = profile.website_url || profile.website;
  const mapUrl = approved.googleMapsUrl || (address ? directionsUrl(address) : undefined);
  const gallery = Array.isArray(profile.media_gallery) ? profile.media_gallery : [];
  const items = dedupeMedia([
    ...gallery,
    ...(profile.logo_url ? [{ url: profile.logo_url, alt: `${approved.name} logo`, source: profile.source_url || externalUrl || undefined }] : []),
    ...(profile.flyer_url ? [{ url: profile.flyer_url, alt: `${approved.name} flyer`, source: profile.source_url || externalUrl || undefined }] : []),
  ]);
  const programs = approved.programs;
  const canonical = `${SITE_URL}/host-shops/${profile.public_slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    name: approved.name,
    url: canonical,
    description: approved.description || undefined,
    telephone: approved.phone || undefined,
    image: items.map((item) => item.url),
    address: address ? { '@type': 'PostalAddress', streetAddress: approved.address || undefined, addressLocality: approved.city || undefined, addressRegion: approved.state || undefined, postalCode: approved.zip || undefined, addressCountry: 'US' } : undefined,
    sameAs: [externalUrl, mapUrl].filter(Boolean),
  };

  return (
    <main className="overflow-x-hidden bg-white text-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <section className="border-b border-slate-200 bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12 lg:py-16">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-800"><ShieldCheck className="h-4 w-4" /> Approved Elevate apprenticeship Host Site</p>
            <h1 className="mt-4 break-words text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">{approved.name}</h1>
            {approved.description ? <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">{approved.description}</p> : null}
            {programs.length ? <div className="mt-5 flex flex-wrap gap-2">{programs.map((program) => <span key={program} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-800 shadow-sm">{programLabel(program)}</span>)}</div> : null}
            {approved.supervisor ? <p className="mt-4 text-sm font-semibold text-slate-600">Approved supervisor: <span className="text-slate-950">{approved.supervisor}</span></p> : null}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {approved.phone ? <a href={`tel:${approved.phone.replace(/[^0-9+]/g, '')}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-5 py-3 text-sm font-extrabold text-white sm:justify-start"><Phone className="h-4 w-4" /> Call {approved.phone}</a> : null}
              {mapUrl ? <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-extrabold text-slate-900 sm:justify-start"><Navigation className="h-4 w-4" /> Approved Worksite Map</a> : null}
              {externalUrl ? <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-extrabold text-slate-900 sm:justify-start">Shop website <ExternalLink className="h-4 w-4" /></a> : null}
            </div>
          </div>
          <div className="min-w-0">
            {items.length || profile.video_url ? <HostShopMediaCarousel shopName={approved.name} items={items} videoUrl={profile.video_url || undefined} /> : address ? <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 sm:rounded-3xl"><iframe title={`Approved worksite map — ${approved.name}`} src={mapEmbedUrl(address)} className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div> : null}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-8">
          <div className="min-w-0">
            <h2 className="text-2xl font-black">Approved Training Worksite</h2>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
              {address ? <p className="flex items-start gap-3 font-bold"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-red-700" /><span className="break-words">{address}</span></p> : null}
              {approved.phone ? <a href={`tel:${approved.phone.replace(/[^0-9+]/g, '')}`} className="mt-4 flex items-center gap-3 font-bold"><Phone className="h-5 w-5 shrink-0 text-brand-red-700" /> {approved.phone}</a> : null}
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-600">The address shown here is the worksite on the approved apprenticeship Host Site record. A business may maintain other public storefront, mailing, booking, or service addresses. Placement at this worksite depends on occupation approval, apprentice fit, supervisor capacity, and current availability.</p>
          </div>
          {address ? <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-300 sm:aspect-[16/10]"><iframe title={`Approved worksite map — ${approved.name}`} src={mapEmbedUrl(address)} className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div> : null}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-10 text-center sm:px-6 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-black">Train at {approved.name}</h2>
          <p className="mx-auto mt-4 max-w-3xl leading-7 text-slate-700">Apply through Elevate and identify this approved Host Site. Admissions and apprenticeship staff confirm the correct occupation and current placement availability.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            {programs.map((program) => <Link key={program} href={applyHref(program, approved.name, approved.id)} className="rounded-xl bg-brand-red-600 px-6 py-3 font-extrabold text-white">Apply — {programLabel(program)}</Link>)}
            <Link href="/partners/host-shops" className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-extrabold">View all Host Sites</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function FeaturedHostShopProfile({ shop }: { shop: FeaturedHostPartner }) {
  const address = `${shop.address}, ${shop.city}, ${shop.state} ${shop.zip}`;
  const imageItems = (shop.media ?? [])
    .filter((media) => media.kind !== 'video')
    .map((media) => ({ url: media.src, alt: media.alt }));
  const videoUrl = shop.media?.find((media) => media.kind === 'video')?.src;
  const mapUrl = directionsUrl(address);

  return (
    <main className="overflow-x-hidden bg-white text-slate-950">
      {videoUrl ? (
        <section className="relative isolate h-[clamp(380px,58vh,600px)] overflow-hidden bg-black">
          <video
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            controls
            preload="metadata"
            className="absolute inset-0 h-full w-full object-contain"
            aria-label={`${shop.dba ?? shop.name} Host Salon video`}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/30" />
          <div className="relative mx-auto flex h-full max-w-6xl items-end px-4 pb-8 pt-20 text-white sm:px-6 sm:pb-12">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-white">Elevate Host Salon</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">{shop.dba ?? shop.name}</h1>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-white sm:text-lg">One of Elevate&apos;s participating host salons supporting apprenticeship training in a real salon environment.</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-b border-slate-200 bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12 lg:py-16">
          <div className="min-w-0">
            <p className="inline-flex rounded-full bg-brand-blue-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-brand-blue-800">Elevate apprenticeship Host Shop partner</p>
            <h2 className="mt-4 break-words text-3xl font-black tracking-tight sm:text-4xl">Meet {shop.dba ?? shop.name}</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">{shop.marketingBlurb ?? shop.note}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {shop.programs.map((program) => <span key={program} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-800 shadow-sm">{programLabel(program)}</span>)}
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {shop.phone ? <a href={`tel:${shop.phone.replace(/[^0-9+]/g, '')}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-5 py-3 text-sm font-extrabold text-white"><Phone className="h-4 w-4" /> Call {shop.phone}</a> : null}
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-extrabold"><Navigation className="h-4 w-4" /> Map & directions</a>
              {shop.websiteUrl ? <a href={shop.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-extrabold">Shop website <ExternalLink className="h-4 w-4" /></a> : null}
            </div>
          </div>
          <HostShopMediaCarousel shopName={shop.dba ?? shop.name} items={imageItems} />
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-8">
          <div className="min-w-0">
            <h2 className="text-2xl font-black">Host Shop location</h2>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
              <p className="flex items-start gap-3 font-bold"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-red-700" /><span>{address}</span></p>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-600">Apprenticeship placement depends on occupation fit, sponsor review, supervisor capacity, and current availability.</p>
          </div>
          <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-300 sm:aspect-[16/10]"><iframe title={`Map — ${shop.dba ?? shop.name}`} src={mapEmbedUrl(address)} className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-10 text-center sm:px-6 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-black">Interested in training with {shop.dba ?? shop.name}?</h2>
          <p className="mx-auto mt-4 max-w-3xl leading-7 text-slate-700">Apply through Elevate and identify this Host Shop. Admissions staff will confirm the correct occupation and current placement availability.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            {shop.programs.map((program) => <Link key={program} href={`/programs/${program}/apply?hostShop=${encodeURIComponent(shop.dba ?? shop.name)}`} className="rounded-xl bg-brand-red-600 px-6 py-3 font-extrabold text-white">Apply — {programLabel(program)}</Link>)}
            <Link href="/partners/host-shops" className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-extrabold">View all Host Shops</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
