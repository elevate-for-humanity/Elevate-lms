import Link from 'next/link';
import { ArrowRight, BadgeCheck, BriefcaseBusiness, GraduationCap } from 'lucide-react';
import { SafeHeroVideo } from '@/components/hero/SafeHeroVideo';
const HOME_VIDEO = 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/hero-home-fast.mp4';

const PROOF = [
  { icon: GraduationCap, label: 'Hands-on training' },
  { icon: BriefcaseBusiness, label: 'Employer-connected pathways' },
  { icon: BadgeCheck, label: 'Funding guidance' },
] as const;

export function PlatformHubHero() {
  return (
    <section
      className="border-b border-slate-200 bg-white"
      aria-labelledby="home-hero-heading"
      data-scroll-narration
      data-narration-src="/audio/narration/home-hero.mp3"
      data-narration="Welcome to Elevate for Humanity. Explore practical career training, registered apprenticeships, and employer-connected pathways in Indiana. Choose a program, review possible funding, and take your next step online."
    >
      <div className="mx-auto grid max-w-[1440px] lg:min-h-[720px] lg:grid-cols-[0.92fr_1.08fr]">
        <div className="order-2 flex items-center px-5 py-10 sm:px-8 sm:py-14 lg:order-1 lg:px-14 lg:py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-red-700">
              Career training in Indiana
            </p>
            <h1 id="home-hero-heading" className="mt-4 text-4xl font-black leading-[1.03] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              One platform for training, apprenticeships, and workforce operations.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-700">
              Learn, operate programs, coordinate employers, document compliance, and move people
              from application to credential in one connected system.
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
        <div className="relative order-1 min-h-[clamp(340px,58svh,560px)] overflow-hidden bg-slate-950 lg:order-2 lg:min-h-[720px]">
          <SafeHeroVideo
            src={HOME_VIDEO}
            poster="/images/beauty/program-beauty-training.webp"
            ariaLabel="Elevate career training and workforce platform in action"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-gradient-to-t from-slate-950/35 to-transparent" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
