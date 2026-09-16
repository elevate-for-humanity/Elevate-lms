import Link from 'next/link';
import { ArrowRight, BadgeCheck, BriefcaseBusiness, GraduationCap, Store } from 'lucide-react';
import { SafeHeroVideo } from '@/components/hero/SafeHeroVideo';

const HOME_VIDEO =
  'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/hero-home-fast.mp4';

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
        <div className="order-1 flex items-center px-5 py-10 sm:px-8 sm:py-14 lg:px-14 lg:py-16">
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
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <Link href="/programs" className="group rounded-2xl bg-brand-red-700 p-4 text-white no-underline hover:bg-brand-red-800 hover:no-underline">
                <GraduationCap className="h-6 w-6" aria-hidden="true" />
                <span className="mt-3 block font-black">I want career training</span>
                <span className="mt-1 block text-sm font-semibold text-white/85">Compare programs and apply.</span>
              </Link>
              <Link href="/partners/host-shops" className="group rounded-2xl border-2 border-slate-900 bg-white p-4 text-slate-950 no-underline hover:bg-slate-50 hover:no-underline">
                <Store className="h-6 w-6" aria-hidden="true" />
                <span className="mt-3 block font-black">I am a Host Shop</span>
                <span className="mt-1 block text-sm font-semibold text-slate-600">Employ and train apprentices.</span>
              </Link>
              <Link href="/program-holder/apply" className="group rounded-2xl border-2 border-slate-900 bg-white p-4 text-slate-950 no-underline hover:bg-slate-50 hover:no-underline">
                <BriefcaseBusiness className="h-6 w-6" aria-hidden="true" />
                <span className="mt-3 block font-black">I run a program</span>
                <span className="mt-1 block text-sm font-semibold text-slate-600">Use Elevate to deliver it.</span>
              </Link>
            </div>
            <Link href="/check-eligibility" className="mt-4 inline-flex items-center gap-2 font-black text-brand-blue-800 no-underline hover:no-underline">
              Not sure where to start? Check your options <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
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
        <div className="relative order-2 min-h-[clamp(340px,58svh,560px)] overflow-hidden bg-slate-950 lg:min-h-[720px]">
          <SafeHeroVideo
            src={HOME_VIDEO}
            poster="/images/beauty/program-beauty-training.webp"
            showPosterBeforePlayback
            loop
            ariaLabel="Elevate career training and workforce platform in action"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-gradient-to-t from-slate-950/35 to-transparent" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
