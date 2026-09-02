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
  type: 'video' | 'image';
  src?: string;
  mobileSrc?: string;
  alt: string;
  label: string;
  description: string;
  toneClass: string;
}

interface DynamicHomeHeroAsset {
  publicUrl: string;
  transcript?: string;
}

const HOME_MEDIA_REVISION = process.env.NEXT_PUBLIC_GIT_SHA?.slice(0, 12) || 'home-hero';
const HOME_FIRST_FRAME = '/images/heroes/hero-home-first-frame.webp';
const HOME_SLIDE_SECONDS = 14;

const HOME_NARRATION =
  'Welcome to Elevate for Humanity, where career training, registered apprenticeships, workforce support, and technology come together in one connected platform. Whether you want to begin a new career, earn while you learn, grow your business, host an apprentice, or build and manage training online, Elevate can help you take the next step. Explore hands-on pathways in healthcare, skilled trades, transportation, barbering, beauty, business, and technology. Eligible participants can also learn about available workforce funding pathways and payment options before enrolling. Shop and salon owners can join at no cost as apprenticeship host sites, train new talent inside their businesses, receive program support from Elevate, and may qualify for eligible workforce incentives. Apprentices gain supervised experience, documented skills, and the opportunity to earn wages while completing their pathway. Elevate also provides online applications, learner and employer portals, course-building tools, website and app development, testing support, and workforce-management technology. Explore a program, apply for training, become a host site, or request a demonstration. Your next opportunity can start right here with Elevate for Humanity.';

function isApprovedHomeHeroAsset(publicUrl: string) {
  try {
    const url = new URL(publicUrl);
    const path = url.pathname.toLowerCase();
    return (
      url.protocol === 'https:' && !path.includes('/partners/') && !/razors[-_ ]?image/.test(path)
    );
  } catch {
    return false;
  }
}

function withMediaRevision(src?: string) {
  if (!src) return undefined;
  return `${src}${src.includes('?') ? '&' : '?'}v=${HOME_MEDIA_REVISION}`;
}

export default function HomeHeroVideo({ banner }: HomeHeroVideoProps) {
  const heroRef = useRef<HTMLElement | null>(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const [dynamicAsset, setDynamicAsset] = useState<DynamicHomeHeroAsset | null>(null);
  const resolvedVideoDesktop = dynamicAsset?.publicUrl || banner.videoSrcDesktop;
  const resolvedVideoMobile = dynamicAsset?.publicUrl || banner.videoSrcMobile;
  const slides = (
    [
      {
        type: 'image',
        src: '/images/partners/generations-hair/salon-service.webp',
        alt: 'A cosmetology apprentice training with professional supervision in a salon',
        label: 'Earn while you learn in a real host shop',
        description:
          'Build paid, supervised experience while completing a structured barbering or beauty apprenticeship pathway.',
        toneClass: 'brightness-[1.04] contrast-[1.03] saturate-[1.03] object-[center_38%]',
      },
      {
        type: 'image',
        src: '/images/hero/hero-hands-on-training.webp',
        alt: 'A learner building technical skills through hands-on training',
        label: 'Build practical skills through hands-on training',
        description:
          'Learn by doing with guided instruction designed around the skills employers expect on the job.',
        toneClass: 'brightness-[1.03] contrast-[1.03] saturate-[1.04]',
      },
      {
        type: 'image',
        src: '/images/pages/barber-apprentice-learning.webp',
        alt: 'A cosmetology apprentice providing a supervised service in a host salon',
        label: 'Learn inside an active apprenticeship host salon',
        description:
          'Apprentices can earn while they learn, complete supervised hours, and build experience with real clients.',
        toneClass: 'brightness-[1.04] contrast-[1.03] saturate-[1.02] object-center',
      },
      {
        type: 'image',
        src: '/images/pages/programs-cdl-hero.webp',
        alt: 'A commercial truck traveling on the highway during CDL training',
        label: 'Prepare for transportation and CDL careers',
        description:
          'Get permit preparation, safety instruction, and coordinated behind-the-wheel training for commercial driving careers.',
        toneClass: 'brightness-[1.28] contrast-[0.96] saturate-[1.04]',
      },
      {
        type: 'image',
        src: '/images/partners/generations-hair/stylist-at-work.webp',
        alt: 'A host salon professional demonstrating hands-on cosmetology work',
        label: 'Build skills alongside experienced professionals',
        description:
          'Host shops help apprentices grow while building a dependable talent pipeline inside the business.',
        toneClass: 'brightness-[1.04] contrast-[1.03] saturate-[1.02] object-center',
      },
      {
        type: 'image',
        src: '/images/pages/cdl-cab-interior.webp',
        alt: 'The driver controls inside a commercial vehicle training cab',
        label: 'Practice career skills in real working environments',
        description:
          'Training connects coursework to the equipment, routines, and responsibilities used in the workplace.',
        toneClass: 'brightness-[1.42] contrast-[0.94] saturate-[1.04]',
      },
      {
        type: 'image',
        src: '/images/hero/hero-beauty-wellness.webp',
        alt: 'A beauty and wellness professional delivering hands-on service',
        label: 'Train for careers in beauty and wellness',
        description:
          'Choose barbering, cosmetology, esthetics, or nail pathways with structured training and apprenticeship support.',
        toneClass: 'brightness-[1.04] contrast-[1.03] saturate-[1.03]',
      },
      {
        type: 'image',
        src: '/images/pages/healthcare-classroom.webp',
        alt: 'Healthcare students developing clinical skills in a bright classroom',
        label: 'Prepare for an in-demand healthcare career',
        description:
          'Build practical patient-care knowledge through guided instruction, skills practice, and credential preparation.',
        toneClass: 'brightness-[1.06] contrast-[1.02] saturate-[1.03] object-center',
      },
      {
        type: 'image',
        src: '/images/pages/hvac-technician.webp',
        alt: 'An HVAC technician working with professional equipment',
        label: 'Train for skilled work in heating and cooling',
        description:
          'Learn safety, diagnostics, installation, maintenance, and the service skills used by HVAC technicians.',
        toneClass: 'brightness-[1.06] contrast-[1.03] saturate-[1.03] object-center',
      },
      {
        type: 'image',
        src: '/images/pages/entrepreneurship.webp',
        alt: 'Business professionals collaborating around a table',
        label: 'Turn an idea into a stronger business',
        description:
          'Develop practical skills for organizing, marketing, operating, and growing a business or professional career.',
        toneClass: 'brightness-[1.05] contrast-[1.03] saturate-[1.03] object-center',
      },
      {
        type: 'video',
        src: withMediaRevision(resolvedVideoDesktop),
        mobileSrc: withMediaRevision(resolvedVideoMobile),
        alt: 'Elevate for Humanity career training and apprenticeship opportunities',
        label: 'One connected platform from interest to opportunity',
        description:
          'Explore training, apprenticeships, funding guidance, employer support, testing, and workforce technology in one place.',
        toneClass: 'brightness-[1.05] contrast-[1.04] saturate-[1.04] object-cover',
      },
    ] satisfies HomeHeroSlide[]
  ).filter((slide) => slide.type === 'image' || Boolean(slide.src || slide.mobileSrc));

  const [activeSlide, setActiveSlide] = useState(0);
  const [previousSlide, setPreviousSlide] = useState<HomeHeroSlide | null>(null);
  const [paused, setPaused] = useState(false);
  const transitionTimerRef = useRef<number | null>(null);
  const slide = slides[activeSlide] ?? slides[0];

  const transitionToSlide = useCallback(
    (index: number) => {
      setActiveSlide((current) => {
        const next = (index + slides.length) % slides.length;
        if (next === current) return current;

        setPreviousSlide(slides[current] ?? null);
        if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = window.setTimeout(() => {
          setPreviousSlide(null);
          transitionTimerRef.current = null;
        }, 1_050);
        return next;
      });
    },
    [slides],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2_500);

    void fetch('/api/public/home-hero', {
      cache: 'force-cache',
      credentials: 'omit',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<{ asset?: DynamicHomeHeroAsset | null }>;
      })
      .then((payload) => {
        if (payload?.asset?.publicUrl && isApprovedHomeHeroAsset(payload.asset.publicUrl)) {
          setDynamicAsset(payload.asset);
        }
      })
      .catch(() => undefined)
      .finally(() => window.clearTimeout(timeout));

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

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

  useEffect(
    () => () => {
      if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
    },
    [],
  );

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

        <div className="relative order-1 w-full overflow-hidden bg-slate-950 lg:order-2">
          {previousSlide ? (
            <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
              <HeroVideo
                mountedFrameImage={
                  previousSlide.type === 'video' ? HOME_FIRST_FRAME : previousSlide.src
                }
                analyticsName={banner.analyticsName}
                overlayMode="none"
                mediaFit="cover"
                mediaClassName={previousSlide.toneClass}
                showSoundControl={false}
                showTranscriptControl={false}
                heightClassName="h-[clamp(480px,72svh,760px)] lg:h-[clamp(400px,62vh,680px)]"
              />
            </div>
          ) : null}
          <div
            key={`${slide.type}-${slide.src || slide.mobileSrc || activeSlide}`}
            className="home-hero-slide-enter relative z-10"
          >
            <HeroVideo
              videoSrcDesktop={slide.type === 'video' ? slide.src : undefined}
              videoSrcMobile={slide.type === 'video' ? slide.mobileSrc : undefined}
              mountedFrameImage={slide.type === 'video' ? HOME_FIRST_FRAME : slide.src}
              transcript={dynamicAsset?.transcript || banner.transcript || HOME_NARRATION}
              showSoundControl={false}
              showTranscriptControl={false}
              analyticsName={banner.analyticsName}
              overlayMode="none"
              mediaFit="cover"
              mediaClassName={slide.toneClass}
              soundButtonVariant="prominent"
              heightClassName="h-[clamp(480px,72svh,760px)] lg:h-[clamp(400px,62vh,680px)]"
              deferVideoMs={slide.type === 'video' ? 100 : 0}
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 z-40 bg-gradient-to-t from-slate-950/65 via-slate-950/20 to-transparent px-6 pb-20 pt-20 text-white sm:px-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-200">
              Featured pathway
            </p>
            <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">{slide.label}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-100 sm:text-base">
              {slide.description}
            </p>
          </div>

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
      <style jsx>{`
        .home-hero-slide-enter {
          animation: home-hero-fade 1000ms cubic-bezier(0.22, 1, 0.36, 1) both;
          transform-origin: center;
        }
        @keyframes home-hero-fade {
          0% {
            opacity: 0;
            filter: saturate(0.92) brightness(0.9);
            transform: scale(1.025);
          }
          45% {
            opacity: 0.72;
          }
          100% {
            opacity: 1;
            filter: saturate(1) brightness(1);
            transform: scale(1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .home-hero-slide-enter {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
