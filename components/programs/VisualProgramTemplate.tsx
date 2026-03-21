'use client';

import Link from 'next/link';
import Image from 'next/image';
import { getProgramImages } from '@/lib/program-images';
import type { Program } from '@/app/data/programs';
import { ProgramTutorCTA } from '@/components/ProgramTutorCTA';
import { PROGRAMS } from '@/lib/ai/programRegistry';
import HeroVideo from '@/components/marketing/HeroVideo';
import { Check, Clock, Award, DollarSign, MapPin, ArrowRight } from 'lucide-react';

interface VisualProgramTemplateProps {
  program: Program;
  slug: string;
}

const APPRENTICESHIP_SLUGS = [
  'barber', 'barber-apprenticeship', 'cosmetology-apprenticeship',
  'esthetician-apprenticeship', 'nail-technician-apprenticeship',
];

const PROGRAM_HERO_MEDIA: Record<string, {
  video: string;
  videoMobile?: string;
  audio?: string;
  poster: string;
  microLabel: string;
  script: string;
}> = {
  'hvac-technician': {
    video: '/videos/hvac-hero-final.mp4',
    audio: '/audio/heroes/skilled-trades.mp3',
    poster: '/images/pages/hvac-hero.jpg',
    microLabel: 'HVAC Technician',
    script: `HVAC Technicians are in demand across Indiana — and the shortage is growing. The Elevate HVAC Technician program runs 12 weeks and prepares you for EPA Section 608 certification, OSHA 10-Hour, and entry-level employment at $18 to $28 per hour. You train on real equipment. You leave with a nationally recognized credential. Most students qualify for full funding through WIOA or the Workforce Ready Grant. Apply today.`,
  },
  'barber-apprenticeship': {
    video: '/videos/barber-hero-final.mp4',
    videoMobile: '/videos/barber-hero.mp4',
    audio: '/audio/heroes/barber.mp3',
    poster: '/images/pages/barber-hero-main.jpg',
    microLabel: 'Barber Apprenticeship',
    script: `Barbering is one of the fastest paths to a licensed, self-employed career in Indiana. The Elevate Barber Apprenticeship is a 52-week DOL Registered Apprenticeship — you work in a licensed shop, earn a wage from day one, and graduate with your Indiana Barber License. No classroom-only training. No unpaid hours. Most apprentices are fully funded through WIOA or the Indiana Workforce Ready Grant. Apply today.`,
  },
  'cosmetology-apprenticeship': {
    video: '/videos/cosmetology-salon.mp4',
    audio: '/audio/heroes/cosmetology.mp3',
    poster: '/images/pages/cosmetology-hero.jpg',
    microLabel: 'Cosmetology Apprenticeship',
    script: `The Elevate Cosmetology Apprenticeship puts you in a licensed salon from week one. You earn a wage while completing your 1,500 required hours toward your Indiana Cosmetology License. Most apprentices qualify for full funding through WIOA or the Workforce Ready Grant. Apply today.`,
  },
  'nail-technician-apprenticeship': {
    video: '/videos/nail-tech.mp4',
    audio: '/audio/heroes/nail-tech.mp3',
    poster: '/images/pages/nail-tech-hero.jpg',
    microLabel: 'Nail Tech Apprenticeship',
    script: `The Nail Technician Apprenticeship at Elevate is a paid, hands-on program in a licensed salon. Complete your required hours, earn your Indiana Nail Technician License, and build a client base — all at the same time. Funding available through WIOA. Apply today.`,
  },
  'cna-cert': {
    video: '/videos/healthcare-cna.mp4',
    audio: '/audio/heroes/cna.mp3',
    poster: '/images/pages/cna-hero.jpg',
    microLabel: 'CNA Training',
    script: `Certified Nursing Assistants are the backbone of patient care in Indiana. The Elevate CNA program runs 6 weeks — classroom instruction plus hands-on clinical practice — and ends with your Indiana CNA certification exam on-site. Starting wages range from $16 to $22 per hour. Most students qualify for full funding. Apply today.`,
  },
  'cdl-training': {
    video: '/videos/cdl-hero.mp4',
    audio: '/audio/heroes/cdl.mp3',
    poster: '/images/pages/cdl-hero.jpg',
    microLabel: 'CDL Class A',
    script: `CDL drivers are needed everywhere — and Indiana employers are hiring now. The Elevate CDL Class A program runs 4 weeks and prepares you for your commercial driver license skills test. Starting wages range from $22 to $38 per hour. Most students qualify for full funding through WIOA. Apply today.`,
  },
  'tax-prep': {
    video: '/videos/tax-career-paths.mp4',
    audio: '/audio/heroes/tax.mp3',
    poster: '/images/pages/tax-hero.jpg',
    microLabel: 'Tax Preparation',
    script: `Tax preparation is a year-round career. The Elevate Tax Preparation program runs 8 weeks and prepares you for the IRS Annual Filing Season Program. Starting wages from $18 to $35 per hour. Funding available through WIOA. Apply today.`,
  },
  'peer-recovery-specialist': {
    video: '/videos/healthcare-cna.mp4',
    audio: '/audio/heroes/healthcare.mp3',
    poster: '/images/pages/healthcare-hero.jpg',
    microLabel: 'Peer Recovery Specialist',
    script: `Peer Recovery Specialists help others navigate addiction recovery using their own lived experience. The Elevate PRS program prepares you for Indiana state certification. Starting wages from $16 to $24 per hour. Funding available through WIOA and JRI. Apply today.`,
  },
};

const DEFAULT_MEDIA = {
  video: '/videos/programs-overview-video-with-narration.mp4',
  audio: '/audio/heroes/programs.mp3',
  poster: '/images/pages/programs-hero.jpg',
  microLabel: 'Career Training',
  script: `Elevate for Humanity offers short-term career training programs in healthcare, skilled trades, technology, and business. Most programs run 4 to 16 weeks. Funding is available for eligible Indiana residents. Every program ends with a nationally recognized credential and direct employer introductions. Apply today.`,
};

export function VisualProgramTemplate({ program, slug }: VisualProgramTemplateProps) {
  const images = getProgramImages(slug);
  const media  = PROGRAM_HERO_MEDIA[slug] ?? DEFAULT_MEDIA;

  const isApprenticeship = APPRENTICESHIP_SLUGS.includes(slug) ||
    program.name?.toLowerCase().includes('apprenticeship') ||
    program.category?.toLowerCase().includes('apprenticeship');

  const applyHref = program.ctaPrimary?.href  ?? `/apply?program=${slug}`;
  const infoHref  = program.ctaSecondary?.href ?? `/contact?program=${slug}`;

  return (
    <main className="bg-white">

      {/* HERO VIDEO */}
      <HeroVideo
        videoSrcDesktop={media.video}
        videoSrcMobile={media.videoMobile ?? media.video}
        posterImage={media.poster}
        voiceoverSrc={media.audio}
        microLabel={media.microLabel}
        transcript={media.script}
        analyticsName={slug}
        belowHeroHeadline={program.heroTitle ?? program.name}
        belowHeroSubheadline={program.shortDescription}
        ctas={[
          { label: 'Apply Now',           href: applyHref },
          { label: 'Request Information', href: infoHref, variant: 'secondary' },
        ]}
        trustIndicators={[
          program.duration   ?? '4–16 weeks',
          program.credential ?? 'Industry credential',
          'WIOA funding available',
          'Job placement included',
        ]}
      />

      {/* TRUST BAR */}
      <section className="bg-slate-900 py-4">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {[
              { icon: Clock,      text: program.duration   ?? '4–16 weeks'          },
              { icon: Award,      text: program.credential ?? 'Industry credential' },
              { icon: DollarSign, text: 'Funding available'                         },
              { icon: MapPin,     text: 'Indianapolis, IN'                          },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                <Icon className="w-4 h-4 text-brand-red-400 flex-shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PHOTO GRID */}
      <section className="py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-2">Program at a glance</h2>
          <p className="text-slate-500 text-center mb-10 max-w-xl mx-auto">Real training. Real credentials. Real jobs.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { img: images.snapshot.jobOutcome,    label: 'Career Outcome', sub: program.credential ?? 'Industry credential'   },
              { img: images.snapshot.programLength, label: 'Program Length', sub: program.duration   ?? 'Flexible schedule'     },
              { img: images.snapshot.credential,    label: 'Credential',     sub: program.credential ?? 'Nationally recognized' },
              { img: images.snapshot.support,       label: 'Career Support', sub: 'Job placement included'                      },
            ].map((card, i) => (
              <div key={i} className="group rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                <div className="relative aspect-[4/3]">
                  <Image src={card.img} alt={card.label} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-bold text-sm leading-tight">{card.label}</p>
                    <p className="text-slate-300 text-xs mt-0.5 leading-tight">{card.sub}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT YOU'LL LEARN */}
      {program.whatYouLearn?.length > 0 && (
        <section className="py-14 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-2">What you'll learn</h2>
            <p className="text-slate-500 text-center mb-10 max-w-xl mx-auto">Skills employers are hiring for right now.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {program.whatYouLearn.slice(0, 6).map((item: string, i: number) => (
                <div key={i} className="relative aspect-[4/3] rounded-2xl overflow-hidden group">
                  <Image src={images.tiles[i % images.tiles.length]} alt={item} fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 flex items-start gap-2">
                    <Check className="w-4 h-4 text-brand-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-white text-sm font-semibold leading-snug">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* OUTCOMES */}
      <section className="py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-3">Career Outcomes</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">Where this credential takes you</h2>
              <div className="space-y-3">
                {(program.outcomes ?? [
                  'Entry-level employment within 30 days of graduation',
                  'Nationally recognized credential',
                  'Career services and employer introductions',
                  'Wage progression pathway',
                ]).slice(0, 5).map((outcome: string, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-brand-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-brand-green-600" />
                    </div>
                    <p className="text-slate-700 text-sm">{outcome}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex gap-3 flex-wrap">
                <Link href={applyHref} className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-xl transition text-sm">
                  Apply Now <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href={infoHref} className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 font-semibold px-6 py-3 rounded-xl hover:bg-slate-50 transition text-sm">
                  Request Info
                </Link>
              </div>
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
              <Image src={images.bottomCta} alt="Career outcome" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* FUNDING */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-brand-blue-700 font-bold text-xs uppercase tracking-widest mb-3">Funding & Eligibility</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">Most students pay nothing out of pocket</h2>
          <p className="text-slate-600 max-w-xl mx-auto mb-8">Funding is available through WIOA, the Indiana Workforce Ready Grant, Job Ready Indy, and other state and federal workforce programs.</p>
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'WIOA Title I',          desc: 'Federal workforce funding for eligible adults and dislocated workers' },
              { label: 'Workforce Ready Grant', desc: 'Indiana state funding for high-demand career training programs'       },
              { label: 'Job Ready Indy',        desc: 'Marion County funding for Indianapolis residents'                    },
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-brand-blue-100 shadow-sm text-left">
                <p className="font-bold text-slate-900 text-sm mb-1">{f.label}</p>
                <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <Link href={applyHref} className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-8 py-4 rounded-xl transition">
            Check My Eligibility <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-slate-500 text-xs mt-3">Free to apply. No obligation. Results in 3–5 business days.</p>
        </div>
      </section>

      {/* 4-STEP PATH */}
      <section className="py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-2">Your path forward</h2>
          <p className="text-slate-500 text-center mb-10">Four steps from today to employed.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { img: images.steps.apply,       step: 1, label: 'Apply',       desc: 'Submit your application online in minutes'      },
              { img: images.steps.eligibility, step: 2, label: 'Eligibility', desc: 'WorkOne confirms your funding eligibility'      },
              { img: images.steps.training,    step: 3, label: 'Train',       desc: 'Complete your program and earn your credential' },
              { img: images.steps.career,      step: 4, label: 'Get Hired',   desc: 'Career services connects you with employers'    },
            ].map((s) => (
              <div key={s.step} className="relative aspect-square rounded-2xl overflow-hidden shadow-md">
                <Image src={s.img} alt={s.label} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute top-3 left-3 w-8 h-8 bg-brand-red-600 rounded-full flex items-center justify-center text-white font-extrabold text-sm shadow">
                  {s.step}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-bold text-sm">{s.label}</p>
                  <p className="text-slate-300 text-xs mt-0.5 leading-tight">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* APPRENTICESHIP UNLOCK STEPS */}
      {isApprenticeship && (
        <section className="py-14 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-extrabold text-slate-900 text-center mb-2">What unlocks after enrollment</h2>
              <p className="text-slate-500 text-center text-sm mb-6">Enrollment secures your spot. Training access unlocks after shop assignment and compliance approval.</p>
              <div className="space-y-3">
                {[
                  { step: '1',  label: 'Application submitted',             status: 'done'    },
                  { step: '2',  label: 'Funding confirmed or payment made', status: 'done'    },
                  { step: '⏳', label: 'Shop assignment',                   status: 'pending' },
                  { step: '⏳', label: 'Compliance approval',               status: 'pending' },
                  { step: '🔒', label: 'Training access unlocks',           status: 'locked'  },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      item.status === 'done'    ? 'bg-brand-green-100 text-brand-green-700' :
                      item.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                  'bg-slate-100 text-slate-400'
                    }`}>{item.step}</span>
                    <span className={`text-sm ${item.status === 'locked' ? 'text-slate-400' : 'text-slate-700'}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* BOTTOM CTA */}
      <section className="relative">
        <div className="relative h-[50vh] min-h-[320px] max-h-[500px] overflow-hidden">
          <Image src={images.bottomCta} alt="Start your career" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-slate-900/70" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
            <p className="text-brand-red-400 font-bold text-xs uppercase tracking-widest mb-3">Ready to start?</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 max-w-xl">Your first step is confirming eligibility.</h2>
            <p className="text-slate-300 mb-6 max-w-md text-sm">Free to apply. No obligation. Most students qualify for full funding.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href={applyHref} className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-extrabold px-8 py-4 rounded-xl transition text-sm shadow-lg">
                Apply Now — It's Free
              </Link>
              <Link href={infoHref} className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-8 py-4 rounded-xl transition text-sm">
                Request Information
              </Link>
            </div>
            {PROGRAMS[slug] && (
              <div className="mt-5">
                <ProgramTutorCTA programSlug={slug} programName={program.name ?? program.heroTitle ?? ''} applyHref={applyHref} />
              </div>
            )}
          </div>
        </div>
      </section>

    </main>
  );
}

export default VisualProgramTemplate;
