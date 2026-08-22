import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import HostShopMediaCarousel from '@/components/partners/HostShopMediaCarousel';
import { ROUTES } from '@/lib/navigation/routes';
import { getApprovedShops, PROGRAM_LABELS } from '@/lib/programs/host-shops';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Approved Apprenticeship Host Sites | Elevate for Humanity',
  description: 'Meet approved Elevate apprenticeship Host Sites, explore each partner location, and apply to host or train through the network.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/host-shops' },
};

const HOST_SITE_APPLY_HREF = '/host-shop/apply';

const REQUIREMENTS = [
  'Current business or establishment license appropriate to the occupation.',
  'A currently licensed supervising professional who can oversee training and verify competencies.',
  'Commercial/general liability insurance and workers’ compensation coverage or a valid exemption.',
  'Adequate workspace, equipment, client/service exposure, and a safe training environment.',
  'EIN verification or W-9 and any applicable local business or occupancy documentation.',
  'Use of Elevate attendance, hour, competency, document, and compliance workflows.',
];

const APPROVAL_STEPS = [
  ['Apply', 'Submit the business location, supervising professional, occupations, and required documents.'],
  ['Verify', 'Elevate verifies licenses, insurance, worksite readiness, and supervisor eligibility.'],
  ['Approve & onboard', 'Approved sites receive Host Site onboarding and portal access.'],
  ['Place & supervise', 'Apprentices are matched by occupation, location, capacity, and current availability.'],
] as const;

function address(shop: Awaited<ReturnType<typeof getApprovedShops>>[number]) {
  return [shop.address, shop.city, shop.state, shop.zip].filter(Boolean).join(', ');
}
function embedUrl(value: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(value)}&z=14&output=embed`;
}

export default async function HostShopsPage() {
  const approvedShops = await getApprovedShops();

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="bg-slate-950 px-4 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-red-300">Apprenticeship Host Site Network</p>
          <h1 className="mt-4 max-w-5xl text-4xl font-black tracking-tight sm:text-6xl">Meet the businesses training the next generation.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">Approved barbershops, salons, spas, and beauty businesses provide supervised work-based learning while Elevate manages registered-program governance, RTI, records, and compliance workflows.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={HOST_SITE_APPLY_HREF} className="rounded-xl bg-brand-red-600 px-6 py-3 font-black text-white hover:bg-brand-red-700">Become a Host Site</Link>
            <a href={ROUTES.hostShopPortal} className="rounded-xl border border-white/25 px-6 py-3 font-black text-white hover:bg-white/10">Host Site Portal</a>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-brand-red-700">Approved network</p>
            <h2 className="mt-2 text-3xl font-black">Every approved Host Site gets a public profile.</h2>
            <p className="mt-3 leading-7 text-slate-700">Profiles are tied to the approved operational record. Original partner photos, videos and promotional media are shown from the approved public profile, while address and contact details remain tied to the approved worksite record.</p>
          </div>

          {approvedShops.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-slate-300 bg-white p-6 font-semibold text-slate-700">The approved Host Site directory is temporarily unavailable. Contact Elevate for current placement partners.</div>
          ) : (
            <div className="mt-10 space-y-8">
              {approvedShops.map((shop) => {
                const shopAddress = address(shop);
                const media = shop.mediaGallery ?? [];
                const profileHref = shop.publicSlug ? `/host-shops/${shop.publicSlug}` : undefined;
                const carouselItems = [
                  ...media,
                  ...(shop.logoUrl ? [{ url: shop.logoUrl, alt: `${shop.name} logo` }] : []),
                  ...(shop.flyerUrl ? [{ url: shop.flyerUrl, alt: `${shop.name} flyer` }] : []),
                ];
                return (
                  <article key={shop.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="grid lg:grid-cols-[1.05fr_.95fr]">
                      <div className="p-6 sm:p-8">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-800"><ShieldCheck className="h-4 w-4" /> Approved Host Site</span>
                          {shop.programs.map((slug) => <span key={slug} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">{PROGRAM_LABELS[slug] ?? slug}</span>)}
                        </div>
                        <h3 className="mt-5 text-3xl font-black">{shop.name}</h3>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">{shop.description || 'Approved worksite participating in supervised apprenticeship training through Elevate.'}</p>
                        {shopAddress ? <p className="mt-5 flex items-start gap-2 text-sm font-bold text-slate-700"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-red-700" /> {shopAddress}</p> : null}
                        {shop.phone ? <a href={`tel:${shop.phone}`} className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><Phone className="h-4 w-4 text-brand-red-700" /> {shop.phone}</a> : null}
                        {shop.email ? <a href={`mailto:${shop.email}`} className="mt-3 flex items-center gap-2 break-all text-sm font-semibold text-slate-700"><Mail className="h-4 w-4 shrink-0 text-brand-red-700" /> {shop.email}</a> : null}
                        {shop.supervisor ? <p className="mt-3 text-sm font-semibold text-slate-600">Approved supervisor: {shop.supervisor}</p> : null}
                        <div className="mt-6 flex flex-wrap gap-3">
                          {profileHref ? <Link href={profileHref} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">View Host Site profile</Link> : null}
                          {shop.website ? <a href={shop.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-black">Visit business website <ExternalLink className="h-4 w-4" /></a> : null}
                          {shop.googleMapsUrl ? <a href={shop.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black">Google Maps</a> : null}
                        </div>
                      </div>
                      <div className="grid min-h-[360px] gap-4 bg-slate-100 p-4 sm:p-6">
                        {carouselItems.length || shop.videoUrl ? <HostShopMediaCarousel shopName={shop.name} items={carouselItems} videoUrl={shop.videoUrl} /> : null}
                        {shopAddress ? <div className="min-h-[260px] overflow-hidden rounded-2xl border border-slate-200 bg-white"><iframe title={`Map — ${shop.name}`} src={embedUrl(shopAddress)} className="h-full min-h-[260px] w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div> : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.14em] text-brand-red-700">Approval requirements</p>
              <h2 className="mt-2 text-3xl font-black">What a Host Site must provide</h2>
              <ul className="mt-6 space-y-3">{REQUIREMENTS.map((item) => <li key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-800">{item}</li>)}</ul>
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.14em] text-brand-red-700">Approval workflow</p>
              <h2 className="mt-2 text-3xl font-black">From application to apprentice placement</h2>
              <div className="mt-6 space-y-4">{APPROVAL_STEPS.map(([title, detail], index) => <div key={title} className="flex gap-4 rounded-2xl border border-slate-200 p-5"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 font-black text-white">{index + 1}</span><div><h3 className="font-black">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p></div></div>)}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-14 text-center text-white">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-black">Want your business in the Host Site network?</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-300">Submit one application. Elevate verifies the worksite, supervisor, licenses, insurance, and program fit before a location is published or assigned apprentices.</p>
          <Link href={HOST_SITE_APPLY_HREF} className="mt-7 inline-flex rounded-xl bg-brand-red-600 px-7 py-3.5 font-black text-white">Start Host Site Application</Link>
        </div>
      </section>
    </main>
  );
}
