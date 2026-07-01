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
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { IMAGE_SIZES } from '@/lib/images/media-dimensions';
import { hero as heroTokens } from '@/lib/page-design-tokens';
import { resolveSiteImagePath } from '@/lib/images/site-image-paths';

export interface HeroPictureCta {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
}

export interface HeroPictureProps {
  /** Desktop hero image (2560×1440 WebP) — relative to /public */
  src: string;
  /** Mobile hero image (1080×1350 WebP) — uses src when omitted */
  srcMobile?: string;
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
   * Image height — defaults to locked program hero tokens (45vh, max 560px).
   * Pass a Tailwind class string to override, e.g. 'h-[360px]'.
   */
  heightStyle?: string;
  /** Next/Image priority — true for above-the-fold heroes (default: true) */
  priority?: boolean;
}

export default function HeroPicture({
  src,
  srcMobile,
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

  const imageSrcDesktop = resolveSiteImagePath(src);
  const imageSrcMobile = resolveSiteImagePath(srcMobile ?? src);
  const wrapClass = heightStyle ?? heroTokens.homepageWrap;

  return (
    <div className={`w-full ${className}`}>
      {/* IMAGE FRAME */}
      <section
        className={`relative w-full overflow-hidden ${wrapClass}`}
        aria-label={analyticsName ? `${analyticsName} hero` : 'Hero image'}
      >
        {/* Mobile 4:5 — program-desktop.webp / hero-mobile.webp pair */}
        <Image
          src={imageSrcMobile}
          alt={alt}
          fill
          sizes={IMAGE_SIZES.hero}
          quality={75}
          className={`object-cover object-center sm:hidden ${heroTokens.imageFill}`}
          priority={priority}
          placeholder="empty"
        />
        <Image
          src={imageSrcDesktop}
          alt={alt}
          fill
          sizes={IMAGE_SIZES.hero}
          quality={75}
          className={`hidden sm:block object-cover object-center ${heroTokens.imageFill}`}
          priority={priority}
          placeholder="empty"
        />

        {/* ON-IMAGE ELEMENTS (only these two are allowed) */}

        {/* Brand bug — top-left, only when requested */}
        {showBrandBug && (
          <div className="absolute top-4 left-4 z-10">
            {/* IMAGE-CONTRACT: allow raw img because legacy markup */}
            <img
              src="/images/Elevate_for_Humanity_logo_81bf0fab.jpg"
              alt={PLATFORM_DEFAULTS.orgName}
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

      {/* BELOW-HERO CONTENT */}
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

      {/* TRANSCRIPT CAPTION */}
      {transcript && (
        <div className="bg-slate-50 border-b border-slate-100">
          <div className="max-w-4xl mx-auto px-6 py-3">
            <button
              onClick={() => setTranscriptOpen((o) => !o)}
              aria-expanded={transcriptOpen}
              aria-controls={transcriptId}
              className="flex items-center gap-2 rounded text-xs font-semibold text-slate-500 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-500 focus-visible:ring-offset-2"
            >
              <span>{transcriptOpen ? '▲' : '▼'}</span>
              Image transcript
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
