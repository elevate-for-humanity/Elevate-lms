'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
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

export default function PageVideoHero({
  videoSrc, posterSrc, posterAlt, audioSrc, size = 'marketing', title, subtitle, badge,
}: PageVideoHeroProps) {
  const { videoRef } = useHeroVideo();
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasPlayedRef = useRef(false);
  const [voiceActive, setVoiceActive] = useState(false);

  const playAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || hasPlayedRef.current || !audioSrc) return;
    hasPlayedRef.current = true;
    audio.currentTime = 0;
    audio.play().then(() => setVoiceActive(true)).catch(() => { hasPlayedRef.current = false; });
  }, [audioSrc]);

  useEffect(() => {
    if (!audioSrc) return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (!entry.isIntersecting && !hasPlayedRef.current) playAudio(); },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [audioSrc, playAudio]);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;
    if (!voiceActive) {
      audio.currentTime = 0;
      audio.play().then(() => { setVoiceActive(true); hasPlayedRef.current = true; }).catch(() => {});
    } else {
      audio.pause();
      setVoiceActive(false);
    }
  };

  return (
    <section ref={containerRef} className={`relative w-full ${SIZE[size]} overflow-hidden`}>
      <video ref={videoRef} autoPlay loop playsInline muted preload="auto"
        poster={posterSrc} aria-label={posterAlt}
        className="absolute inset-0 w-full h-full object-cover">
        <source src={videoSrc} type="video/mp4" />
      </video>

      {(title || subtitle || badge) && (
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
          <div className="max-w-3xl">
            {badge && (
              <span className="inline-block bg-brand-red-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                {badge}
              </span>
            )}
            {title && (
              <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight drop-shadow-lg">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-3 text-base md:text-lg text-white/90 max-w-2xl leading-relaxed drop-shadow">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {audioSrc && (
        <>
          <audio ref={audioRef} src={audioSrc} preload="auto" aria-hidden="true"
            onEnded={() => setVoiceActive(false)} />
          <button onClick={toggleAudio}
            aria-label={voiceActive ? 'Stop narration' : 'Play narration'}
            className={`absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all min-h-[44px] ${
              voiceActive ? 'bg-black/60 hover:bg-black/80' : 'bg-brand-red-600 hover:bg-brand-red-700 animate-pulse'
            }`}>
            {voiceActive ? '🔊 Playing' : '🔇 Tap to hear'}
          </button>
        </>
      )}
    </section>
  );
}
