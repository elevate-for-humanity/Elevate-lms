'use client';

/**
 * SplitMediaBlock — 50/50 split: image or video on one side, copy on the other.
 * No gradients. Hard border separation. Flips on mobile to stack.
 */

import Image from 'next/image';
import Link from 'next/link';
import CanonicalVideo from '@/components/video/CanonicalVideo';

interface Props {
  headline: string;
  body: string;
  bullets?: string[];
  cta?: { label: string; href: string };
  /** Image path */
  imageSrc?: string;
  imageAlt?: string;
  /** Video path — if provided, renders a muted autoplay loop */
  videoSrc?: string;
  /** Poster image for video fallback */
  posterSrc?: string;
  /** Which side the media appears on */
  mediaPosition?: 'left' | 'right';
  /** Background of the copy side */
  copyBg?: 'white' | 'slate';
}

export default function SplitMediaBlock({
  headline,
  body,
  bullets,
  cta,
  imageSrc,
  imageAlt = '',
  videoSrc,
  posterSrc,
  mediaPosition = 'left',
  copyBg = 'white',
}: Props) {
  const mediaFirst = mediaPosition === 'left';
  const copyBgClass = copyBg === 'slate' ? 'bg-slate-50' : 'bg-white';

  const MediaPanel = (
    <div className="relative w-full h-64 sm:h-80 lg:h-full min-h-[320px] overflow-hidden bg-slate-200">
      {videoSrc ? (
        <CanonicalVideo
          src={videoSrc}
          poster={
            // CanonicalVideo requires a local path. Use posterSrc if it starts with /,
            // fall back to imageSrc if local, otherwise use the generic hero poster.
            ((posterSrc?.startsWith('/') ? posterSrc : null) ??
             (imageSrc?.startsWith('/') ? imageSrc : null) ??
             '/images/hero-banner.jpg') as `/${string}`
          }
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : imageSrc ? (
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover object-center"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      ) : (
        /* Clean placeholder — swap with real asset later */
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <span className="text-slate-400 text-sm font-medium">Media coming soon</span>
        </div>
      )}
    </div>
  );

  const CopyPanel = (
    <div className={`${copyBgClass} flex items-center`}>
      <div className="px-8 py-10 lg:px-12 lg:py-14 max-w-xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight mb-4">{headline}</h2>
        <p className="text-slate-600 text-base leading-relaxed mb-5">{body}</p>
        {bullets && bullets.length > 0 && (
          <ul className="space-y-2 mb-6">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-brand-red-600 flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        )}
        {cta && (
          <Link
            href={cta.href}
            className="inline-block bg-slate-900 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm"
          >
            {cta.label}
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <section className="border-y border-slate-200">
      <div className={`grid lg:grid-cols-2 ${mediaFirst ? '' : 'lg:[&>*:first-child]:order-2'}`}>
        {mediaFirst ? <>{MediaPanel}{CopyPanel}</> : <>{CopyPanel}{MediaPanel}</>}
      </div>
    </section>
  );
}
