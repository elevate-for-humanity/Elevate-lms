'use client';

/**
 * HeroVideo — shared premium hero video component.
 *
 * Rules (non-negotiable):
 * - No gradient overlays on the video frame.
 * - No headline, subheadline, paragraph, or CTA on top of the video.
 * - Only allowed on-video elements: brand bug, sound control, micro-label (2–4 words max).
 * - All primary messaging renders in the below-hero content slot.
 * - Transcript renders below the fold, never over the video.
 */

import { useEffect, useRef, useState, useId } from 'react';
import CanonicalVideo from '@/components/video/CanonicalVideo';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface HeroVideoCta {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
}

export interface HeroVideoProps {
  /** Desktop video source */
  videoSrcDesktop: string;
  /** Mobile video source — falls back to desktop if omitted */
  videoSrcMobile?: string;
  /** Poster image shown while video loads and as reduced-motion fallback */
  posterImage?: string;

  /** 2–4 word micro-label rendered in bottom-left corner of video */
  microLabel?: string;
  /** Show small brand bug in top-left corner */
  showBrandBug?: boolean;
  /** Below-hero headline */
  belowHeroHeadline?: string;
  /** Below-hero supporting line */
  belowHeroSubheadline?: string;
  /** CTA buttons rendered below the hero */
  ctas?: HeroVideoCta[];
  /** Optional trust indicator row below CTAs */
  trustIndicators?: string[];
  /** Voiceover transcript — rendered in expandable section below the fold */
  transcript?: string;
  /** Analytics name for tracking */
  analyticsName?: string;
  /** Additional className for the outer wrapper */
  className?: string;
  /** Render below-hero content as children instead of structured props */
  children?: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function HeroVideo({
  videoSrcDesktop,
  videoSrcMobile,
  posterImage,
  microLabel,
  showBrandBug = false,
  belowHeroHeadline,
  belowHeroSubheadline,
  ctas,
  trustIndicators,
  transcript,
  analyticsName,
  className = '',
  children,
}: HeroVideoProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const transcriptId = useId();

  // Track whether we're mounted on the client (avoids SSR/client hydration mismatch)
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Always use desktop src on server. Switch to mobile src after mount if viewport is narrow.
  // This prevents the SSR/client src mismatch hydration error.
  const videoSrc =
    mounted && videoSrcMobile && window.innerWidth < 768
      ? videoSrcMobile
      : videoSrcDesktop;

  return (
    <div ref={wrapperRef} className={`w-full ${className}`}>
      {/* ── VIDEO FRAME ── */}
      {/* Height: 56vw clamped between 400px and 780px */}
      <section
        className="relative w-full overflow-hidden"
        style={{ height: 'clamp(400px, 56vw, 780px)' }}
        aria-label={analyticsName ? `${analyticsName} hero video` : 'Hero video'}
      >
        {/* autoPlayOnMount + preloadFull — hero is above the fold, load immediately */}
        <CanonicalVideo
          src={videoSrc}
          poster={posterImage}
          className="absolute inset-0 w-full h-full object-cover object-center"
          autoPlayOnMount
          preloadFull
        />



        {/* ── ON-VIDEO ELEMENTS (only these three are allowed) ── */}

        {/* Brand bug — top-left, only when requested */}
        {showBrandBug && (
          <div className="absolute top-4 left-4 z-10">
            <img
              src="/images/Elevate_for_Humanity_logo_81bf0fab.jpg"
              alt="Elevate for Humanity"
              className="h-7 w-auto opacity-90"
            />
          </div>
        )}

        {/* Micro-label — bottom-left, 2–4 words max */}
        {microLabel && (
          <div className="absolute bottom-4 left-4 z-10">
            <span className="text-white/80 text-xs font-semibold tracking-widest uppercase bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded">
              {microLabel}
            </span>
          </div>
        )}


      </section>

      {/* ── BELOW-HERO CONTENT ── */}
      {/* All primary messaging lives here — never on the video */}
      {(belowHeroHeadline || belowHeroSubheadline || ctas || trustIndicators || children) && (
        <section className="border-b border-slate-100 py-10 sm:py-14">
          <div className="max-w-4xl mx-auto px-6">
            {children ? (
              children
            ) : (
              <>
                {belowHeroHeadline && (
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
                    {belowHeroHeadline}
                  </h1>
                )}
                {belowHeroSubheadline && (
                  <p className="text-slate-600 text-lg leading-relaxed mb-8 max-w-2xl">
                    {belowHeroSubheadline}
                  </p>
                )}
                {ctas && ctas.length > 0 && (
                  <div className="flex flex-wrap gap-3 mb-6">
                    {ctas.map((cta) => (
                      <a
                        key={cta.href}
                        href={cta.href}
                        className={
                          cta.variant === 'secondary'
                            ? 'border border-slate-300 text-slate-700 font-bold px-7 py-3 rounded-lg hover:bg-slate-50 transition-colors text-sm'
                            : 'bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3 rounded-lg transition-colors text-sm'
                        }
                      >
                        {cta.label}
                      </a>
                    ))}
                  </div>
                )}
                {trustIndicators && trustIndicators.length > 0 && (
                  <ul className="flex flex-wrap gap-x-6 gap-y-1.5 mt-2">
                    {trustIndicators.map((item) => (
                      <li key={item} className="flex items-center gap-1.5 text-slate-500 text-sm">
                        <span className="w-1 h-1 rounded-full bg-brand-red-400 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* ── TRANSCRIPT ── */}
      {/* Expandable, below the fold — never over the video */}
      {transcript && (
        <div className="bg-slate-50 border-b border-slate-100">
          <div className="max-w-4xl mx-auto px-6 py-3">
            <button
              onClick={() => setTranscriptOpen((o) => !o)}
              aria-expanded={transcriptOpen}
              aria-controls={transcriptId}
              className="flex items-center gap-2 text-slate-500 text-xs font-semibold hover:text-slate-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-red-500 rounded"
            >
              <span>{transcriptOpen ? '▲' : '▼'}</span>
              Video transcript
            </button>
            {transcriptOpen && (
              <p
                id={transcriptId}
                className="mt-3 text-slate-600 text-sm leading-relaxed max-w-2xl"
              >
                {transcript}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
