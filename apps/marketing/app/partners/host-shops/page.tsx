import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { ROUTES } from '@/lib/navigation/routes';
import { getApprovedShops, PROGRAM_LABELS } from '@/lib/programs/host-shops';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Apprenticeship Host Sites | Elevate for Humanity',
  description:
    'Become an approved apprenticeship Host Site for Barber, Cosmetology, Esthetics, or Nail Technician training, review requirements, and view approved partner sites.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/partners/host-shops',
  },
};

const PROGRAMS = [
  {
    name: 'Barber Apprenticeship',
    detail: 'Registered apprenticeship pathway with supervised on-the-job learning and structured RTI.',
    image: '/images/pages/barber-training.webp',
    program: 'barber',
  },
  {
    name: 'Cosmetology Apprenticeship',
    detail: 'Licensed salon-based apprenticeship pathway with worksite supervision and progress verification.',
    image: '/images/pages/cosmetology.webp',
    program: 'cosmetology',
  },
  {
    name: 'Esthetics Apprenticeship',
    detail: 'Licensed spa and esthetics worksite pathway with supervised practical training.',
    image: '/images/beauty/esthetics-hero.webp',
    program: 'esthetician',
  },
  {
    name: 'Nail Technician Apprenticeship',
    detail: 'Licensed nail-salon apprenticeship pathway with documented worksite learning.',
    image: '/images/pages/nail-technician.webp',
    program: 'nail',
  },
] as const;

const REQUIREMENTS = [
  'Current business, shop, salon, spa, or establishment license appropriate to the occupation.',
  'A currently licensed supervising professional who can oversee training and verify OJL hours and competencies.',
  'Commercial/general liability insurance and workers’ compensation coverage or a valid exemption.',
  'Adequate chairs or workstations, equipment, client/service volume, and a safe training environment.',
  'EIN verification or W-9 and any applicable local business or occupancy documentation.',
  'Agreement to use Elevate’s hour, competency, attendance, document, and compliance verification workflows.',
];

const APPROVAL_STEPS = [
  {
    title: 'Submit one Host Site application',
    description: 'Select every apprenticeship occupation the location wants approval to host and upload the required business records.',
  },
  {
    title: 'License and document verification',
    description: 'Elevate verifies the worksite, supervising professional, insurance, workers’ compensation status, and EIN/W-9 information.',
  },
  {
    title: 'Agreement and onboarding',
    description: 'Approved sites complete the Host Site agreement and receive access to the hour, attendance, competency, and document workflows.',
  },
  {
    title: 'Apprentice placement and oversight',
    description: 'Apprentices may be assigned based on program fit and availability. The Host Site provides supervised OJL while Elevate manages sponsor governance and RTI.',
  },
];

export default async function HostShopsPage() {
  const approvedShops = await getApprovedShops();

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative h-[clamp(280px,44vw,540px)] overflow-hidden bg-slate-950">
        <Image
          src="/images/pages/admin-employers-hero.webp"
          alt="Licensed employer mentoring an apprentice at an approved training site"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-8 text-white sm:pb-12">
          <p className="text-sm font-black uppercase tracking-[0.15em] text-white">Apprenticeship employer partnership</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            Become an approved apprenticeship Host Site
          </h1>
          <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-slate-100 sm:text-lg">
            One employer pathway for Barber, Cosmetology, Esthetics, and Nail Technician apprenticeships.
            Elevate remains the Registered Apprenticeship sponsor and RTI provider; approved businesses provide supervised on-the-job learning.
          </p>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-black text-slate-950">One application. One approval workflow. One Host Site portal.</h2>
            <p className="mt-2 text-base leading-7 text-slate-700">
              This page replaces the former barber-only, host-shop, and employer-sponsorship entry points so businesses do not have to guess which form or portal to use.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/partners/host-shop/apply"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-red-700 px-6 py-3 font-black text-white hover:bg-brand-red-800"
            >
              Start Host Site Application
            </Link>
            <a
              href={ROUTES.hostShopPortal}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-900 bg-white px-6 py-3 font-black text-slate-950 hover:bg-slate-100"
            >
              Host Site Portal
            </a>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-brand-red-700">Choose the occupation</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Beauty apprenticeship Host Site pathways</h2>
            <p className="mt-3 text-base leading-7 text-slate-700">
              The same application supports all four pathways. Select the occupations that match the business license, supervising professional, and worksite.
            </p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {PROGRAMS.map((program) => (
              <article key={program.program} className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
                <div className="relative aspect-[4/3] bg-slate-200">
                  <Image
                    src={program.image}
                    alt={`${program.name} Host Site training environment`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-black text-slate-950">{program.name}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{program.detail}</p>
                  <Link
                    href={`/partners/host-shop/apply?program=${program.program}`}
                    className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
                  >
                    Apply for this pathway
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="relative min-h-[380px] overflow-hidden rounded-2xl bg-slate-200">
            <Image
              src="/images/pages/apprenticeship-structure.webp"
              alt="Structured apprenticeship supervision and skills training"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-brand-red-700">Approval requirements</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">What an approved Host Site must provide</h2>
            <p className="mt-3 text-base leading-7 text-slate-700">
              Approval is based on the actual worksite and occupation. Submitting an application does not authorize a business to host an apprentice until verification and onboarding are complete.
            </p>
            <ul className="mt-6 grid gap-3">
              {REQUIREMENTS.map((requirement) => (
                <li key={requirement} className="rounded-xl border border-slate-300 bg-white p-4 text-sm font-semibold leading-6 text-slate-800 shadow-sm">
                  {requirement}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-950 py-14 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 sm:p-8">
              <h2 className="text-2xl font-black text-white">What the Host Site provides</h2>
              <ul className="mt-5 space-y-3 text-base font-medium leading-7 text-slate-100">
                <li>Supervised on-the-job learning at the approved worksite.</li>
                <li>Appropriate workspace, equipment, client/service exposure, and workplace safety.</li>
                <li>Attendance, hour, and competency verification by the approved supervisor.</li>
                <li>Employment and compensation practices consistent with the approved apprenticeship arrangement.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 sm:p-8">
              <h2 className="text-2xl font-black text-white">What Elevate handles</h2>
              <ul className="mt-5 space-y-3 text-base font-medium leading-7 text-slate-100">
                <li>Registered Apprenticeship sponsor governance and program oversight.</li>
                <li>Related Technical Instruction, curriculum, LMS access, and structured competencies.</li>
                <li>Apprentice records, hour tracking workflows, documentation, and compliance reporting.</li>
                <li>Host Site approval, onboarding, monitoring, and completion verification.</li>
              </ul>
              <Link
                href={ROUTES.apprenticeshipSponsor}
                className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-white px-5 py-2.5 text-sm font-black text-slate-950 hover:bg-slate-100"
              >
                View Sponsor of Record & Governance
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-brand-red-700">Approval workflow</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">From application to apprentice placement</h2>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {APPROVAL_STEPS.map((step, index) => (
              <article key={step.title} className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-base font-black text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-slate-950">{step.title}</h3>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{step.description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-brand-red-700">Current network</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">Approved Host Sites</h2>
              <p className="mt-3 text-base leading-7 text-slate-700">
                Approved locations are shown from the live partner records. Placement depends on program approval, apprentice fit, worksite capacity, and current availability.
              </p>
            </div>
          </div>

          {approvedShops.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-slate-300 bg-white p-6 text-base font-semibold text-slate-700">
              The public approved-site list is currently unavailable. Contact Elevate for current placement partners.
            </div>
          ) : (
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {approvedShops.map((shop) => (
                <li key={shop.id} className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-1 h-5 w-5 shrink-0 text-brand-red-700" aria-hidden />
                    <div>
                      <h3 className="text-lg font-black text-slate-950">{shop.name}</h3>
                      <p className="mt-1 text-sm font-medium leading-6 text-slate-700">
                        {[shop.address, shop.city, shop.state, shop.zip].filter(Boolean).join(', ')}
                      </p>
                      {shop.supervisor ? (
                        <p className="mt-2 text-sm font-medium text-slate-700">Supervisor: {shop.supervisor}</p>
                      ) : null}
                      <p className="mt-4 text-xs font-black uppercase tracking-wide text-emerald-800">Approved Host Site</p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                        {shop.programs.map((slug) => PROGRAM_LABELS[slug] ?? slug).join(' · ')}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-brand-red-700">Required uploads</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Submit the worksite once, with the documents needed for review</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
              The universal application accepts the business/shop license, liability insurance certificate, workers’ compensation certificate or exemption, supervising professional license, EIN verification or W-9, and optional local business/occupancy records.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/partners/host-shop/apply"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-red-700 px-7 py-3 font-black text-white hover:bg-brand-red-800"
              >
                Start Host Site Application
              </Link>
              <Link
                href={ROUTES.contact}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-900 bg-white px-7 py-3 font-black text-slate-950 hover:bg-slate-100"
              >
                Ask a Partnership Question
              </Link>
            </div>
          </div>
          <div className="relative min-h-[300px] overflow-hidden rounded-2xl bg-slate-200">
            <Image
              src="/images/pages/about-employer-partners.webp"
              alt="Employer partner reviewing apprenticeship training requirements"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
