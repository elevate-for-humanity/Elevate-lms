import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, GraduationCap, Network, ShieldCheck } from 'lucide-react';

const HUB_FEATURES = [
  { icon: GraduationCap, label: 'Career training and credentials' },
  { icon: BriefcaseBusiness, label: 'Apprenticeships and employers' },
  { icon: ShieldCheck, label: 'Funding and compliance support' },
];

export function PlatformHubHero() {
  return (
    <section className="relative isolate overflow-hidden bg-slate-950 text-white">
      <Image
        src="/images/pages/comp-home-hero.webp"
        alt="Elevate for Humanity learners and workforce partners"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-35"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/45" />
      <div className="relative mx-auto flex min-h-[560px] max-w-7xl items-center px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-sky-200">
            <Network className="h-4 w-4" aria-hidden="true" />
            One connected education and workforce hub
          </div>
          <h1 className="mt-6 text-4xl font-black leading-[1.03] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            Everything you need to move from training to opportunity.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200 sm:text-xl">
            Elevate brings career exploration, training, apprenticeships, funding guidance,
            credentials, employer connections, and secure learner and partner portals together in
            one hub.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/programs" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-6 py-3.5 font-extrabold text-white shadow-lg transition hover:bg-brand-red-700">
              Explore Programs <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link href="/apply" className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-white/70 bg-slate-900/30 px-6 py-3.5 font-extrabold text-white backdrop-blur transition hover:bg-slate-100 hover:text-slate-950">
              Start Your Application
            </Link>
          </div>
          <div className="mt-9 grid gap-3 sm:grid-cols-3">
            {HUB_FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-white/15 bg-slate-950/55 px-4 py-3 text-sm font-bold backdrop-blur">
                <Icon className="h-5 w-5 shrink-0 text-sky-300" aria-hidden="true" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
