'use client';

/**
 * HeroPicture — picture-based hero banner.
 *
 * Same non-negotiable rules as HeroVideo:
 * - No gradient overlays on the image frame.
 * - No headline, subheadline, paragraph, or CTA on top of the image.
 * - Only allowed on-image elements: micro-label (2–4 words max), brand bug.
 * - All primary messaging renders in the below-hero content slot.
 */

import Image from 'next/image';
import { useId, useState } from 'react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export interface HeroPictureCta {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
}

export interface HeroPictureProps {
  src: string;
  alt: string;
  microLabel?: string;
  showBrandBug?: boolean;
  belowHeroHeadline?: string;
  belowHeroSubheadline?: string;
  ctas?: HeroPictureCta[];
  trustIndicators?: string[];
  transcript?: string;
  analyticsName?: string;
  className?: string;
  children?: React.ReactNode;
  /** Canonical site-wide hero height. Override only for a documented layout need. */
  heightStyle?: string;
  /** Render the complete artwork at its native 4:3 ratio instead of cropping it. */
  preserveAspectRatio?: boolean;
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
  preserveAspectRatio = false,
  priority = true,
}: HeroPictureProps) {
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const transcriptId = useId();
  const canonicalHeight = 'h-[clamp(420px,58vh,720px)]';

  return (
    <div className={`w-full ${className}`}>
      <section
        className={`relative w-full overflow-hidden ${preserveAspectRatio ? 'bg-white' : 'bg-slate-900'} ${
          preserveAspectRatio ? '' : (heightStyle ?? canonicalHeight)
        }`}
        aria-label={analyticsName ? `${analyticsName} hero` : 'Hero image'}
      >
        {preserveAspectRatio ? (
          <Image
            src={src}
            alt={alt}
            width={1536}
            height={1152}
            sizes="100vw"
            className="h-auto w-full"
            priority={priority}
            placeholder="empty"
          />
        ) : (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority={priority}
            placeholder="empty"
          />
        )}

        {showBrandBug && (
          <div className="absolute left-4 top-4 z-10">
            <img
              src="/images/Elevate_for_Humanity_logo_81bf0fab.jpg"
              alt={PLATFORM_DEFAULTS.orgName}
              className="h-7 w-auto opacity-90"
            />
          </div>
        )}

        {microLabel && (
          <div className="absolute bottom-4 left-4 z-10">
            <span className="rounded bg-slate-950/90 px-2.5 py-1 text-xs font-semibold uppercase tracking-widest text-white">
              {microLabel}
            </span>
          </div>
        )}
      </section>

      {(belowHeroHeadline || belowHeroSubheadline || ctas || trustIndicators || children) && (
        <section className="border-b border-slate-100 py-10 sm:py-14">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            {children ? (
              children
            ) : (
              <>
                {belowHeroHeadline && (
                  <h1 className="mb-4 text-3xl font-extrabold leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                    {belowHeroHeadline}
                  </h1>
                )}
                {belowHeroSubheadline && (
                  <p className="mb-8 max-w-2xl text-lg leading-relaxed text-slate-700">
                    {belowHeroSubheadline}
                  </p>
                )}
                {ctas && ctas.length > 0 && (
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row">
                    {ctas.map((cta) => (
                      <a
                        key={`${cta.href}-${cta.label}`}
                        href={cta.href}
                        className={
                          cta.variant === 'secondary'
                            ? 'rounded-lg border border-slate-300 px-7 py-3.5 text-center text-sm font-bold text-slate-900 transition-colors hover:bg-slate-50'
                            : 'rounded-lg bg-brand-red-600 px-7 py-3.5 text-center text-sm font-bold text-white transition-colors hover:bg-brand-red-700'
                        }
                      >
                        {cta.label}
                      </a>
                    ))}
                  </div>
                )}
                {trustIndicators && trustIndicators.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                    {Array.from(new Set(trustIndicators)).map((item) => (
                      <li key={item} className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-red-600" />
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

      {transcript && (
        <div className="border-b border-slate-100 bg-slate-50">
          <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setTranscriptOpen((open) => !open)}
              aria-expanded={transcriptOpen}
              aria-controls={transcriptId}
              className="flex min-h-11 items-center gap-2 rounded text-xs font-semibold text-slate-700 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-500 focus-visible:ring-offset-2"
            >
              <span>{transcriptOpen ? '▲' : '▼'}</span>
              Image transcript
            </button>
            {transcriptOpen && (
              <p id={transcriptId} className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-800">
                {transcript}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
