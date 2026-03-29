'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Volume2, VolumeX } from 'lucide-react';
import CanonicalVideo from '@/components/video/CanonicalVideo';

type HeroBannerProps = {
  title: string;
  subtitle: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  trustIndicators?: string[];
  type?: 'image' | 'video';
  videoSrc?: string;
  posterSrc?: string;
  heroImageSrc?: string;
  heroImageAlt?: string;
  /** Voiceover caption shown when unmuted */
  caption?: string;
};

export default function HeroBanner({
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  trustIndicators = [],
  type = 'image',
  videoSrc = '/videos/homepage-hero-montage.mp4',
  posterSrc = '/images/pages/comp-home-hero-programs.jpg',
  heroImageSrc = '/images/pages/workforce-training.jpg',
  heroImageAlt = 'Elevate for Humanity',
  caption,
}: HeroBannerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);

  function toggleMute() {
    const video = wrapperRef.current?.querySelector('video');
    if (!video) return;
    video.muted = !video.muted;
    if (!video.muted && video.paused) video.play().catch(() => {});
    setMuted(video.muted);
  }

  return (
    <section className="relative w-full overflow-hidden rounded-3xl">
      <div ref={wrapperRef} className="relative h-[50svh] sm:h-[55svh] md:h-[60svh] lg:h-[65svh] min-h-[320px] w-full">
        {type === 'video' ? (
          <CanonicalVideo
            src={videoSrc}
            poster={posterSrc as `/${string}`}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlayOnMount
          />
        ) : (
          <Image src={heroImageSrc} alt={heroImageAlt} fill priority sizes="100vw" className="object-cover" />
        )}

        {/* Mute button — only for video type */}
        {type === 'video' && (
          <button
            onClick={toggleMute}
            aria-label={muted ? 'Unmute video' : 'Mute video'}
            className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white text-xs font-semibold px-3 py-2 rounded-full transition-colors backdrop-blur-sm border border-white/20"
          >
            {muted ? (
              <>
                <VolumeX className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Tap to hear</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 flex-shrink-0 text-brand-red-400" />
                <span className="hidden sm:inline">Mute</span>
              </>
            )}
          </button>
        )}

        {caption && type === 'video' && !muted && (
          <div className="absolute bottom-16 left-4 right-20 z-20 pointer-events-none">
            <p className="bg-black/75 text-white text-xs sm:text-sm leading-relaxed px-4 py-3 rounded-lg backdrop-blur-sm max-w-xl">
              {caption}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white py-10">
        <div className="mx-auto w-full max-w-5xl px-4 md:px-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">{title}</h1>
          <p className="mt-3 text-base text-slate-600 md:text-lg max-w-3xl mx-auto">{subtitle}</p>
          {(primaryCta || secondaryCta) && (
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {primaryCta && (
                <Link href={primaryCta.href} className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3 rounded-lg transition-colors text-sm">
                  {primaryCta.label}
                </Link>
              )}
              {secondaryCta && (
                <Link href={secondaryCta.href} className="border border-slate-300 text-slate-700 font-bold px-7 py-3 rounded-lg hover:bg-slate-50 transition-colors text-sm">
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          )}
          {trustIndicators.length > 0 && (
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-1.5 mt-4">
              {trustIndicators.map((item) => (
                <li key={item} className="flex items-center gap-1.5 text-slate-500 text-sm">
                  <span className="w-1 h-1 rounded-full bg-brand-red-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
