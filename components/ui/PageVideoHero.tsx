'use client';

import { useEffect, useRef } from 'react';
import VoiceoverWithMusic from '@/components/VoiceoverWithMusic';

export type HeroSize = 'primary' | 'program' | 'marketing' | 'support';

const SIZE: Record<HeroSize, string> = {
  primary:   'h-[75vh] min-h-[480px] max-h-[860px]',
  program:   'h-[65vh] min-h-[420px] max-h-[720px]',
  marketing: 'h-[60vh] min-h-[380px] max-h-[640px]',
  support:   'h-[50vh] min-h-[300px] max-h-[520px]',
};

interface PageVideoHeroProps {
  videoSrc: string;
  posterSrc: string;
  posterAlt: string;
  audioSrc?: string;
  size?: HeroSize;
  title?: string;
  subtitle?: string;
  badge?: string;
}

export default function PageVideoHero({ videoSrc, posterSrc, posterAlt, audioSrc, size = 'marketing', title, subtitle, badge }: PageVideoHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    // Attempt unmuted autoplay. Fall back to muted if browser blocks it.
    el.muted = false;
    el.volume = 0.8;
    el.play().catch(() => {
      el.muted = true;
      el.play().catch(() => {});
    });
  }, []);

  return (
    <section className={`relative w-full ${SIZE[size]} overflow-hidden`}>
      <video
        ref={videoRef}
        loop
        playsInline
        preload="auto"
        poster={posterSrc}
        aria-label={posterAlt}
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Title/subtitle/badge only rendered if explicitly passed — content goes below hero by default */}
      {(title || subtitle || badge) && (
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
          <div className="max-w-3xl">
            {badge && <span className="inline-block bg-brand-red-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">{badge}</span>}
            {title && <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight drop-shadow-lg">{title}</h1>}
            {subtitle && <p className="mt-2 text-base md:text-lg text-white/90 max-w-2xl leading-relaxed">{subtitle}</p>}
          </div>
        </div>
      )}

      {audioSrc && <VoiceoverWithMusic audioSrc={audioSrc} />}
    </section>
  );
}
