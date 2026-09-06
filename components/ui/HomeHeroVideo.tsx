'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, CreditCard, Store } from 'lucide-react';
import HeroVideo from '@/components/marketing/HeroVideo';

export interface HeroBanner {
  pageKey: string;
  videoSrcDesktop?: string;
  videoSrcMobile?: string;
  posterImage?: string;
  voiceoverSrc?: string;
  microLabel?: string;
  eyebrow?: string;
  belowHeroHeadline: string;
  belowHeroSubheadline: string;
  primaryCta: { label: string; href: string; variant?: 'primary' | 'secondary' };
  secondaryCta?: { label: string; href: string; variant?: 'primary' | 'secondary' };
  trustIndicators?: string[];
  transcript?: string;
  analyticsName: string;
}

export interface HomeHeroVideoProps {
  banner: HeroBanner;
}

interface HomeHeroSlide {
  type: 'image';
  src: string;
  alt: string;
  label: string;
  description: string;
  exposureClass: string;
  focalClass: string;
}

const HOME_SLIDE_SECONDS = 6;
const SALON_EDITORIAL_GRADE = 'contrast-[1.05] saturate-[1.06] sepia-[0.04]';
const DEPLOYED_COMMIT_SHA = process.env.NEXT_PUBLIC_GIT_SHA?.trim();

function revisionedHeroAsset(src: string): string {
  if (!DEPLOYED_COMMIT_SHA) return src;
  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}v=${encodeURIComponent(DEPLOYED_COMMIT_SHA)}`;
}
const HOME_NARRATION =
  'Welcome to Elevate for Humanity. Ready to build a career you can be proud of? Explore hands-on training and earn-while-you-learn apprenticeship pathways connected to local professionals. You will learn by doing. You will build real confidence. And you will have a clear next step toward your future. Choose the path that fits you, and let’s get started.';
const HOME_SLIDES: HomeHeroSlide[] = [
  {
    type: 'image',
    src: '/images/partners/kountry-kutz/interior-empty.webp',
    alt: 'Kountry Kutz Barbershop interior prepared for clients and apprentice training',
    label: 'Train inside a working local barbershop',
    description:
      'Build barbering skills at professional stations inside a participating apprenticeship host shop.',
    exposureClass: 'brightness-[1.06]',
    focalClass: 'object-center',
  },
  {
    type: 'image',
    src: '/images/partners/kountry-kutz/interior-active.webp',
    alt: 'Barbers serving clients inside Kountry Kutz Barbershop',
    label: 'Learn in the rhythm of a real shop',
    description:
      'Experience supervised workplace learning, client service, and professional shop routines.',
    exposureClass: 'brightness-[1.06]',
    focalClass: 'object-center',
  },
  {
    type: 'image',
    src: '/images/partners/salon-saloon/team-interior.webp',
    alt: 'Salon Saloon team inside their participating apprenticeship salon',
    label: 'Train with working professionals in a real salon',
    description:
      'Explore structured apprenticeships connected to participating local shops, experienced professionals, and supervised workplace learning.',
    exposureClass: 'brightness-[1.12]',
    focalClass: 'object-center',
  },
  {
    type: 'image',
    src: '/images/partners/salon-saloon/team-studio.webp',
    alt: 'Salon Saloon professionals gathered inside their modern studio',
    label: 'Grow with a professional salon team',
    description:
      'Train in a polished workplace where apprentices learn service, teamwork, and professional standards.',
    exposureClass: 'brightness-[1.11]',
    focalClass: 'object-[center_48%]',
  },
  {
    type: 'image',
    src: '/images/partners/generations-hair/premium-curls.jpg',
    alt: 'Dimensional curls created by Generations Hair Co',
    label: 'See the professional standard apprentices work toward',
    description:
      'Develop technique, consistency, and confidence through structured training in a real salon environment.',
    exposureClass: 'brightness-[1.10]',
    focalClass: 'object-[center_42%]',
  },
  {
    type: 'image',
    src: '/images/partners/generations-hair/premium-stylist-at-work.jpg',
    alt: 'Generations Hair Co stylist working with a client',
    label: 'Learn beside working beauty professionals',
    description:
      'Connect theory with supervised client service, workplace routines, and professional expectations.',
    exposureClass: 'brightness-[1.12]',
    focalClass: 'object-center',
  },
  {
    type: 'image',
    src: '/images/partners/generations-hair/stylist-at-work.webp',
    alt: 'Generations Hair Co professional stylist reflected in a salon mirror',
    label: 'Practice inside a polished workplace',
    description:
      'Build confidence through supervised service, professional routines, and direct workplace experience.',
    exposureClass: 'brightness-[1.11]',
    focalClass: 'object-[center_42%]',
  },
  {
    type: 'image',
    src: '/images/partners/salon-saloon/team-sign.webp',
    alt: 'Salon Saloon professional team gathered inside their modern salon',
    label: 'Join a polished professional salon community',
    description:
      'Build your career alongside a polished salon team with workplace guidance and measurable progress.',
    exposureClass: 'brightness-[1.10]',
    focalClass: 'object-center',
  },
];

export default function HomeHeroVideo({ banner }: HomeHeroVideoProps) {
  const heroRef = useRef<HTMLElement | null>(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const slides = HOME_SLIDES;

  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = slides[activeSlide] ?? slides[0];

  const transitionToSlide = useCallback(
    (index: number) => {
      setActiveSlide((current) => {
        const next = (index + slides.length) % slides.length;
        if (next === current) return current;

        return next;
      });
    },
    [slides],
  );

  useEffect(() => {
    const element = heroRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting && entry.intersectionRatio >= 0.35),
      { threshold: [0, 0.35, 0.7] },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const selectSlide = useCallback((index: number) => transitionToSlide(index), [transitionToSlide]);

  useEffect(() => {
    if (paused || !heroVisible || slides.length < 2) return;
    const timer = window.setInterval(
      () => transitionToSlide(activeSlide + 1),
      HOME_SLIDE_SECONDS * 1000,
    );
    return () => window.clearInterval(timer);
  }, [activeSlide, heroVisible, paused, slides.length, transitionToSlide]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) setPaused(true);
  }, []);

  if (!slide) return null;

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden border-b border-slate-200 bg-white"
      role="region"
      aria-roledescription="carousel"
      aria-label="Elevate for Humanity homepage highlights"
      data-scroll-narration
      data-narration={HOME_NARRATION}
    >
      <div className="mx-auto grid max-w-7xl items-center gap-8 py-0 sm:py-10 lg:grid-cols-[0.84fr_1.16fr] lg:gap-12 lg:px-8 lg:py-12">
        <div className="relative z-20 order-2 px-4 pb-10 sm:px-6 sm:pb-4 lg:order-1 lg:px-0">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.13em] text-blue-800">
            <BadgeCheck className="h-4 w-4" aria-hidden="true" />
            Career training built around your next step
          </div>
          <h1 className="max-w-2xl text-4xl font-black leading-[1.04] tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-6xl">
            Earn while you learn—or become a Host Shop for free.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-700 sm:text-xl">
            Apprentices earn wages and get hands-on training inside a participating shop. Salon,
            spa, nail studio, and barbershop owners can apply at no cost, train future staff, and
            earn revenue from supervised services performed in their business.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/barber-and-beauty-apprenticeships"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-6 py-3.5 text-base font-extrabold text-white shadow-lg shadow-red-900/15 transition hover:-translate-y-0.5 hover:bg-brand-red-700"
            >
              Explore Apprenticeships <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              href="/partners/host-shops"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-3.5 text-base font-extrabold text-slate-900 transition hover:-translate-y-0.5 hover:border-blue-500 hover:text-blue-700"
            >
              <Store className="h-5 w-5" aria-hidden="true" /> Participating Shops: Sign Up Free
            </Link>
          </div>
          <div className="mt-7 grid max-w-xl gap-3 text-sm font-bold text-slate-700 sm:grid-cols-3">
            <span className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-emerald-600" /> Apprentices earn wages
            </span>
            <span className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" /> Hands-on shop training
            </span>
            <span className="flex items-center gap-2">
              <Store className="h-5 w-5 text-orange-600" /> Host Shops join free
            </span>
          </div>
        </div>

        <div
          className="relative order-1 w-full overflow-hidden bg-[#f4f1ec] lg:order-2"
        >
          <HeroVideo
            demoSlides={slides.map((candidate) => ({
              src: revisionedHeroAsset(candidate.src),
              alt: candidate.alt,
              label: candidate.label,
              className: `${candidate.exposureClass} ${candidate.focalClass}`,
            }))}
            demoActiveSlideIndex={activeSlide}
            analyticsName={`${banner.analyticsName}-${activeSlide + 1}`}
            heightClassName="h-[clamp(480px,72svh,760px)] lg:h-[clamp(400px,62vh,680px)]"
            mediaClassName={SALON_EDITORIAL_GRADE}
            overlayMode="none"
            showSoundControl={false}
            showTranscriptControl={false}
          />
          {slides.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => selectSlide(activeSlide - 1)}
                aria-label="Show previous hero slide"
                className="absolute left-2 top-1/2 z-50 inline-flex h-12 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/55 text-white backdrop-blur transition hover:bg-slate-950/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span aria-hidden="true" className="text-4xl font-light leading-none">
                  ‹
                </span>
              </button>
              <button
                type="button"
                onClick={() => selectSlide(activeSlide + 1)}
                aria-label="Show next hero slide"
                className="absolute right-2 top-1/2 z-50 inline-flex h-12 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/55 text-white backdrop-blur transition hover:bg-slate-950/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span aria-hidden="true" className="text-4xl font-light leading-none">
                  ›
                </span>
              </button>

              <div className="absolute bottom-4 right-4 z-50 flex items-center gap-3 rounded-full border border-white/40 bg-slate-950/65 px-4 py-2 text-white shadow-lg backdrop-blur-md">
                <span
                  className="min-w-10 text-center text-xs font-black tracking-[0.12em]"
                  aria-hidden="true"
                >
                  {activeSlide + 1} / {slides.length}
                </span>
                <button
                  type="button"
                  onClick={() => setPaused((value) => !value)}
                  aria-label={paused ? 'Resume hero slideshow' : 'Pause hero slideshow'}
                  className="inline-flex h-10 w-10 min-h-0 min-w-0 touch-manipulation items-center justify-center rounded-full border border-white/60 bg-white/15 p-0 text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  style={{ minHeight: '2.5rem', minWidth: '2.5rem', padding: 0 }}
                >
                  <span aria-hidden="true" className="text-sm font-black leading-none">
                    {paused ? '▶' : 'Ⅱ'}
                  </span>
                </button>
              </div>

              <p className="sr-only" aria-live="polite">
                Slide {activeSlide + 1} of {slides.length}: {slide.label}
              </p>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
