import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Briefcase, CheckCircle, GraduationCap, Phone, ShieldCheck } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { organization } from '@/lib/config/organization';

export const metadata: Metadata = {
  title: 'Job Ready Indy,
  description:
    'Elevate for Humanity is an approved Job Ready Indy provider supporting employability skills, workforce readiness, and connections to eligible career training and funding resources in Indianapolis.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/jri' },
};

const skills = [
  'Communication',
  'Professionalism',
  'Self-management',
  'Workplace skills',
  'Career readiness',
  'Employer expectations',
];

const nextSteps = [
  {
    title: 'Complete Job Ready Indy skills',
    description:
      'Participants complete employability-skill activities and workforce-readiness requirements through the approved Job Ready Indy pathway.',
    icon: CheckCircle,
  },
  {
    title: 'Review career pathways',
    description:
      'Elevate helps participants identify training options in healthcare, skilled trades, transportation, technology, business, and registered apprenticeship.',
    icon: GraduationCap,
  },
  {
    title: 'Review funding separately',
    description:
      'Occupational training funding is determined separately through the applicable workforce program, agency, eligibility rules, authorization, and available funding.',
    icon: ShieldCheck,
  },
  {
    title: 'Prepare for employment',
    description:
      'Career services can include resume preparation, interview practice, employer introductions, and other workforce-readiness support.',
    icon: Briefcase,
  },
];

export default function JRIPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Breadcrumbs items={[{ label: 'Workforce Services', href: '/funding' }, { label: 'Job Ready Indy' }]} />
        </div>
      </div>

      <section className="relative min-h-[300px] overflow-hidden bg-slate-950 text-white">
        <Image
          src="/images/programs/workforce-readiness-hero.webp"
          alt="Workforce readiness training"
          fill
          className="object-cover opacity-35"
          priority
          sizes="100vw"
        />
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-bold text-emerald-200 ring-1 ring-emerald-400/30">
              Approved Job Ready Indy Provider
            </span>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
              Job Ready Indy at Elevate for Humanity
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-200">
              Elevate for Humanity supports Job Ready Indy employability-skill development and workforce readiness. Job Ready Indy participation and occupational training funding are separate determinations.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="text-3xl font-black text-slate-950">What Job Ready Indy provides</h2>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              Job Ready Indy focuses on the employability skills people need to enter and succeed in the workplace. Elevate uses the approved pathway to strengthen workforce readiness and connect participants with appropriate next steps.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {skills.map((skill) => (
                <div key={skill} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <CheckCircle className="h-5 w-5 flex-none text-emerald-700" />
                  <span className="font-semibold text-slate-900">{skill}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-xl font-black text-slate-950">Funding clarification</h2>
            <p className="mt-3 leading-7 text-slate-700">
              Job Ready Indy approval does not mean every occupational program is automatically funded. Tuition and supportive-service funding may come from WIOA, Workforce Ready Grant, employer sponsorship, or another authorized source depending on the participant and program.
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Eligibility, authorization, covered costs, program availability, and funding amounts are determined by the responsible agency or funding source and may change.
            </p>
          </aside>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-center text-3xl font-black text-slate-950">How Elevate supports the pathway</h2>
          <div className="mt-9 grid gap-5 md:grid-cols-2">
            {nextSteps.map(({ title, description, icon: Icon }) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <Icon className="h-7 w-7 text-brand-red-600" />
                <h3 className="mt-4 text-xl font-bold text-slate-950">{title}</h3>
                <p className="mt-2 leading-7 text-slate-700">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14">
        <h2 className="text-3xl font-black text-slate-950">Career training options</h2>
        <p className="mt-4 text-lg leading-8 text-slate-700">
          Elevate offers and coordinates multiple career-training pathways. Program eligibility, duration, credentials, funding status, and training locations vary by program. Use the program catalog for current information rather than assuming a program is funded through Job Ready Indy.
        </p>
        <Link href="/programs" className="mt-6 inline-flex items-center gap-2 font-bold text-brand-red-700 hover:underline">
          View current career programs <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-5xl px-6 py-14 text-center">
          <h2 className="text-3xl font-black">Need help choosing the right next step?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Elevate can review your career goal, current eligibility information, and available workforce pathways. Final eligibility and funding authorization remain with the responsible program or agency.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/apply" className="rounded-lg bg-brand-red-600 px-7 py-3 font-bold text-white hover:bg-brand-red-700">
              Start Application
            </Link>
            <a href={`tel:${organization.phone.replace(/\D/g, '')}`} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-7 py-3 font-bold text-white hover:bg-white/10">
              <Phone className="h-5 w-5" /> {organization.phone}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
