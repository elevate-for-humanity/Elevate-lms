import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink, MapPin, Navigation, Phone, ShieldCheck } from 'lucide-react';
import HostShopMediaCarousel from '@/components/partners/HostShopMediaCarousel';
import { getPublicHostShopBySlug } from '@/lib/partners/public-host-shops';

export const dynamic = 'force-dynamic';
const SITE_URL = 'https://www.elevateforhumanity.org';
type PageProps = { params: Promise<{ slug: string }> };

function fullAddress(shop: NonNullable<Awaited<ReturnType<typeof getPublicHostShopBySlug>>>) {
  return [shop.address_line1, shop.address_line2, shop.city, shop.state, shop.zip].filter(Boolean).join(', ');
}
function directionsUrl(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}
function mapEmbedUrl(address: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`;
}
function programSlugs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).toLowerCase());
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getPublicHostShopBySlug(slug);
  if (!shop) return {};
  const canonical = `${SITE_URL}/host-shops/${shop.public_slug}`;
  const description = shop.description || `${shop.display_name} is an approved Elevate apprenticeship Host Site${shop.city ? ` in ${shop.city}, ${shop.state || ''}` : ''}.`;
  const gallery = Array.isArray(shop.media_gallery) ? shop.media_gallery : [];
  const image = gallery[0]?.url || shop.logo_url || shop.flyer_url;
  return {
    title: `${shop.display_name} | Apprenticeship Host Site`,
    description,
    alternates: { canonical },
    openGraph: { title: `${shop.display_name} | Apprenticeship Host Site`, description, url: canonical, type: 'website', images: image ? [{ url: image, alt: `${shop.display_name} Host Site` }] : undefined },
  };
}

export default async function HostShopProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const shop = await getPublicHostShopBySlug(slug);
  if (!shop) return notFound();

  const address = fullAddress(shop);
  const externalUrl = shop.website_url || shop.website;
  const mapUrl = shop.google_maps_url || (address ? directionsUrl(address) : undefined);
  const gallery = Array.isArray(shop.media_gallery) ? shop.media_gallery : [];
  const items = [
    ...gallery,
    ...(shop.logo_url ? [{ url: shop.logo_url, alt: `${shop.display_name} logo`, source: shop.source_url || externalUrl || undefined }] : []),
    ...(shop.flyer_url ? [{ url: shop.flyer_url, alt: `${shop.display_name} flyer`, source: shop.source_url || externalUrl || undefined }] : []),
  ];
  const programs = programSlugs(shop.programs);
  const canonical = `${SITE_URL}/host-shops/${shop.public_slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    name: shop.display_name,
    url: canonical,
    description: shop.description || undefined,
    telephone: shop.phone || undefined,
    image: items.map((item) => item.url),
    address: address ? { '@type': 'PostalAddress', streetAddress: [shop.address_line1, shop.address_line2].filter(Boolean).join(' '), addressLocality: shop.city || undefined, addressRegion: shop.state || undefined, postalCode: shop.zip || undefined, addressCountry: 'US' } : undefined,
    sameAs: [externalUrl, mapUrl].filter(Boolean),
  };

  return (
    <main className="bg-white text-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <section className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-9 px-4 py-10 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-16">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-300"><ShieldCheck className="h-4 w-4" /> Approved Elevate apprenticeship Host Site</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">{shop.display_name}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">{shop.description || 'Approved worksite participating in supervised apprenticeship training through Elevate.'}</p>
            {programs.length ? <div className="mt-5 flex flex-wrap gap-2">{programs.map((program) => <span key={program} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black">{programLabel(program)}</span>)}</div> : null}
            <div className="mt-7 flex flex-wrap gap-3">
              {shop.phone ? <a href={`tel:${shop.phone.replace(/[^0-9+]/g, '')}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-red-600 px-5 py-2.5 text-sm font-extrabold text-white"><Phone className="h-4 w-4" /> Call {shop.phone}</a> : null}
              {mapUrl ? <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/25 px-5 py-2.5 text-sm font-extrabold text-white"><Navigation className="h-4 w-4" /> Google Maps</a> : null}
              {externalUrl ? <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/25 px-5 py-2.5 text-sm font-extrabold text-white">Shop website <ExternalLink className="h-4 w-4" /></a> : null}
            </div>
          </div>
          {items.length || shop.video_url ? <HostShopMediaCarousel shopName={shop.display_name} items={items} videoUrl={shop.video_url || undefined} /> : address ? <div className="h-[360px] overflow-hidden rounded-3xl border border-white/10"><iframe title={`Map — ${shop.display_name}`} src={mapEmbedUrl(address)} className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div> : null}
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <h2 className="text-2xl font-black">Visit the Host Site</h2>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              {address ? <p className="flex items-start gap-3 font-bold"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-red-700" /><span>{address}</span></p> : null}
              {shop.phone ? <a href={`tel:${shop.phone.replace(/[^0-9+]/g, '')}`} className="mt-4 flex items-center gap-3 font-bold"><Phone className="h-5 w-5 text-brand-red-700" /> {shop.phone}</a> : null}
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-600">Placement at a specific Host Site depends on occupation approval, apprentice fit, supervisor capacity, and current availability. A public profile does not guarantee an open placement.</p>
          </div>
          {address ? <div className="h-[380px] overflow-hidden rounded-2xl border border-slate-300 sm:h-[500px]"><iframe title={`Map — ${shop.display_name}`} src={mapEmbedUrl(address)} className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div> : null}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-12 text-center sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-black">Train at {shop.display_name}</h2>
          <p className="mx-auto mt-4 max-w-3xl leading-7 text-slate-700">Apply through Elevate and identify this approved Host Site. Admissions and apprenticeship staff confirm the correct occupation and current placement availability.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {(programs.length ? programs : ['barber']).map((program) => <Link key={program} href={applyHref(program, shop.display_name, shop.id)} className="rounded-xl bg-brand-red-600 px-6 py-3 font-extrabold text-white">Apply — {programLabel(program)}</Link>)}
            <Link href="/partners/host-shops" className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-extrabold">View all Host Sites</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
