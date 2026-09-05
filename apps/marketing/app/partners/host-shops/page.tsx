import type { Metadata } from 'next';
import Link from 'next/link';
import HostShopNetworkDirectory from '@/components/partners/HostShopNetworkDirectory';
import { ROUTES } from '@/lib/navigation/routes';
import { getHostShopNetwork } from '@/lib/programs/host-shop-network';
import { BARBER_PRICING } from '@/lib/programs/pricing';
import { HOST_SHOP_REGIONS } from '@/lib/marketing/host-shop-regions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Indiana Barber & Cosmetology Apprenticeship Host Shops',
  description: 'Find approved Indiana barber and cosmetology apprenticeship Host Shops, view business profiles and portfolios, contact shops, and apply for apprenticeship opportunities.',
  keywords: ['Indiana barber shops', 'Indiana hair salons', 'barber apprenticeship host shop', 'cosmetology apprenticeship salon', 'apprenticeship near me'],
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/host-shops' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
  openGraph: {
    title: 'Indiana Barber & Cosmetology Apprenticeship Host Shops',
    description: 'Explore approved Host Shops, portfolios, contact details, and apprenticeship opportunities across Indiana.',
    url: 'https://www.elevateforhumanity.org/partners/host-shops',
    type: 'website',
    images: [{ url: '/images/partners/kountry-kutz-interior.webp', alt: 'Elevate apprenticeship Host Shop network' }],
  },
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

export default async function HostShopsPage() {
  const networkShops = await getHostShopNetwork();

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="overflow-hidden border-b border-slate-200 bg-white px-4 py-8 sm:py-12">
        <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[.92fr_1.08fr]">
          <div className="py-4">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-red-700">Apprenticeship Host Site Network</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Real businesses. Real training. Real careers.</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-700">Meet the approved shops where apprentices earn, learn, and build experience with licensed professionals.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={HOST_SITE_APPLY_HREF} className="rounded-xl bg-brand-red-600 px-6 py-3 font-black text-white hover:bg-brand-red-700">Become a Host Site</Link>
              <a href={ROUTES.hostShopPortal} className="rounded-xl border-2 border-slate-300 bg-white px-6 py-3 font-black text-slate-900 hover:border-brand-red-600">Host Site Portal</a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-slate-700">
              <span>✓ No-cost Host Site application</span>
              <span>✓ Licensed supervision</span>
              <span>✓ Elevate-managed compliance</span>
            </div>
          </div>
          <div className="grid h-[430px] grid-cols-2 grid-rows-2 gap-3 overflow-hidden rounded-3xl bg-slate-100 p-3 shadow-xl">
            <img src="/images/partners/kountry-kutz-interior.webp" alt="Interior of an approved apprenticeship Host Shop" className="row-span-2 h-full w-full rounded-2xl object-cover" />
            <img src="/images/partners/cals-kutz-official.webp" alt="Apprenticeship training at Cal’s Kutz" className="h-full w-full rounded-2xl object-cover" />
            <img src="/images/partners/generations-hair/color-transformation.webp" alt="Hair color work at Generations Hair" className="h-full w-full rounded-2xl object-cover" />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-brand-red-700">Regional Host Site support</p>
          <h2 className="mt-2 text-3xl font-black">Build an apprenticeship pathway in your Indiana market</h2>
          <p className="mt-4 max-w-3xl leading-7 text-slate-700">Review the Host Site process, employer responsibilities, conditional workforce support, and local apprenticeship pathway for your region.</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{HOST_SHOP_REGIONS.map((region) => <Link key={region.slug} href={`/partners/host-shops/indiana/${region.slug}`} className="rounded-2xl border border-slate-200 bg-white p-5 font-black shadow-sm hover:border-brand-red-400">{region.city} Host Shops <span aria-hidden="true">→</span></Link>)}</div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-4 py-14" aria-labelledby="host-site-overview">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-brand-red-700">Host Site overview</p>
            <h2 id="host-site-overview" className="mt-2 text-3xl font-black sm:text-4xl">Train an apprentice, grow your team, and keep the process clear.</h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">The shop employs and supervises the apprentice. Elevate manages instruction, records, progress tracking, and apprenticeship compliance.</p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-6">
              <p className="text-sm font-black uppercase tracking-wider text-emerald-800">Host Site cost</p>
              <h3 className="mt-2 text-3xl font-black text-emerald-950">$0 to apply or participate</h3>
              <p className="mt-3 text-sm leading-6 text-emerald-950">
                No application or placement fee. The employer covers wages, insurance, tools, supplies, and normal business expenses.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-black uppercase tracking-wider text-brand-red-700">Barber apprentice tuition</p>
              <h3 className="mt-2 text-3xl font-black">{`${BARBER_PRICING.fullPrice.toLocaleString('en-US')}`}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Self-pay starts with {`${BARBER_PRICING.minDownPayment.toLocaleString('en-US')}`} down, then about {`${barberWeeklyEstimate.toFixed(2)}`} weekly for {BARBER_PRICING.paymentTermWeeks} weeks. Eligible funding may help. Tuition is paid to Elevate.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-black uppercase tracking-wider text-brand-red-700">How the shop earns</p>
              <h3 className="mt-2 text-2xl font-black">Business revenue plus a trained employee</h3>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Shops keep normal service and retail revenue while developing a skilled employee. Apprentices must be properly supervised and paid under the approved wage schedule.
              </p>
            </article>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-wider text-brand-blue-800">Workforce reimbursement</p>
              <h3 className="mt-2 text-2xl font-black text-slate-950">Eligible shops may receive an OJT wage reimbursement.</h3>
              <p className="mt-3 leading-7 text-slate-700">Qualifying employers may receive reimbursement for up to 50% of eligible wages during approved training. WorkOne approval is required before covered work begins.</p>
              <p className="mt-3 text-sm font-bold leading-6 text-slate-800">Eligibility is not automatic. The employer and apprentice must qualify and retain payroll and training records.</p>
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

          <div className="mt-8 flex flex-col gap-3 rounded-2xl border-2 border-brand-red-200 bg-brand-red-50 p-6 text-slate-950 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-2xl font-black">Ready to become a Host Site?</h3>
              <p className="mt-1 text-sm leading-6 text-slate-700">Apply at no cost. Have your five required documents ready for the fastest review.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={HOST_SITE_APPLY_HREF} className="rounded-xl bg-brand-red-600 px-6 py-3 text-center font-black text-white hover:bg-brand-red-700">Start No-Cost Application</Link>
              <a href="tel:+13173142050" className="rounded-xl border-2 border-slate-300 bg-white px-6 py-3 text-center font-black text-slate-950 hover:border-brand-red-600">Call (317) 314-2050</a>
            </div>
          </div>
        </div>
      </section>

      <section id="network-directory" className="border-b border-slate-200 bg-slate-950 px-4 py-14 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-red-400">Elevate Host Shop Network</p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">Find a participating shop by city or occupation.</h2>
            <p className="mt-3 leading-7 text-slate-300">Each listing gives the business a permanent, shareable profile while helping apprentices and customers discover participating Indiana shops. Approval and current apprentice capacity are confirmed separately.</p>
          </div>
          <HostShopNetworkDirectory shops={networkShops} />
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
