import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Host Site Program | Elevate for Humanity',
  description:
    'Become an approved apprenticeship Host Site for Barber, Cosmetology, Esthetics, or Nail Technician training.',
};

const PROGRAMS = [
  {
    name: 'Barber Apprenticeship',
    detail: '2,000-hour registered apprenticeship pathway',
    image: '/images/pages/barber-training.webp',
    program: 'barber',
  },
  {
    name: 'Cosmetology Apprenticeship',
    detail: 'Licensed salon-based apprenticeship pathway',
    image: '/images/pages/cosmetology.webp',
    program: 'cosmetology',
  },
  {
    name: 'Esthetics Apprenticeship',
    detail: 'Licensed spa/esthetics worksite pathway',
    image: '/images/beauty/esthetics-hero.webp',
    program: 'esthetician',
  },
  {
    name: 'Nail Technician Apprenticeship',
    detail: 'Licensed nail-salon apprenticeship pathway',
    image: '/images/pages/nail-technician.webp',
    program: 'nail',
  },
] as const;

const REQUIREMENTS = [
  'Current business/shop or establishment license appropriate to the occupation.',
  'A currently licensed supervising professional who can oversee training and verify OJL hours and competencies.',
  'Commercial/general liability insurance and workers’ compensation coverage or a valid exemption.',
  'Adequate chairs/workstations, equipment, client/service volume, and a safe training environment.',
  'EIN verification or W-9 and any applicable local business or occupancy documentation.',
  'Agreement to use Elevate’s hour, competency, document, and compliance verification workflows.',
];

export default function HostShopsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative h-[clamp(240px,42vw,520px)] overflow-hidden bg-slate-100">
        <Image
          src="/images/pages/admin-employers-hero.webp"
          alt="Licensed employer mentoring a workforce trainee at an approved worksite"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </section>

      <section className="border-b border-slate-200 bg-white py-9">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-sm font-black uppercase tracking-[0.15em] text-brand-red-700">
            Apprenticeship employer partnership
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            Become an approved apprenticeship Host Site
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">
            Licensed businesses can partner with Elevate to provide supervised on-the-job learning
            while the apprentice completes structured RTI, hour tracking, competency verification,
            and required compliance documentation.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/partners/host-shop/apply"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-red-600 px-6 py-3 font-black text-white hover:bg-brand-red-700"
            >
              Start Host Site Application
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-950 hover:bg-slate-50"
            >
              Ask a Partnership Question
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-black">Beauty apprenticeship Host Site pathways</h2>
            <p className="mt-3 text-base leading-7 text-slate-700">
              Choose the occupation that matches the business license, supervising professional,
              and worksite where the apprentice will train.
            </p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {PROGRAMS.map((program) => (
              <article key={program.program} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="relative aspect-[4/3] bg-slate-100">
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
                  <p className="mt-2 text-sm leading-6 text-slate-700">{program.detail}</p>
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

      <section className="py-12">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="relative min-h-[340px] overflow-hidden rounded-2xl bg-slate-100">
            <Image
              src="/images/pages/apprenticeship-structure.webp"
              alt="Structured apprenticeship training and supervision"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="text-3xl font-black">Host Site approval requirements</h2>
            <p className="mt-3 text-base leading-7 text-slate-700">
              Approval is based on the actual worksite and occupation. Submitting an application does
              not authorize a shop to begin hosting apprentices until the required records are verified.
            </p>
            <ul className="mt-6 space-y-3">
              {REQUIREMENTS.map((requirement) => (
                <li key={requirement} className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-800">
                  {requirement}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-950 py-10 text-white">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-3xl font-black">Ready to submit your worksite for review?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-200">
            The application uploads licensing, insurance, workers’ compensation, supervisor, and
            EIN/W-9 documentation directly to the private documents system.
          </p>
          <Link
            href="/partners/host-shop/apply"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-red-600 px-7 py-3 font-black text-white hover:bg-brand-red-700"
          >
            Start Host Site Application
          </Link>
        </div>
      </section>
    </main>
  );
}
