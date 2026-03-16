'use client';

import { useRef, useEffect, useState } from 'react';
import { useHeroVideo } from '@/hooks/useHeroVideo';

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
  const { videoRef } = useHeroVideo();
  const audioRef = useRef<HTMLAudioElement>(null);
  const playedRef = useRef(false);

  useEffect(() => {
    if (!audioSrc || !audioRef.current || playedRef.current) return;
    playedRef.current = true;
    const audio = audioRef.current;
    audio.volume = 1;
    audio.muted = false;
    audio.play().catch(() => {
      audio.muted = true;
      audio.play().catch(() => {});
      const unmute = () => {
        audio.muted = false;
        audio.play().catch(() => {});
        window.removeEventListener('click', unmute);
        window.removeEventListener('touchstart', unmute);
        window.removeEventListener('scroll', unmute, true);
        window.removeEventListener('keydown', unmute);
      };
      window.addEventListener('click', unmute, { once: true });
      window.addEventListener('touchstart', unmute, { once: true, passive: true });
      window.addEventListener('scroll', unmute, { capture: true, passive: true, once: true } as any);
      window.addEventListener('keydown', unmute, { once: true });
    });
  }, [audioSrc]);

  return (
    <section className={`relative w-full ${SIZE[size]} overflow-hidden`}>
      <video ref={videoRef} autoPlay loop playsInline muted preload="auto"
        poster={posterSrc} aria-label={posterAlt}
        className="absolute inset-0 w-full h-full object-cover">
        <source src={videoSrc} type="video/mp4" />
      </video>

      {(title || subtitle || badge) && (
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
          <div className="max-w-3xl">
            {badge && <span className="inline-block bg-brand-red-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">{badge}</span>}
            {title && <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight drop-shadow-lg">{title}</h1>}
            {subtitle && <p className="mt-2 text-base md:text-lg text-white/90 max-w-2xl leading-relaxed">{subtitle}</p>}
          </div>
        </div>
      )}

      {audioSrc && (
        <audio ref={audioRef} src={audioSrc} preload="auto" aria-hidden="true" />
      )}
    </section>
  );
}
