import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, HeartPulse, Stethoscope } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Healthcare Training Programs | Elevate for Humanity',
  description:
    'Explore healthcare career training in nursing assistance, medical assisting, phlebotomy, patient care, pharmacy technology, and medical administration.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/healthcare' },
};

const PROGRAMS = [
  {
    title: 'Certified Nursing Assistant',
    description: 'Prepare for entry-level nursing support, resident care, safety, and certification requirements.',
    href: '/programs/cna',
  },
  {
    title: 'Medical Assistant',
    description: 'Build clinical and administrative skills for ambulatory healthcare environments.',
    href: '/programs/medical-assistant',
  },
  {
    title: 'Phlebotomy Technician',
    description: 'Learn specimen collection, infection control, patient identification, and workplace safety.',
    href: '/programs/phlebotomy-technician',
  },
  {
    title: 'Patient Care Technician',
    description: 'Develop practical patient-support skills for hospitals, clinics, and long-term care settings.',
    href: '/programs/patient-care-technician',
  },
  {
    title: 'Pharmacy Technician',
    description: 'Prepare for pharmacy operations, medication safety, inventory, and certification.',
    href: '/programs/pharmacy-technician',
  },
  {
    title: 'Medical Billing & Coding',
    description: 'Train in healthcare documentation, claims, coding fundamentals, and revenue-cycle support.',
    href: '/programs/medical-billing-coding',
  },
] as const;

export default function HealthcareProgramsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section
        className="border-b border-emerald-100 bg-emerald-950 text-white"
        data-scroll-narration
        data-narration="Explore Elevate healthcare training programs. Compare nursing assistance, medical assisting, phlebotomy, patient care, pharmacy technology, and medical administration pathways, then open the program that fits your career goal."
        data-narration-rate="0.95"
        data-narration-style="instructor"
      >
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
              Healthcare career training
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              Train for work that supports patients and healthcare teams.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-emerald-50">
              Explore hands-on and administrative healthcare pathways, certification preparation,
              funding guidance for eligible learners, and career-support services.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/apply/student?sector=healthcare"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-black text-emerald-950 hover:bg-emerald-400"
              >
                Apply for Healthcare Training <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/funding"
                className="inline-flex min-h-12 items-center rounded-xl border border-white/40 px-6 py-3 font-black text-white hover:bg-white/10"
              >
                Explore Funding
              </Link>
            </div>
          </div>
          <div className="relative min-h-[320px] overflow-hidden rounded-3xl border border-white/15 bg-emerald-900 shadow-2xl sm:min-h-[430px]">
            <Image
              src="/images/beauty/esthetics-hero.webp"
              alt="Healthcare students practicing clinical skills in a supervised classroom"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              Choose a pathway
            </p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">Healthcare programs</h2>
            <p className="mt-3 leading-7 text-slate-700">
              Open a program to review its schedule, requirements, credential pathway, price,
              funding options, and application steps.
            </p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {PROGRAMS.map((program, index) => (
              <article key={program.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  {index % 3 === 0 ? <HeartPulse className="h-5 w-5" /> : index % 3 === 1 ? <Stethoscope className="h-5 w-5" /> : <BadgeCheck className="h-5 w-5" />}
                </div>
                <h3 className="mt-4 text-xl font-black">{program.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{program.description}</p>
                <Link href={program.href} className="mt-5 inline-flex items-center gap-2 font-black text-emerald-800 hover:underline">
                  View program <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
