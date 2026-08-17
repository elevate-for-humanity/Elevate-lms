import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { ROUTES } from '@/lib/navigation/routes';
import { getApprovedShops, PROGRAM_LABELS } from '@/lib/programs/host-shops';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Host Shops | Elevate for Humanity',
  description:
    'Become an approved Elevate Host Shop, review requirements, apply for approval, access the Host Shop portal, and view approved partner locations.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/partners/host-shops',
  },
};

const PROGRAMS = [
  {
    name: 'Barber Host Shop',
    detail: 'Host barber participants at an approved shop with licensed supervision, documented work-based learning, and Elevate program oversight.',
    image: '/images/pages/barber-training.webp',
    program: 'barber',
  },
  {
    name: 'Cosmetology Host Shop',
    detail: 'Operate as an approved salon training site with qualified supervision, compliant workplace practices, and structured progress verification.',
    image: '/images/pages/cosmetology.webp',
    program: 'cosmetology',
  },
  {
    name: 'Esthetics Host Shop',
    detail: 'Serve as an approved spa or esthetics training location with licensed supervision, appropriate equipment, and documented skills development.',
    image: '/images/beauty/esthetics-hero.webp',
    program: 'esthetician',
  },
  {
    name: 'Nail Technician Host Shop',
    detail: 'Become an approved nail salon training site with licensed supervision, compliant workstations, and documented work-based learning.',
    image: '/images/pages/nail-technician.webp',
    program: 'nail',
  },
] as const;

const REQUIREMENTS = [
  'Current business, shop, salon, spa, or establishment license appropriate to the occupation.',
  'A currently licensed supervising professional who can oversee training and verify work hours and competencies.',
  'Commercial/general liability insurance and workers’ compensation coverage or a valid exemption.',
  'Adequate chairs or workstations, equipment, client/service volume, and a safe training environment.',
  'EIN verification or W-9 and any applicable local business or occupancy documentation.',
  'Agreement to use Elevate’s hour, competency, attendance, document, and compliance verification workflows.',
];

const APPROVAL_STEPS = [
  {
    title: 'Submit one Host Shop application',
    description: 'Tell us about the business, training location, supervising professional, and the occupations you want approval to host.',
  },
  {
    title: 'Business and license verification',
    description: 'Elevate verifies the worksite, supervising professional, insurance, workers’ compensation status, and EIN/W-9 information.',
  },
  {
    title: 'Host Shop approval and onboarding',
    description: 'Approved shops complete onboarding and receive access to the Host Shop portal for hours, attendance, competencies, and documents.',
  },
  {
    title: 'Participant placement and oversight',
    description: 'Eligible participants may be assigned based on occupation, location, shop capacity, and program fit while Elevate manages training and compliance oversight.',
  },
];

export default async function HostShopsPage() {
  const approvedShops = await getApprovedShops();

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative h-[clamp(280px,44vw,540px)] overflow-hidden bg-slate-950">
        <Image
          src="/images/instructors/sarah-chen.jpg"
          alt="Licensed shop professional mentoring a participant at an approved Host Shop"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-8 text-white sm:pb-12">
          <p className="text-sm font-black uppercase tracking-[0.15em] text-white">Host Shop Partnership</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            Become an approved Elevate Host Shop
          </h1>
          <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-slate-100 sm:text-lg">
            Partner with Elevate to provide supervised, real-world training in your licensed shop, salon, spa, or beauty business. One Host Shop approval can support eligible Barber, Cosmetology, Esthetics, and Nail Technician pathways.
          </p>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-black text-slate-950">One application. One approval workflow. One Host Shop portal.</h2>
            <p className="mt-2 text-base leading-7 text-slate-700">
              Businesses use one Host Shop process for approval, onboarding, participant supervision, hour verification, competency tracking, and compliance documents.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/partners/host-shop/apply"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-red-700 px-6 py-3 font-black text-white hover:bg-brand-red-800"
            >
              Apply to Become a Host Shop
            </Link>
            <a
              href={ROUTES.hostShopPortal}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-900 bg-white px-6 py-3 font-black text-slate-950 hover:bg-slate-100"
            >
              Host Shop Portal
            </a>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-brand-red-700">Host Shop pathways</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Choose the services your location is qualified to host</h2>
            <p className="mt-3 text-base leading-7 text-slate-700">
              Select every occupation that matches your business license, supervising professional, workstations, equipment, and client-service environment.
            </p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {PROGRAMS.map((program) => (
              <article key={program.program} className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
                <div className="relative aspect-[4/3] bg-slate-200">
                  <Image
                    src={program.image}
                    alt={`${program.name} training environment`}
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
                    Apply for this Host Shop pathway
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
              alt="Host Shop supervision, workplace training, and skills verification"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-brand-red-700">Host Shop requirements</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">What an approved Host Shop must provide</h2>
            <p className="mt-3 text-base leading-7 text-slate-700">
              Approval is based on the actual business location, licenses, supervising professional, insurance, equipment, and ability to support safe work-based training. Applying does not authorize a location until verification and onboarding are complete.
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
              <h2 className="text-2xl font-black text-white">What the Host Shop provides</h2>
              <ul className="mt-5 space-y-3 text-base font-medium leading-7 text-slate-100">
                <li>Supervised work-based training at the approved location.</li>
                <li>Appropriate workspace, equipment, client/service exposure, and workplace safety.</li>
                <li>Attendance, hour, and competency verification by the approved supervisor.</li>
                <li>Employment and compensation practices consistent with the approved training arrangement.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 sm:p-8">
              <h2 className="text-2xl font-black text-white">What Elevate handles</h2>
              <ul className="mt-5 space-y-3 text-base font-medium leading-7 text-slate-100">
                <li>Program governance, training standards, and compliance oversight.</li>
                <li>Related Technical Instruction, curriculum, LMS access, and structured competencies where required.</li>
                <li>Participant records, hour tracking workflows, documentation, and compliance reporting.</li>
                <li>Host Shop approval, onboarding, monitoring, and completion verification.</li>
              </ul>
              <Link
                href={ROUTES.apprenticeshipSponsor}
                className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-white px-5 py-2.5 text-sm font-black text-slate-950 hover:bg-slate-100"
              >
                View Program Governance
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-brand-red-700">Approval workflow</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">From Host Shop application to approved placement site</h2>
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
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-brand-red-700">Current network</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Approved Host Shops</h2>
            <p className="mt-3 text-base leading-7 text-slate-700">
              Approved locations are shown from live partner records. Placement depends on occupation approval, participant fit, current capacity, and availability.
            </p>
          </div>

          {approvedShops.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-slate-300 bg-white p-6 text-base font-semibold text-slate-700">
              The public approved Host Shop list is currently unavailable. Contact Elevate for current placement partners.
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
                      <p className="mt-4 text-xs font-black uppercase tracking-wide text-emerald-800">Approved Host Shop</p>
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
            <h2 className="mt-2 text-3xl font-black text-slate-950">Submit your Host Shop once with the documents needed for approval</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
              The universal application accepts the business/shop license, liability insurance certificate, workers’ compensation certificate or exemption, supervising professional license, EIN verification or W-9, and optional local business or occupancy documentation.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-300 bg-slate-50 p-6 shadow-sm">
            <h3 className="text-xl font-black text-slate-950">Ready to become a Host Shop?</h3>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-700">
              Complete one application for the location and select every eligible service pathway you want the shop approved to host.
            </p>
            <Link
              href="/partners/host-shop/apply"
              className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-red-700 px-6 py-3 font-black text-white hover:bg-brand-red-800"
            >
              Start Host Shop Application
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
