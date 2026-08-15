import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import HeroPicture from '@/components/marketing/HeroPicture';
import { BARBER_APPRENTICESHIP } from '@/data/programs/barber-apprenticeship';

export const metadata: Metadata = {
  title: 'Apprenticeship Programs | Elevate for Humanity',
  description:
    'Explore Elevate apprenticeship pathways in barbering, cosmetology, esthetics, and nail technology, including verified registered-apprenticeship information and state licensing pathways.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/apprenticeships' },
};

const PROGRAM = BARBER_APPRENTICESHIP;

const PATHWAYS = [
  {
    title: 'Barber Apprenticeship',
    href: '/programs/barber-apprenticeship',
    applyHref: '/apply/student?program=barber-apprenticeship',
    image: PROGRAM.heroImage || '/images/pexels/barber-hero.webp',
    imageAlt: PROGRAM.heroImageAlt || 'Barber apprentice training at a licensed host shop',
    badge: 'DOL Registered Pathway',
    description:
      'The verified registered occupation in Elevate’s canonical RAPIDS configuration. Includes supervised on-the-job learning, related technical instruction, progress documentation, and Indiana barber licensing preparation.',
  },
  {
    title: 'Cosmetology Apprenticeship',
    href: '/programs/cosmetology-apprenticeship',
    applyHref: '/apply/student?program=cosmetology-apprenticeship',
    image: '/images/pages/cosmetology-hero.webp',
    imageAlt: 'Cosmetology apprentice receiving supervised salon training',
    badge: 'Beauty Apprenticeship Pathway',
    description:
      'Supervised salon training and related instruction covering hair services, client care, sanitation, business practices, progress tracking, and preparation for Indiana cosmetology licensing requirements.',
  },
  {
    title: 'Esthetics Apprenticeship',
    href: '/programs/esthetician-apprenticeship',
    applyHref: '/apply/student?program=esthetician-apprenticeship',
    image: '/images/pages/esthetician-hero.webp',
    imageAlt: 'Esthetics apprentice completing supervised skincare training',
    badge: 'Beauty Apprenticeship Pathway',
    description:
      'Hands-on esthetics training with supervised practice, sanitation, skincare services, client safety, progress documentation, and preparation for the applicable Indiana licensing pathway.',
  },
  {
    title: 'Nail Technician Apprenticeship',
    href: '/programs/nail-technician-apprenticeship',
    applyHref: '/apply/student?program=nail-technician-apprenticeship',
    image: '/images/pages/nail-tech-hero.webp',
    imageAlt: 'Nail technician apprentice completing supervised salon training',
    badge: 'Beauty Apprenticeship Pathway',
    description:
      'Supervised nail-technology training covering sanitation, manicuring, nail services, client care, documented training progress, and preparation for the applicable Indiana licensing pathway.',
  },
] as const;

const STEPS = [
  {
    number: '01',
    title: 'Choose the pathway',
    body: 'Open the full program page for current training requirements, tuition, admission rules, licensing objective, and funding disclosures.',
  },
  {
    number: '02',
    title: 'Complete the application',
    body: 'Submit the apprenticeship application and required documentation. Prior training or transfer-hour evidence is reviewed before any credit is granted.',
  },
  {
    number: '03',
    title: 'Confirm host-site placement and funding',
    body: 'A participating host site and any third-party funding authorization must be confirmed for the individual apprentice. Neither is guaranteed by a website statement.',
  },
  {
    number: '04',
    title: 'Train and document progress',
    body: 'Complete the applicable program requirements, related instruction, supervised on-the-job learning, competency documentation, and licensing steps.',
  },
] as const;

export default function ApprenticeshipsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <HeroPicture
        src="/images/pages/admin-apprenticeships-hero.webp"
        alt="Apprentice receiving supervised hands-on training"
        analyticsName="apprenticeship-programs"
      />

      <section className="bg-slate-950 py-14 text-white sm:py-18">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-4xl">
            <Link
              href="/programs"
              className="inline-flex min-h-10 items-center rounded-full border border-white/30 bg-white/5 px-4 py-2 text-sm font-bold text-white hover:bg-white/10"
            >
              View all career programs
            </Link>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Apprenticeship pathways should show the full program family, not only one occupation.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200 sm:text-xl">
              Explore Barber, Cosmetology, Esthetics, and Nail Technician apprenticeship pathways. Barber is identified separately where the repository contains verified federal registered-apprenticeship evidence; the other beauty pathways retain their own program and licensing information without being mislabeled as federally registered.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/programs"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-red-600 px-7 py-3 font-bold text-white hover:bg-brand-red-700"
              >
                Browse All Programs
              </Link>
              <Link
                href="/partners/host-shops"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-white px-7 py-3 font-bold text-white hover:bg-white/10"
              >
                Host Shop Information
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 py-7">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-center text-sm leading-6 text-slate-700 sm:text-base">
            <strong className="text-slate-950">Funding notice:</strong> apprenticeship or program status does not automatically provide WIOA, ETPL, Workforce Ready Grant, employer, or other third-party funding. Funding remains participant- and program-specific and requires authorization from the responsible funder.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20" id="programs">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-red-700">Apprenticeship programs</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Choose your apprenticeship pathway
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              Each card opens the canonical program page so requirements, pricing, enrollment, and licensing information stay in one place.
            </p>
          </div>

          <div className="mt-10 grid gap-7 md:grid-cols-2">
            {PATHWAYS.map((pathway) => (
              <article key={pathway.href} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <Link href={pathway.href} className="block">
                  <div className="relative min-h-[260px] overflow-hidden bg-slate-100">
                    <Image
                      src={pathway.image}
                      alt={pathway.imageAlt}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                </Link>
                <div className="p-7">
                  <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-red-700">{pathway.badge}</p>
                  <h3 className="mt-2 text-2xl font-extrabold text-slate-950">{pathway.title}</h3>
                  <p className="mt-4 leading-7 text-slate-700">{pathway.description}</p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href={pathway.href}
                      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-800"
                    >
                      Review Full Program
                    </Link>
                    <Link
                      href={pathway.applyHref}
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
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-300">Enrollment process</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">What happens before and during apprenticeship</h2>
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
        <div className="mx-auto grid max-w-6xl gap-7 px-4 sm:px-6 lg:grid-cols-3">
          <article className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
            <h2 className="text-2xl font-extrabold text-slate-950">All career programs</h2>
            <p className="mt-3 leading-7 text-slate-700">Healthcare, skilled trades, business, technology, beauty, and other published programs remain available from the full catalog.</p>
            <Link href="/programs" className="mt-6 inline-flex min-h-11 items-center font-bold text-brand-blue-800 underline decoration-2 underline-offset-4">
              Open all programs
            </Link>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
            <h2 className="text-2xl font-extrabold text-slate-950">Need a host shop?</h2>
            <p className="mt-3 leading-7 text-slate-700">Review participating host shops and the host-site process. Placement capacity varies and a listed shop is not a guarantee of employment or assignment.</p>
            <Link href="/partners/host-shops" className="mt-6 inline-flex min-h-11 items-center font-bold text-brand-blue-800 underline decoration-2 underline-offset-4">
              Browse host-shop information
            </Link>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
            <h2 className="text-2xl font-extrabold text-slate-950">Using workforce funding?</h2>
            <p className="mt-3 leading-7 text-slate-700">Confirm the exact participant authorization and approved amount with WorkOne or the responsible funding agency before treating tuition as funded.</p>
            <Link href="/funding/wioa" className="mt-6 inline-flex min-h-11 items-center font-bold text-brand-blue-800 underline decoration-2 underline-offset-4">
              Review WIOA funding steps
            </Link>
          </article>
        </div>
      </section>
    </main>
  );
}
