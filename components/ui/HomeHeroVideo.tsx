'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
}

interface DynamicHomeHeroAsset {
  publicUrl: string;
  transcript?: string;
}

const HOME_MEDIA_REVISION = process.env.NEXT_PUBLIC_GIT_SHA?.slice(0, 12) || 'home-hero';
const HOME_FIRST_FRAME = '/images/heroes/hero-home-first-frame.webp';
const HOME_SLIDE_SECONDS = 3.5;

const HOME_NARRATION =
  'Welcome to Elevate for Humanity, where career training, registered apprenticeships, workforce support, and technology come together in one connected platform. Whether you want to begin a new career, earn while you learn, grow your business, host an apprentice, or build and manage training online, Elevate can help you take the next step. Explore hands-on pathways in healthcare, skilled trades, transportation, barbering, beauty, business, and technology. Eligible participants can also learn about available workforce funding pathways and payment options before enrolling. Shop and salon owners can join at no cost as apprenticeship host sites, train new talent inside their businesses, receive program support from Elevate, and may qualify for eligible workforce incentives. Apprentices gain supervised experience, documented skills, and the opportunity to earn wages while completing their pathway. Elevate also provides online applications, learner and employer portals, course-building tools, website and app development, testing support, and workforce-management technology. Explore a program, apply for training, become a host site, or request a demonstration. Your next opportunity can start right here with Elevate for Humanity.';

function withMediaRevision(src?: string) {
  if (!src) return undefined;
  return `${src}${src.includes('?') ? '&' : '?'}v=${HOME_MEDIA_REVISION}`;
}

export default function HomeHeroVideo({ banner }: HomeHeroVideoProps) {
  const [dynamicAsset, setDynamicAsset] = useState<DynamicHomeHeroAsset | null>(null);
  const resolvedVideoDesktop = dynamicAsset?.publicUrl || banner.videoSrcDesktop;
  const resolvedVideoMobile = dynamicAsset?.publicUrl || banner.videoSrcMobile;
  const slides = (
    [
      {
        type: 'video',
        src: withMediaRevision(resolvedVideoDesktop),
        mobileSrc: withMediaRevision(resolvedVideoMobile),
        alt: 'Elevate for Humanity career training and apprenticeship opportunities',
        label: 'Career training and apprenticeships',
      },
      {
        type: 'image',
        src: '/images/hero/hero-hands-on-training.webp',
        alt: 'A learner building technical skills through hands-on training',
        label: 'Build practical skills through hands-on training',
      },
      {
        type: 'image',
        src: '/images/partners/generations-hair/salon-service.webp',
        alt: 'A cosmetology apprentice providing a supervised service in a host salon',
        label: 'Learn inside an active apprenticeship host salon',
      },
      {
        type: 'image',
        src: '/images/pages/programs-cdl-hero.webp',
        alt: 'A commercial truck traveling on the highway during CDL training',
        label: 'Prepare for transportation and CDL careers',
      },
      {
        type: 'image',
        src: '/images/partners/generations-hair/stylist-at-work.webp',
        alt: 'A host salon professional demonstrating hands-on cosmetology work',
        label: 'Build skills alongside experienced professionals',
      },
      {
        type: 'image',
        src: '/images/pages/cdl-cab-interior.webp',
        alt: 'The driver controls inside a commercial vehicle training cab',
        label: 'Practice career skills in real working environments',
      },
      {
        type: 'image',
        src: '/images/hero/hero-beauty-wellness.webp',
        alt: 'A beauty and wellness professional delivering hands-on service',
        label: 'Train for careers in beauty and wellness',
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
        if (payload?.asset?.publicUrl?.startsWith('https://')) {
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

  const selectSlide = useCallback(
    (index: number) => transitionToSlide(index),
    [transitionToSlide],
  );

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = window.setInterval(
      () => transitionToSlide(activeSlide + 1),
      HOME_SLIDE_SECONDS * 1000,
    );
    return () => window.clearInterval(timer);
  }, [activeSlide, paused, slides.length, transitionToSlide]);

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
    <div
      className="relative"
      data-scroll-narration
      data-narration={dynamicAsset?.transcript || banner.transcript || HOME_NARRATION}
      role="region"
      aria-roledescription="carousel"
      aria-label="Elevate for Humanity homepage highlights"
    >
      <div className="relative overflow-hidden bg-slate-950">
        {previousSlide ? (
          <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
            <HeroVideo
              mountedFrameImage={
                previousSlide.type === 'video' ? HOME_FIRST_FRAME : previousSlide.src
              }
              analyticsName={banner.analyticsName}
              overlayMode="none"
              showSoundControl={false}
              showTranscriptControl={false}
              heightClassName="h-[clamp(400px,62vh,680px)]"
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
          soundButtonVariant="prominent"
          heightClassName="h-[clamp(400px,62vh,680px)]"
          deferVideoMs={slide.type === 'video' ? 100 : 0}
          />
        </div>
      </div>

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => selectSlide(activeSlide - 1)}
            aria-label="Show previous hero slide"
            className="absolute left-1 top-1/2 z-50 inline-flex h-16 w-11 -translate-y-1/2 items-center justify-center text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)] transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span aria-hidden="true" className="text-4xl font-light leading-none">
              ‹
            </span>
          </button>
          <button
            type="button"
            onClick={() => selectSlide(activeSlide + 1)}
            aria-label="Show next hero slide"
            className="absolute right-1 top-1/2 z-50 inline-flex h-16 w-11 -translate-y-1/2 items-center justify-center text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)] transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span aria-hidden="true" className="text-4xl font-light leading-none">
              ›
            </span>
          </button>

          <div className="absolute bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/40 bg-slate-950/55 px-4 py-2 text-white shadow-lg backdrop-blur-md">
            <span className="min-w-10 text-center text-xs font-black tracking-[0.12em]" aria-hidden="true">
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
    </div>
  );
}
