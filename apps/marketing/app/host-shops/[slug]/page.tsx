import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink, MapPin, Navigation, Phone, ShieldCheck } from 'lucide-react';
import HostShopMediaCarousel from '@/components/partners/HostShopMediaCarousel';
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [profile, approved] = await Promise.all([getPublicHostShopBySlug(slug), getApprovedShopByPublicSlug(slug)]);
  if (!profile || !approved) return {};
  const canonical = `${SITE_URL}/host-shops/${profile.public_slug}`;
  const description = profile.description || `${approved.name} is an approved Elevate apprenticeship Host Site${approved.city ? ` in ${approved.city}, ${approved.state}` : ''}.`;
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
  if (!profile || !approved) return notFound();

  const address = [approved.address, approved.city, approved.state, approved.zip].filter(Boolean).join(', ');
  const externalUrl = profile.website_url || profile.website;
  const mapUrl = profile.google_maps_url || (address ? directionsUrl(address) : undefined);
  const gallery = Array.isArray(profile.media_gallery) ? profile.media_gallery : [];
  const items = [
    ...gallery,
    ...(profile.logo_url ? [{ url: profile.logo_url, alt: `${approved.name} logo`, source: profile.source_url || externalUrl || undefined }] : []),
    ...(profile.flyer_url ? [{ url: profile.flyer_url, alt: `${approved.name} flyer`, source: profile.source_url || externalUrl || undefined }] : []),
  ];
  const programs = approved.programs;
  const canonical = `${SITE_URL}/host-shops/${profile.public_slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    name: approved.name,
    url: canonical,
    description: profile.description || undefined,
    telephone: approved.phone || undefined,
    image: items.map((item) => item.url),
    address: address ? { '@type': 'PostalAddress', streetAddress: approved.address || undefined, addressLocality: approved.city || undefined, addressRegion: approved.state || undefined, postalCode: approved.zip || undefined, addressCountry: 'US' } : undefined,
    sameAs: [externalUrl, mapUrl].filter(Boolean),
  };

  return (
    <main className="bg-white text-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <section className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-9 px-4 py-10 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-16">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-300"><ShieldCheck className="h-4 w-4" /> Approved Elevate apprenticeship Host Site</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">{approved.name}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">{profile.description || 'Approved worksite participating in supervised apprenticeship training through Elevate.'}</p>
            {programs.length ? <div className="mt-5 flex flex-wrap gap-2">{programs.map((program) => <span key={program} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black">{programLabel(program)}</span>)}</div> : null}
            {approved.supervisor ? <p className="mt-4 text-sm font-semibold text-slate-300">Approved supervisor: {approved.supervisor}</p> : null}
            <div className="mt-7 flex flex-wrap gap-3">
              {approved.phone ? <a href={`tel:${approved.phone.replace(/[^0-9+]/g, '')}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-red-600 px-5 py-2.5 text-sm font-extrabold text-white"><Phone className="h-4 w-4" /> Call {approved.phone}</a> : null}
              {mapUrl ? <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/25 px-5 py-2.5 text-sm font-extrabold text-white"><Navigation className="h-4 w-4" /> Google Maps</a> : null}
              {externalUrl ? <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/25 px-5 py-2.5 text-sm font-extrabold text-white">Shop website <ExternalLink className="h-4 w-4" /></a> : null}
            </div>
          </div>
          {items.length || profile.video_url ? <HostShopMediaCarousel shopName={approved.name} items={items} videoUrl={profile.video_url || undefined} /> : address ? <div className="h-[360px] overflow-hidden rounded-3xl border border-white/10"><iframe title={`Map — ${approved.name}`} src={mapEmbedUrl(address)} className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div> : null}
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <h2 className="text-2xl font-black">Visit the Host Site</h2>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              {address ? <p className="flex items-start gap-3 font-bold"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-red-700" /><span>{address}</span></p> : null}
              {approved.phone ? <a href={`tel:${approved.phone.replace(/[^0-9+]/g, '')}`} className="mt-4 flex items-center gap-3 font-bold"><Phone className="h-5 w-5 text-brand-red-700" /> {approved.phone}</a> : null}
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-600">Placement at a specific Host Site depends on occupation approval, apprentice fit, supervisor capacity, and current availability. A public profile does not guarantee an open placement.</p>
          </div>
          {address ? <div className="h-[380px] overflow-hidden rounded-2xl border border-slate-300 sm:h-[500px]"><iframe title={`Map — ${approved.name}`} src={mapEmbedUrl(address)} className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div> : null}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-12 text-center sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-black">Train at {approved.name}</h2>
          <p className="mx-auto mt-4 max-w-3xl leading-7 text-slate-700">Apply through Elevate and identify this approved Host Site. Admissions and apprenticeship staff confirm the correct occupation and current placement availability.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {programs.map((program) => <Link key={program} href={applyHref(program, approved.name, approved.id)} className="rounded-xl bg-brand-red-600 px-6 py-3 font-extrabold text-white">Apply — {programLabel(program)}</Link>)}
            <Link href="/partners/host-shops" className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-extrabold">View all Host Sites</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
