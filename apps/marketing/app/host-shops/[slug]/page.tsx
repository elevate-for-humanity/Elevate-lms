import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink, MapPin, Navigation, Phone } from 'lucide-react';
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getPublicHostShopBySlug(slug);
  if (!shop) return {};
  const canonical = `${SITE_URL}/host-shops/${shop.public_slug}`;
  const description = shop.description || `${shop.display_name} is a verified Elevate apprenticeship Host Shop${shop.city ? ` in ${shop.city}, ${shop.state || ''}` : ''}.`;
  const image = shop.logo_url || shop.flyer_url;
  return {
    title: `${shop.display_name} | Apprenticeship Host Shop`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${shop.display_name} | Apprenticeship Host Shop`,
      description,
      url: canonical,
      type: 'website',
      images: image ? [{ url: image, alt: `${shop.display_name} Host Shop` }] : undefined,
    },
  };
}

export default async function HostShopProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const shop = await getPublicHostShopBySlug(slug);
  if (!shop) return notFound();

  const address = fullAddress(shop);
  const media = shop.logo_url || shop.flyer_url;
  const externalUrl = shop.website_url || shop.website;
  const canonical = `${SITE_URL}/host-shops/${shop.public_slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BarberShop',
    name: shop.display_name,
    url: canonical,
    description: shop.description || undefined,
    telephone: shop.phone || undefined,
    image: media || undefined,
    address: address ? {
      '@type': 'PostalAddress',
      streetAddress: [shop.address_line1, shop.address_line2].filter(Boolean).join(' '),
      addressLocality: shop.city || undefined,
      addressRegion: shop.state || undefined,
      postalCode: shop.zip || undefined,
      addressCountry: 'US',
    } : undefined,
    sameAs: externalUrl ? [externalUrl] : undefined,
  };

  return (
    <main className="bg-white text-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-14">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-red-300">Verified Elevate apprenticeship Host Shop</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{shop.display_name}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">{shop.description || 'Approved worksite participating in supervised apprenticeship training.'}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              {shop.phone ? <a href={`tel:${shop.phone.replace(/[^0-9+]/g, '')}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-extrabold text-white"><Phone className="h-4 w-4" /> Call {shop.phone}</a> : null}
              {address ? <a href={directionsUrl(address)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/25 px-5 py-2.5 text-sm font-extrabold text-white"><Navigation className="h-4 w-4" /> Directions</a> : null}
            </div>
          </div>
          {media ? (
            <div className="relative min-h-[320px] overflow-hidden rounded-3xl border border-white/10 bg-white sm:min-h-[420px]">
              <Image src={media} alt={`${shop.display_name} Host Shop`} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className={shop.logo_url ? 'object-contain p-6' : 'object-contain'} />
            </div>
          ) : (
            <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-white/10 bg-slate-900 p-10 text-center"><div><p className="text-3xl font-black">{shop.display_name}</p><p className="mt-3 text-slate-300">{[shop.city, shop.state].filter(Boolean).join(', ')}</p></div></div>
          )}
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-2xl font-black">Visit or contact the shop</h2>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              {address ? <p className="flex items-start gap-3 font-bold"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-red-700" /><span>{address}</span></p> : null}
              {shop.phone ? <a href={`tel:${shop.phone.replace(/[^0-9+]/g, '')}`} className="mt-4 flex items-center gap-3 font-bold"><Phone className="h-5 w-5 text-brand-red-700" /> {shop.phone}</a> : null}
            </div>
            {externalUrl ? <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 font-bold">Visit shop website <ExternalLink className="h-4 w-4" /></a> : null}
            {shop.flyer_url && shop.logo_url ? <div className="relative mt-6 aspect-[4/5] overflow-hidden rounded-2xl border bg-white"><Image src={shop.flyer_url} alt={`${shop.display_name} flyer`} fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-contain" /></div> : null}
          </div>
          {address ? <div className="h-[360px] overflow-hidden rounded-2xl border border-slate-300 sm:h-[480px]"><iframe title={`Map — ${shop.display_name}`} src={mapEmbedUrl(address)} className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div> : null}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-12 text-center sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-black">Interested in becoming an apprentice?</h2>
          <p className="mx-auto mt-4 max-w-3xl leading-7 text-slate-700">Apply through Elevate and identify this Host Shop during enrollment when appropriate.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href={`/programs/barber-apprenticeship/apply?hostShop=${encodeURIComponent(shop.display_name)}&hostShopId=${shop.id}`} className="rounded-xl bg-brand-red-600 px-6 py-3 font-extrabold text-white">Apply for Barber Apprenticeship</Link>
            <Link href="/host-shops" className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-extrabold">View all Host Shops</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
