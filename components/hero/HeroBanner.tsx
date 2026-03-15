'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { useHeroVideo } from '@/hooks/useHeroVideo';

type HeroBannerProps = {
  title: string;
  subtitle: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  trustIndicators?: string[];
  type?: 'image' | 'video';
  videoSrc?: string;
  voiceoverSrc?: string;
  posterSrc?: string;
  heroImageSrc?: string;
  heroImageAlt?: string;
};

export default function HeroBanner({
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  trustIndicators = [],
  type = 'image',
  videoSrc = '/videos/homepage-hero-montage.mp4',
  voiceoverSrc,
  posterSrc = '/images/pages/comp-home-hero-programs.jpg',
  heroImageSrc = '/images/pages/workforce-training.jpg',
  heroImageAlt = 'Elevate for Humanity',
}: HeroBannerProps) {
  const { videoRef } = useHeroVideo({ pauseOffScreen: type === 'video' });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playedRef = useRef(false);

  useEffect(() => {
    if (!voiceoverSrc || !audioRef.current || playedRef.current) return;
    playedRef.current = true;
    const audio = audioRef.current;
    audio.volume = 1;
    audio.muted = false;
    audio.play().catch(() => {
      audio.muted = true;
      audio.play().catch(() => {});
      const unmute = () => {
        audio.muted = false;
        window.removeEventListener('scroll', unmute, true);
        window.removeEventListener('touchmove', unmute, true);
      };
      window.addEventListener('scroll', unmute, { capture: true, passive: true });
      window.addEventListener('touchmove', unmute, { capture: true, passive: true });
    });
  }, [voiceoverSrc]);

  return (
    <section className="relative w-full overflow-hidden rounded-3xl">
      <div className="relative h-[50svh] sm:h-[55svh] md:h-[60svh] lg:h-[65svh] min-h-[320px] w-full">
        {type === 'video' ? (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              src={videoSrc}
              loop playsInline preload="auto"
              poster={posterSrc}
            />
            {voiceoverSrc && (
              <audio ref={audioRef} src={voiceoverSrc} preload="metadata" aria-hidden="true" />
            )}
          </>
        ) : (
          <Image src={heroImageSrc} alt={heroImageAlt} fill priority sizes="100vw" className="object-cover" />
        )}
      </div>
      <div className="bg-white py-10">
        <div className="mx-auto w-full max-w-5xl px-4 md:px-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">{title}</h1>
          <p className="mt-3 text-base text-slate-600 md:text-lg max-w-3xl mx-auto">{subtitle}</p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {primaryCta && (
              <a href={primaryCta.href} className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black shadow-sm hover:bg-gray-100 transition-colors">
                {primaryCta.label}
              </a>
            )}
            {secondaryCta && (
              <a href={secondaryCta.href} className="inline-flex items-center justify-center rounded-xl border border-slate-500 bg-slate-700 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-600 transition-colors">
                {secondaryCta.label}
              </a>
            )}
          </div>
          {trustIndicators.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {trustIndicators.map((indicator, i) => (
                <span key={i} className="rounded-full bg-slate-700 px-3 py-2 text-xs font-medium text-slate-600">{indicator}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
