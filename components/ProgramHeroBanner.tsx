'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useHeroVideo } from '@/hooks/useHeroVideo';

interface ProgramHeroBannerProps {
  videoSrc: string;
  voiceoverSrc?: string;
  posterImage?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
}

export default function ProgramHeroBanner({ videoSrc, voiceoverSrc, posterImage, title, subtitle, badge }: ProgramHeroBannerProps) {
  const { videoRef } = useHeroVideo();
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const hasPlayedRef = useRef(false);

  const playAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || hasPlayedRef.current || !voiceoverSrc) return;
    hasPlayedRef.current = true;
    audio.currentTime = 0;
    audio.muted = false;
    audio.play()
      .then(() => setVoiceActive(true))
      .catch(() => {
        // Browser blocked — reset so tap button still works
        hasPlayedRef.current = false;
      });
  }, [voiceoverSrc]);

  // Trigger when user scrolls PAST the hero (hero leaves viewport)
  useEffect(() => {
    if (!voiceoverSrc) return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && !hasPlayedRef.current) {
          playAudio();
        }
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [voiceoverSrc, playAudio]);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio || !voiceoverSrc) return;
    if (!voiceActive) {
      audio.currentTime = 0;
      audio.muted = false;
      audio.play().then(() => {
        setVoiceActive(true);
        hasPlayedRef.current = true;
      }).catch(() => {});
    } else {
      audio.pause();
      setVoiceActive(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {!videoFailed ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={videoSrc}
          poster={posterImage}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onError={() => setVideoFailed(true)}
        />
      ) : posterImage ? (
        <img src={posterImage} alt={title || 'Program hero'} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-slate-100" />
      )}

      {/* Title/subtitle overlay on the banner */}
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

      {/* Audio narration button */}
      {voiceoverSrc && (
        <>
          <audio
            ref={audioRef}
            src={voiceoverSrc}
            preload="auto"
            aria-hidden="true"
            onEnded={() => setVoiceActive(false)}
          />
          <button
            onClick={toggleAudio}
            aria-label={voiceActive ? 'Stop narration' : 'Play narration'}
            className={`absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all min-h-[44px] ${
              voiceActive
                ? 'bg-black/60 hover:bg-black/80'
                : 'bg-brand-red-600 hover:bg-brand-red-700 animate-pulse'
            }`}
          >
            {voiceActive ? '🔊 Playing' : '🔇 Tap to hear'}
          </button>
        </>
      )}
    </div>
  );
}
