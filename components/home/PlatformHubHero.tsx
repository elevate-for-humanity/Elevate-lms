import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, BriefcaseBusiness, GraduationCap } from 'lucide-react';

const PROOF = [
  { icon: GraduationCap, label: 'Hands-on training' },
  { icon: BriefcaseBusiness, label: 'Employer-connected pathways' },
  { icon: BadgeCheck, label: 'Funding guidance' },
] as const;

export function PlatformHubHero() {
  return (
    <section className="border-b border-slate-200 bg-white" aria-labelledby="home-hero-heading">
      <div className="mx-auto grid max-w-[1440px] lg:min-h-[calc(100svh-60px)] lg:grid-cols-[0.92fr_1.08fr]">
        <div className="flex items-center px-5 py-10 sm:px-8 sm:py-14 lg:px-14">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-red-700">
              Career training in Indiana
            </p>
            <h1 id="home-hero-heading" className="mt-4 text-4xl font-black leading-[1.03] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Build skills that move your career forward.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-700">
              Explore practical training, registered apprenticeships, and employer-connected
              pathways. Choose a direction and see the cost, schedule, and next step online.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/programs" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-700 px-6 py-3 font-black text-white hover:bg-brand-red-800">
                Explore Programs <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link href="/check-eligibility" className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-900 px-6 py-3 font-black text-slate-950 hover:bg-slate-50">
                Check My Options
              </Link>
            </div>
            <div className="mt-8 grid gap-3 border-t border-slate-200 pt-6 sm:grid-cols-3">
              {PROOF.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Icon className="h-5 w-5 shrink-0 text-brand-red-700" aria-hidden="true" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="relative min-h-[560px] overflow-hidden bg-slate-100 lg:min-h-[calc(100svh-60px)]">
          <Image
            src="/images/beauty/program-beauty-training.webp"
            alt="Learners receiving hands-on career training in a professional classroom"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover object-center"
          />
        </div>
      </div>
    </section>
  );
}
