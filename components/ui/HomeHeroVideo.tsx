'use client';

import { useCallback, useEffect, useState } from 'react';
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

const HOME_MEDIA_REVISION = process.env.NEXT_PUBLIC_GIT_SHA?.slice(0, 12) || 'home-hero';
const HOME_FIRST_FRAME = '/images/heroes/hero-home-first-frame.webp';
const HOME_SLIDE_SECONDS = 5;

const HOME_NARRATION =
  'Welcome to Elevate for Humanity, where career training, registered apprenticeships, workforce support, and technology come together in one connected platform. Whether you want to begin a new career, earn while you learn, grow your business, host an apprentice, or build and manage training online, Elevate can help you take the next step. Explore hands-on pathways in healthcare, skilled trades, transportation, barbering, beauty, business, and technology. Eligible participants can also learn about available workforce funding pathways and payment options before enrolling. Shop and salon owners can join at no cost as apprenticeship host sites, train new talent inside their businesses, receive program support from Elevate, and may qualify for eligible workforce incentives. Apprentices gain supervised experience, documented skills, and the opportunity to earn wages while completing their pathway. Elevate also provides online applications, learner and employer portals, course-building tools, website and app development, testing support, and workforce-management technology. Explore a program, apply for training, become a host site, or request a demonstration. Your next opportunity can start right here with Elevate for Humanity.';

function withMediaRevision(src?: string) {
  if (!src) return undefined;
  return `${src}${src.includes('?') ? '&' : '?'}v=${HOME_MEDIA_REVISION}`;
}

export default function HomeHeroVideo({ banner }: HomeHeroVideoProps) {
  const slides = ([
    {
      type: 'video',
      src: withMediaRevision(banner.videoSrcDesktop),
      mobileSrc: withMediaRevision(banner.videoSrcMobile),
      alt: 'Elevate for Humanity career training and apprenticeship opportunities',
      label: 'Career training and apprenticeships',
    },
    {
      type: 'image',
      src: '/images/partners/salon-saloon/team-sign.webp',
      alt: 'Salon Saloon team at an Elevate participating Host Salon',
      label: 'Host shops train the next generation',
    },
    {
      type: 'image',
      src: '/images/pages/barber-hero-main.webp',
      alt: 'Barber apprentice serving a client in a working barbershop',
      label: 'Earn while you learn',
    },
    {
      type: 'image',
      src: '/images/pexels/cosmetology.webp',
      alt: 'Beauty professional working with a client in a salon',
      label: 'Beauty apprenticeship pathways',
    },
  ] satisfies HomeHeroSlide[]).filter(
    (slide) => slide.type === 'image' || Boolean(slide.src || slide.mobileSrc),
  );

  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = slides[activeSlide] ?? slides[0];

  const selectSlide = useCallback(
    (index: number) => {
      setActiveSlide((index + slides.length) % slides.length);
    },
    [slides.length],
  );

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = window.setInterval(
      () => setActiveSlide((current) => (current + 1) % slides.length),
      HOME_SLIDE_SECONDS * 1000,
    );
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) setPaused(true);
  }, []);

  if (!slide) return null;

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carousel"
      aria-label="Elevate for Humanity homepage highlights"
    >
      <HeroVideo
        videoSrcDesktop={slide.type === 'video' ? slide.src : undefined}
        videoSrcMobile={slide.type === 'video' ? slide.mobileSrc : undefined}
        mountedFrameImage={slide.type === 'video' ? HOME_FIRST_FRAME : slide.src}
        transcript={HOME_NARRATION}
        narrateTranscript
        analyticsName={banner.analyticsName}
        overlayMode="none"
        soundButtonVariant="prominent"
        heightClassName="h-[clamp(400px,62vh,680px)]"
        deferVideoMs={slide.type === 'video' ? 250 : 0}
      />

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => selectSlide(activeSlide - 1)}
            aria-label="Show previous hero slide"
            className="absolute left-0 top-1/2 z-50 inline-flex h-16 w-11 -translate-y-1/2 items-center justify-center rounded-r-lg border-y border-r border-white/80 bg-slate-950/65 text-white shadow-lg transition hover:bg-slate-950/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span aria-hidden="true" className="text-4xl font-light leading-none">‹</span>
          </button>
          <button
            type="button"
            onClick={() => selectSlide(activeSlide + 1)}
            aria-label="Show next hero slide"
            className="absolute right-0 top-1/2 z-50 inline-flex h-16 w-11 -translate-y-1/2 items-center justify-center rounded-l-lg border-y border-l border-white/80 bg-slate-950/65 text-white shadow-lg transition hover:bg-slate-950/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span aria-hidden="true" className="text-4xl font-light leading-none">›</span>
          </button>

          <div className="absolute bottom-5 left-1/2 z-50 flex w-[min(88vw,32rem)] -translate-x-1/2 items-center gap-2 rounded-lg border border-white/40 bg-slate-950/55 px-3 py-2 shadow-lg backdrop-blur-sm">
            {slides.map((item, index) => (
              <button
                key={`${item.type}-${item.src}-${index}`}
                type="button"
                onClick={() => selectSlide(index)}
                aria-label={`Show slide ${index + 1}: ${item.label}`}
                aria-current={index === activeSlide ? 'true' : undefined}
                className={`h-1.5 flex-1 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  index === activeSlide ? 'bg-white' : 'bg-white/35 hover:bg-white/70'
                }`}
              />
            ))}
            <button
              type="button"
              onClick={() => setPaused((value) => !value)}
              aria-label={paused ? 'Resume hero slideshow' : 'Pause hero slideshow'}
              className="ml-1 inline-flex h-8 min-w-10 items-center justify-center rounded-md border border-white/50 px-2 text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span aria-hidden="true" className="text-sm font-black leading-none">{paused ? '▶' : 'Ⅱ'}</span>
            </button>
          </div>

          <p className="sr-only" aria-live="polite">
            Slide {activeSlide + 1} of {slides.length}: {slide.label}
          </p>
        </>
      ) : null}
    </div>
  );
}
