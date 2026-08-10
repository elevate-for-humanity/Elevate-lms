import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import HeroPicture from '@/components/marketing/HeroPicture';
import { BARBER_APPRENTICESHIP } from '@/data/programs/barber-apprenticeship';
import { COSMETOLOGY } from '@/data/programs/cosmetology-apprenticeship';
import { ESTHETICIAN_APPRENTICESHIP } from '@/data/programs/esthetician-apprenticeship';
import { NAIL_TECH } from '@/data/programs/nail-technician-apprenticeship';

export const metadata: Metadata = {
  title: 'Registered Apprenticeship Pathways | Elevate for Humanity',
  description:
    'Compare Elevate apprenticeship pathways, host-site training, program-specific tuition and funding information, and the steps required before enrollment.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/apprenticeships' },
};

const APPRENTICESHIPS = [
  BARBER_APPRENTICESHIP,
  COSMETOLOGY,
  ESTHETICIAN_APPRENTICESHIP,
  NAIL_TECH,
];

const STEPS = [
  {
    number: '01',
    title: 'Choose the exact occupation',
    body: 'Review the individual program record for required hours, licensing objective, tuition, admission rules, and current funding options.',
  },
  {
    number: '02',
    title: 'Complete the application',
    body: 'Submit the apprenticeship application and required documentation. Prior hours, transfer records, and host-site information are reviewed before they are credited.',
  },
  {
    number: '03',
    title: 'Confirm host-site placement and funding',
    body: 'A host shop or employer relationship and any third-party funding authorization must be confirmed for the individual participant. Neither is guaranteed by a website statement.',
  },
  {
    number: '04',
    title: 'Train and document progress',
    body: 'Complete the registered program requirements, related instruction, supervised on-the-job learning, competency documentation, and licensing steps that apply to the occupation.',
  },
] as const;

export default function ApprenticeshipsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <HeroPicture
        src="/images/pages/barber-apprenticeship-hero.jpg"
        alt="Barber apprentice providing a supervised client service in a professional shop"
        analyticsName="registered-apprenticeships"
      />

      <section className="bg-slate-950 py-14 text-white sm:py-18">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-4xl">
            <Link
              href="/approvals"
              className="inline-flex min-h-10 items-center rounded-full border border-white/30 bg-white/5 px-4 py-2 text-sm font-bold text-white hover:bg-white/10"
            >
              Review sponsor & approval information
            </Link>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Registered apprenticeship pathways with program-specific requirements.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200 sm:text-xl">
              Apprenticeship combines structured instruction with supervised workplace learning. The occupation, required hours, host-site arrangement, tuition, funding eligibility, and licensing steps must be verified for the individual program before enrollment.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/apply/student"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-red-600 px-7 py-3 font-bold text-white hover:bg-brand-red-700"
              >
                Start an Application
              </Link>
              <Link
                href="/partners/host-shops"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-white px-7 py-3 font-bold text-white hover:bg-white/10"
              >
                Review Host Shops
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 py-7">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-center text-sm leading-6 text-slate-700 sm:text-base">
            <strong className="text-slate-950">Important:</strong> registered-apprenticeship status does not mean every participant automatically receives WIOA, ETPL, state, employer, or other third-party funding. Funding is program- and participant-specific and requires the responsible funder’s authorization.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20" id="programs">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-red-700">Current pathways</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Compare the canonical program records
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              These cards use the same program records used by the individual program pages. Open the program before relying on hours, price, funding, credential, or scheduling information.
            </p>
          </div>

          <div className="mt-10 grid gap-7 md:grid-cols-2">
            {APPRENTICESHIPS.map((program) => (
              <article key={program.slug} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                  <Image
                    src={program.heroImage || '/images/pages/workforce-training.webp'}
                    alt={program.heroImageAlt || `${program.title} apprenticeship training`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-7">
                  <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-red-700">Registered apprenticeship pathway</p>
                  <h3 className="mt-2 text-2xl font-extrabold text-slate-950">{program.title}</h3>
                  <p className="mt-3 leading-7 text-slate-700">{program.subtitle}</p>
                  <dl className="mt-6 grid gap-3 rounded-2xl bg-slate-50 p-5 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wide text-slate-600">Self-pay tuition</dt>
                      <dd className="mt-1 font-extrabold text-slate-950">{program.selfPayCost || 'See program page'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wide text-slate-600">Delivery</dt>
                      <dd className="mt-1 font-extrabold capitalize text-slate-950">{program.deliveryMode || 'See program page'}</dd>
                    </div>
                  </dl>
                  <p className="mt-5 text-sm leading-6 text-slate-700">{program.fundingStatement}</p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href={`/programs/${program.slug}`}
                      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-800"
                    >
                      Review Program
                    </Link>
                    <Link
                      href={`/apply/student?program=${encodeURIComponent(program.slug)}`}
                      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-950 hover:bg-slate-50"
                    >
                      Apply
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-300">Enrollment logic</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">The sequence a production-ready apprenticeship page should make clear</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {STEPS.map((step) => (
              <article key={step.number} className="rounded-2xl border border-white/15 bg-white/5 p-6">
                <p className="text-sm font-extrabold tracking-[0.16em] text-red-300">{step.number}</p>
                <h3 className="mt-2 text-xl font-bold text-white">{step.title}</h3>
                <p className="mt-2 leading-7 text-slate-200">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-7 px-4 sm:px-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
            <h2 className="text-2xl font-extrabold text-slate-950">Need a host shop?</h2>
            <p className="mt-3 leading-7 text-slate-700">
              Review participating host shops and the host-shop process. Placement capacity varies, and a listed shop is not a guarantee of employment or assignment.
            </p>
            <Link href="/partners/host-shops" className="mt-6 inline-flex min-h-11 items-center font-bold text-brand-blue-800 underline decoration-2 underline-offset-4">
              Browse host-shop information
            </Link>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
            <h2 className="text-2xl font-extrabold text-slate-950">Using workforce funding?</h2>
            <p className="mt-3 leading-7 text-slate-700">
              Confirm the exact occupation and participant authorization with WorkOne or the responsible funding agency before treating tuition as funded.
            </p>
            <Link href="/funding/wioa" className="mt-6 inline-flex min-h-11 items-center font-bold text-brand-blue-800 underline decoration-2 underline-offset-4">
              Review WIOA funding steps
            </Link>
          </article>
        </div>
      </section>
    </main>
  );
}
