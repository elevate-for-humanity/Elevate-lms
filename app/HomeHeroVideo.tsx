'use client';

import { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { useHeroVideo } from '@/hooks/useHeroVideo';

export default function HomeHeroVideo() {
  const { videoRef } = useHeroVideo({ pauseOffScreen: false });
  const audioRef = useRef<HTMLAudioElement>(null);
  const [voiceActive, setVoiceActive] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const playAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.muted = false;
    audio.play()
      .then(() => { setVoiceActive(true); setDismissed(true); })
      .catch(() => {});
  }, []);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!voiceActive) { playAudio(); }
    else { audio.pause(); setVoiceActive(false); }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Image
        src="/images/pages/home-hero-video.jpg"
        alt="Elevate for Humanity career training"
        fill priority sizes="100vw"
        className="object-cover object-center"
      />
      <video
        ref={videoRef}
        loop playsInline preload="auto" autoPlay muted
        poster="/images/pages/home-hero-video.jpg"
        className="absolute inset-0 w-full h-full object-cover object-center hidden md:block"
      >
        <source src="/videos/homepage-hero-montage.mp4" type="video/mp4" />
      </video>

      <audio ref={audioRef} src="/audio/welcome-voiceover.mp3" preload="auto" aria-hidden="true"
        onEnded={() => setVoiceActive(false)} />

      {/* Big centered button — impossible to miss */}
      {!dismissed && (
        <button
          onClick={toggleAudio}
          aria-label="Play welcome narration"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2 bg-black/70 hover:bg-black/90 text-white rounded-2xl px-8 py-5 shadow-2xl border-2 border-white/30 transition-all"
        >
          <span className="text-4xl">🔊</span>
          <span className="text-base font-bold tracking-wide">Tap to hear welcome</span>
          <span className="text-xs text-white/60">Tap anywhere else to dismiss</span>
        </button>
      )}

      {dismissed && (
        <button
          onClick={toggleAudio}
          aria-label={voiceActive ? 'Stop' : 'Replay welcome'}
          className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-white bg-black/60 hover:bg-black/80 shadow-lg min-h-[44px]"
        >
          {voiceActive ? '🔊 Playing' : '▶ Replay'}
        </button>
      )}
    </div>
  );
}
