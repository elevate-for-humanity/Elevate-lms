import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SafeHeroVideo } from '@/components/hero/SafeHeroVideo';

const HOME_VIDEO =
  'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/hero-home-fast.mp4';

const HOME_NARRATION =
  "Welcome to Elevate for Humanity. You're in the right place to turn a career goal into a clear next step. If you want to earn while you learn, begin with our Barber and Cosmetology apprenticeship programs. You'll learn the skills, practice them with supervision at an approved Host Site, and track your progress along the way. Looking for career training instead? Explore HVAC, CDL, Bookkeeping, or Business. Training may be free if you qualify for workforce funding. Approval is not automatic, but we will show you what to do. When you reach Paying for Training, press the orange Schedule WorkOne Orientation button. Complete that appointment, then come back and press Start Elevate Funding Intake. Take your time as you explore. When you find the path that feels right, use the application link to get started.";

export function PlatformHubHero() {
  return (
    <section
      className="border-b border-slate-200 bg-white"
      aria-labelledby="home-hero-heading"
      data-scroll-narration
      data-narration={HOME_NARRATION}
      data-narration-rate="1"
      data-narration-style="assistant"
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
              Build skills that move your career forward. Explore career training and Barber and
              Cosmetology apprenticeship programs, or use the same connected system to operate a
              workforce program.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/programs" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-red-700 px-6 py-3 font-black text-white hover:bg-brand-red-800">Explore Programs <ArrowRight className="h-5 w-5" /></Link>
              <Link href="/barber-and-beauty-apprenticeships" className="inline-flex min-h-12 items-center rounded-xl border-2 border-slate-950 bg-white px-6 py-3 font-black text-slate-950 hover:bg-slate-50">Explore Apprenticeships</Link>
            </div>
            <Link href="/check-eligibility" className="mt-4 inline-flex items-center gap-2 font-black text-brand-blue-800 no-underline hover:no-underline">
              Not sure where to start? Check your options <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="relative order-2 min-h-[clamp(340px,58svh,560px)] overflow-hidden bg-slate-950 lg:min-h-[720px]">
          <SafeHeroVideo
            src={HOME_VIDEO}
            poster="/images/beauty/program-beauty-training.webp"
            showPosterBeforePlayback
            priority
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
