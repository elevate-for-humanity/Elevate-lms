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
  const [dismissed, setDismissed] = useState(false);
  const hasPlayedRef = useRef(false);

  const playAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !voiceoverSrc) return;
    audio.currentTime = 0;
    audio.muted = false;
    audio.play()
      .then(() => { setVoiceActive(true); hasPlayedRef.current = true; setDismissed(true); })
      .catch(() => {});
  }, [voiceoverSrc]);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio || !voiceoverSrc) return;
    if (!voiceActive) {
      playAudio();
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
          autoPlay loop muted playsInline preload="auto"
          onError={() => setVideoFailed(true)}
        />
      ) : posterImage ? (
        <img src={posterImage} alt={title || 'Program hero'} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-slate-100" />
      )}

      {/* Dark gradient so text is readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Title/subtitle bottom-left */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
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
            <p className="mt-2 text-base md:text-lg text-white/90 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Audio button — large, centered, impossible to miss */}
      {voiceoverSrc && !dismissed && (
        <button
          onClick={toggleAudio}
          aria-label="Play narration"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2 bg-black/70 hover:bg-black/90 text-white rounded-2xl px-8 py-5 shadow-2xl transition-all border-2 border-white/30"
        >
          <span className="text-4xl">🔊</span>
          <span className="text-base font-bold tracking-wide">Tap to hear narration</span>
          <span className="text-xs text-white/60">Tap anywhere else to dismiss</span>
        </button>
      )}

      {/* Small replay button after dismissed */}
      {voiceoverSrc && dismissed && (
        <button
          onClick={toggleAudio}
          aria-label={voiceActive ? 'Stop narration' : 'Replay narration'}
          className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-white shadow-lg bg-black/60 hover:bg-black/80 min-h-[44px]"
        >
          {voiceActive ? '🔊 Playing' : '▶ Replay'}
        </button>
      )}

      {voiceoverSrc && (
        <audio
          ref={audioRef}
          src={voiceoverSrc}
          preload="auto"
          aria-hidden="true"
          onEnded={() => setVoiceActive(false)}
        />
      )}
    </div>
  );
}
