import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import HostShopMediaCarousel from '@/components/partners/HostShopMediaCarousel';
import { ROUTES } from '@/lib/navigation/routes';
import { getApprovedShops, PROGRAM_LABELS } from '@/lib/programs/host-shops';
import { BARBER_PRICING } from '@/lib/programs/pricing';

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
  ['Apply at no cost', 'Submit the business location, supervising professional, occupations, and required documents. There is no Host Site application or placement fee.'],
  ['Verify', 'Elevate verifies licenses, insurance, worksite readiness, and supervisor eligibility.'],
  ['Approve & onboard', 'Approved sites receive Host Site onboarding and portal access.'],
  ['Place & supervise', 'Apprentices are matched by occupation, location, capacity, and current availability.'],
] as const;

const CALLER_CHECKLIST = [
  'Choose the apprenticeship occupation(s) your shop can support.',
  'Confirm an eligible licensed supervisor is available at the training site.',
  'Gather the business/shop license, supervisor license, liability insurance, workers’ compensation certificate or exemption, and EIN verification or W-9.',
  'Confirm the shop can employ, pay, supervise, and retain the apprentice and keep payroll and training records.',
  'Submit the no-cost Host Site application.',
  'Meet with Elevate for document verification, worksite review, training-plan setup, and portal onboarding.',
  'Before hiring, ask the local WorkOne office to screen the candidate and employer for OJT reimbursement eligibility and obtain written authorization.',
] as const;

const barberWeeklyEstimate = Math.ceil(
  ((BARBER_PRICING.fullPrice - BARBER_PRICING.minDownPayment) * 100) /
    BARBER_PRICING.paymentTermWeeks,
) / 100;

function address(shop: Awaited<ReturnType<typeof getApprovedShops>>[number]) {
  return [shop.address, shop.city, shop.state, shop.zip].filter(Boolean).join(', ');
}
function embedUrl(value: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(value)}&z=14&output=embed`;
}

function hasPublicContactEmail(value: string | null | undefined): value is string {
  const email = value?.trim().toLowerCase();
  return Boolean(email && !email.startsWith('pending-contact+'));
}

export default async function HostShopsPage() {
  const approvedShops = await getApprovedShops();

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="border-b border-brand-blue-200 bg-brand-blue-50 px-4 py-16 text-slate-950 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-red-700">Apprenticeship Host Site Network</p>
          <h1 className="mt-4 max-w-5xl text-4xl font-black tracking-tight sm:text-6xl">Meet the businesses training the next generation.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">Approved barbershops, salons, spas, and beauty businesses provide supervised work-based learning while Elevate manages registered-program governance, RTI, records, and compliance workflows.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={HOST_SITE_APPLY_HREF} className="rounded-xl bg-brand-red-600 px-6 py-3 font-black text-white hover:bg-brand-red-700">Become a Host Site</Link>
            <a href={ROUTES.hostShopPortal} className="rounded-xl border-2 border-brand-blue-700 bg-white px-6 py-3 font-black text-brand-blue-800 hover:bg-brand-blue-100">Host Site Portal</a>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-4 py-14" aria-labelledby="host-site-overview">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-brand-red-700">Host Site overview</p>
            <h2 id="host-site-overview" className="mt-2 text-3xl font-black sm:text-4xl">Train an apprentice, grow your team, and keep the process clear.</h2>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              An approved Host Site is the apprentice’s employer and supervised work-based learning location.
              Elevate administers the apprenticeship program, Related Technical Instruction, progress records,
              and compliance workflow. The shop provides paid employment, day-to-day supervision, practical
              experience, accurate records, and a safe licensed workplace.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-6">
              <p className="text-sm font-black uppercase tracking-wider text-emerald-800">Host Site cost</p>
              <h3 className="mt-2 text-3xl font-black text-emerald-950">$0 to apply or participate</h3>
              <p className="mt-3 text-sm leading-6 text-emerald-950">
                Elevate does not charge a Host Site application or apprentice-placement fee. The employer
                remains responsible for apprentice wages, payroll obligations, insurance, tools, supplies,
                supervision, and normal business costs. Optional software or services are separate if selected.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-black uppercase tracking-wider text-brand-red-700">Barber apprentice tuition</p>
              <h3 className="mt-2 text-3xl font-black">{`${BARBER_PRICING.fullPrice.toLocaleString('en-US')}`}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Current self-pay barber tuition: at least {`${BARBER_PRICING.minDownPayment.toLocaleString('en-US')}`} down,
                then about {`${barberWeeklyEstimate.toFixed(2)}`} weekly for {BARBER_PRICING.paymentTermWeeks} weeks
                (the final payment is adjusted to the exact balance). Approved workforce funding may cover eligible
                participant costs. Tuition is paid to Elevate—not to the Host Site.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-black uppercase tracking-wider text-brand-red-700">How the shop earns</p>
              <h3 className="mt-2 text-2xl font-black">Business revenue plus a trained employee</h3>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                The shop may earn its ordinary client-service and retail revenue from work completed under proper
                supervision while building a skilled employee. The apprentice must be paid under the approved wage
                schedule and applicable law. Elevate does not promise a commission, guaranteed revenue, or profit.
              </p>
            </article>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-blue-300 bg-blue-50 p-6">
              <p className="text-sm font-black uppercase tracking-wider text-brand-blue-800">Workforce reimbursement</p>
              <h3 className="mt-2 text-2xl font-black text-slate-950">Eligible shops may receive an OJT wage reimbursement.</h3>
              <p className="mt-3 leading-7 text-slate-700">
                Indiana WorkOne says approved On-the-Job Training arrangements can reimburse an employer for up to
                50% of an eligible new employee’s wages during training, generally for up to six months. The current
                state overview says the job must pay at least $13.50 per hour and the employer must commit to retaining
                the employee for at least six months after training.
              </p>
              <p className="mt-3 text-sm font-bold leading-6 text-slate-800">
                This is a conditional direct reimbursement—not an automatic rebate. The apprentice and employer must
                qualify, WorkOne must approve the training plan before covered work begins, and payroll/training evidence
                must be retained. WOTC is a separate federal tax credit requiring targeted-group certification.
              </p>
              <a href="https://www.in.gov/dwd/business-services/grants-credits-and-reimbursements/on-the-job-training/" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex rounded-xl border-2 border-brand-blue-700 bg-white px-5 py-3 text-sm font-black text-brand-blue-900">
                Review Indiana OJT reimbursement
              </a>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-wider text-brand-red-700">Caller-ready checklist</p>
              <h3 className="mt-2 text-2xl font-black">What to have ready</h3>
              <ol className="mt-5 space-y-3">
                {CALLER_CHECKLIST.map((item, index) => (
                  <li key={item} className="flex gap-3 text-sm font-semibold leading-6 text-slate-700">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">{index + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </article>
          </div>

          <div className="mt-8 flex flex-col gap-3 rounded-2xl bg-slate-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-2xl font-black">Ready to become a Host Site?</h3>
              <p className="mt-1 text-sm leading-6 text-slate-200">Apply at no cost. Have your five required documents ready for the fastest review.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={HOST_SITE_APPLY_HREF} className="rounded-xl bg-brand-red-600 px-6 py-3 text-center font-black text-white hover:bg-brand-red-700">Start No-Cost Application</Link>
              <a href="tel:+13173142050" className="rounded-xl border-2 border-white px-6 py-3 text-center font-black text-white hover:bg-white hover:text-slate-950">Call (317) 314-2050</a>
            </div>
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
                        {hasPublicContactEmail(shop.email) ? <a href={`mailto:${shop.email}`} className="mt-3 flex items-center gap-2 break-all text-sm font-semibold text-slate-700"><Mail className="h-4 w-4 shrink-0 text-brand-red-700" /> {shop.email}</a> : null}
                        {shop.supervisor ? <p className="mt-3 text-sm font-semibold text-slate-600">Approved supervisor: {shop.supervisor}</p> : null}
                        <div className="mt-6 flex flex-wrap gap-3">
                          {profileHref ? <Link href={profileHref} className="rounded-xl bg-brand-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-brand-blue-800">View Host Site profile</Link> : null}
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

      <section className="border-y border-brand-red-200 bg-brand-red-50 px-4 py-14 text-center text-slate-950">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-black">Want your business in the Host Site network?</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-700">Submit one application. Elevate verifies the worksite, supervisor, licenses, insurance, and program fit before a location is published or assigned apprentices.</p>
          <Link href={HOST_SITE_APPLY_HREF} className="mt-7 inline-flex rounded-xl bg-brand-red-600 px-7 py-3.5 font-black text-white">Start Host Site Application</Link>
        </div>
      </section>
    </main>
  );
}
