import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getHostShopNetwork } from '@/lib/programs/host-shop-network';
import { getHostShopRegion, HOST_SHOP_REGIONS } from '@/lib/marketing/host-shop-regions';
export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.elevateforhumanity.org';
type PageProps = { params: Promise<{ city: string }> };


export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const region = getHostShopRegion((await params).city);
  if (!region) return {};
  const canonical = `${SITE_URL}/partners/host-shops/indiana/${region.slug}`;
  const title = `Become an Apprenticeship Host Shop in ${region.city}, Indiana`;
  const description = `Barbershops and salons in ${region.city}: learn how to become an approved apprenticeship Host Site, supervise paid apprentices, use Elevate compliance tools, and support self-pay apprenticeship enrollment.`;
  return {
    title,
    description,
    keywords: [`${region.city} barber apprenticeship`, `${region.city} cosmetology apprenticeship`, `hire apprentice ${region.city}`, 'Indiana apprenticeship host shop'],
    alternates: { canonical },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
    openGraph: { title, description, url: canonical, type: 'website', images: [{ url: '/images/partners/kountry-kutz-interior.webp', alt: 'Indiana apprenticeship Host Shop' }] },
  };
}

export default async function RegionalHostShopPage({ params }: PageProps) {
  const region = getHostShopRegion((await params).city);
  if (!region) notFound();
  const shops = (await getHostShopNetwork()).filter((shop) =>
    [region.city, ...region.nearbyCities].some((city) => city.toLowerCase() === shop.city.trim().toLowerCase()),
  );
  const canonical = `${SITE_URL}/partners/host-shops/indiana/${region.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Apprenticeship Host Site support in ${region.city}, Indiana`,
    url: canonical,
    provider: { '@id': `${SITE_URL}/#organization` },
    areaServed: { '@type': 'City', name: region.city, containedInPlace: { '@type': 'State', name: 'Indiana' } },
    serviceType: 'Registered apprenticeship Host Site onboarding and compliance support',
  };

  return (
    <main className="bg-white text-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <section className="border-b border-slate-200 bg-slate-950 px-4 py-16 text-white sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-red-300">{region.city}, Indiana Host Site Network</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">Grow your {region.city} shop while developing paid apprentice talent</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">Elevate provides the related instruction, onboarding workflow, hours and competency systems, and sponsor oversight. Your shop employs, pays, and supervises the apprentice in an approved work environment.</p>
          <Link href={`/partners/host-shop/apply?region=${region.slug}`} className="mt-8 inline-flex rounded-xl bg-brand-red-600 px-7 py-4 font-black text-white">Check Host Site eligibility</Link>
        </div>
      </section>
      <section className="px-4 py-14"><div className="mx-auto max-w-6xl"><div className="grid gap-5 md:grid-cols-3">
        <Value title="No Host Site fee" detail="There is no application or apprentice-placement fee. Normal employer expenses—including wages, payroll, insurance, tools, and supervision—still apply." />
        <Value title="One compliance workspace" detail="Track onboarding, attendance, OJL hours, competencies, documents, and requested corrections in the secure Host Shop portal." />
        <Value title="Self-pay apprenticeship enrollment" detail="Apprenticeship tuition is self-pay only. Apprentices review the published program tuition and payment terms before enrollment." />
      </div></div></section>
      <section className="px-4 py-14"><div className="mx-auto max-w-6xl"><h2 className="text-3xl font-black">How approval works in {region.city}</h2><div className="mt-7 grid gap-4 md:grid-cols-3"><Step n="1" title="Apply and upload" detail="Submit one application with business, supervisor, license, insurance, workers’ compensation, and identity records." /><Step n="2" title="Verify and onboard" detail="Elevate reviews the worksite and occupation fit, then opens conditional portal onboarding and required agreements." /><Step n="3" title="Match and supervise" detail="After approval and a suitable match, employ the apprentice and verify hours and competencies through the portal." /></div>
      {shops.length ? <div className="mt-12"><h2 className="text-2xl font-black">Approved Host Sites in {region.city} and nearby communities</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{shops.map((shop) => <Link key={shop.id} href={`/host-shops/${shop.slug}`} className="rounded-xl border border-slate-300 p-5"><span className="block font-bold">{shop.name}</span><span className="mt-2 block text-sm text-slate-600">{shop.city}, {shop.state}</span></Link>)}</div></div> : <p className="mt-12 text-slate-700">No approved public Host Sites are currently listed for {region.city} or the nearby communities. <Link href="/partners/host-shops" className="font-bold underline">Browse the statewide directory</Link>.</p>}
      <p className="mt-12 max-w-4xl leading-7 text-slate-700">Elevate supports barbershops, cosmetology salons, esthetics businesses, and nail salons seeking an apprenticeship Host Site pathway in {region.city}, {region.counties.join(' and ')} County, and nearby communities including {region.nearbyCities.join(', ')}. Apprenticeship tuition is self-pay only. Placement depends on occupation fit, licensed supervision, and current capacity.</p></div></section>
    </main>
  );
}

function Value({ title, detail }: { title: string; detail: string }) { return <article className="rounded-2xl border border-slate-200 p-6"><h2 className="text-xl font-black">{title}</h2><p className="mt-3 leading-7 text-slate-700">{detail}</p></article>; }
function Step({ n, title, detail }: { n: string; title: string; detail: string }) { return <article className="rounded-2xl border border-slate-200 bg-white p-6"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 font-black text-white">{n}</span><h3 className="mt-4 text-xl font-black">{title}</h3><p className="mt-2 leading-7 text-slate-700">{detail}</p></article>; }
