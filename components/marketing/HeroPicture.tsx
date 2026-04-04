'use client';

/**
 * HeroPicture — picture-based hero banner.
 *
 * Same non-negotiable rules as HeroVideo:
 * - No gradient overlays on the image frame.
 * - No headline, subheadline, paragraph, or CTA on top of the image.
 * - Only allowed on-image elements: micro-label (2–4 words max), brand bug.
 * - All primary messaging renders in the below-hero content slot.
 *
 * Use this when a high-quality still image is available and video is not
 * required. Accepts the same prop shape as HeroVideo for easy swapping.
 */

import Image from 'next/image';
import { useId, useState } from 'react';

export interface HeroPictureCta {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
}

export interface HeroPictureProps {
  /** Path to the hero image (relative to /public) */
  src: string;
  /** Alt text — describe the scene, not the brand */
  alt: string;
  /** 2–4 word micro-label rendered in bottom-left corner of image */
  microLabel?: string;
  /** Show small brand bug in top-left corner */
  showBrandBug?: boolean;
  /** Below-hero headline */
  belowHeroHeadline?: string;
  /** Below-hero supporting line */
  belowHeroSubheadline?: string;
  /** CTA buttons rendered below the hero */
  ctas?: HeroPictureCta[];
  /** Optional trust indicator row below CTAs */
  trustIndicators?: string[];
  /** Voiceover / image transcript — rendered in expandable section below the fold */
  transcript?: string;
  /** Analytics name for tracking */
  analyticsName?: string;
  /** Additional className for the outer wrapper */
  className?: string;
  /** Render below-hero content as children instead of structured props */
  children?: React.ReactNode;
  /**
   * Image height class — defaults to 'clamp(400px, 56vw, 780px)' matching HeroVideo.
   * Pass a Tailwind height class to override, e.g. 'h-[480px]'.
   */
  heightStyle?: string;
  /** Next/Image priority — true for above-the-fold heroes (default: true) */
  priority?: boolean;
}

export default function HeroPicture({
  src,
  alt,
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
  heightStyle,
  priority = true,
}: HeroPictureProps) {
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const transcriptId = useId();

  const frameStyle = heightStyle
    ? undefined
    : { height: 'clamp(400px, 56vw, 780px)' };

  return (
    <div className={`w-full ${className}`}>
      {/* ── IMAGE FRAME ── */}
      <section
        className={`relative w-full overflow-hidden ${heightStyle ?? ''}`}
        style={frameStyle}
        aria-label={analyticsName ? `${analyticsName} hero` : 'Hero image'}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority={priority}
        />

        {/* ── ON-IMAGE ELEMENTS (only these two are allowed) ── */}

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
            <span className="text-white text-xs font-semibold tracking-widest uppercase bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded">
              {microLabel}
            </span>
          </div>
        )}
      </section>

      {/* ── BELOW-HERO CONTENT ── */}
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
                      <li key={item} className="flex items-center gap-1.5 text-slate-700 text-sm">
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

      {/* ── TRANSCRIPT / CAPTION ── */}
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
              Image description
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
