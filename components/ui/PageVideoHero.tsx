'use client';

import { useRef, useState, useCallback } from 'react';
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
  const [voiceActive, setVoiceActive] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const playAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;
    audio.currentTime = 0;
    audio.muted = false;
    audio.play()
      .then(() => { setVoiceActive(true); setDismissed(true); })
      .catch(() => {});
  }, [audioSrc]);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;
    if (!voiceActive) { playAudio(); }
    else { audio.pause(); setVoiceActive(false); }
  };

  return (
    <section className={`relative w-full ${SIZE[size]} overflow-hidden`}>
      <video ref={videoRef} autoPlay loop playsInline muted preload="auto"
        poster={posterSrc} aria-label={posterAlt}
        className="absolute inset-0 w-full h-full object-cover">
        <source src={videoSrc} type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
        <div className="max-w-3xl">
          {badge && <span className="inline-block bg-brand-red-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">{badge}</span>}
          {title && <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight drop-shadow-lg">{title}</h1>}
          {subtitle && <p className="mt-2 text-base md:text-lg text-white/90 max-w-2xl leading-relaxed">{subtitle}</p>}
        </div>
      </div>

      {audioSrc && !dismissed && (
        <button onClick={toggleAudio} aria-label="Play narration"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2 bg-black/70 hover:bg-black/90 text-white rounded-2xl px-8 py-5 shadow-2xl border-2 border-white/30">
          <span className="text-4xl">🔊</span>
          <span className="text-base font-bold">Tap to hear narration</span>
          <span className="text-xs text-white/60">Tap anywhere else to dismiss</span>
        </button>
      )}

      {audioSrc && dismissed && (
        <button onClick={toggleAudio} aria-label={voiceActive ? 'Stop' : 'Replay'}
          className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-white bg-black/60 hover:bg-black/80 shadow-lg min-h-[44px]">
          {voiceActive ? '🔊 Playing' : '▶ Replay'}
        </button>
      )}

      {audioSrc && (
        <audio ref={audioRef} src={audioSrc} preload="auto" aria-hidden="true" onEnded={() => setVoiceActive(false)} />
      )}
    </section>
  );
}
