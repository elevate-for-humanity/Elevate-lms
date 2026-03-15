'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { useHeroVideo } from '@/hooks/useHeroVideo';
import { Volume2, VolumeX } from 'lucide-react';

export default function HomeHeroVideo() {
  const { videoRef } = useHeroVideo({ pauseOffScreen: false });
  const audioRef = useRef<HTMLAudioElement>(null);
  const playedRef = useRef(false);
  const [muted, setMuted] = useState(true);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!audioRef.current || playedRef.current) return;
    playedRef.current = true;
    const audio = audioRef.current;
    audio.volume = 1;

    // Try unmuted first
    audio.muted = false;
    audio.play().then(() => {
      setMuted(false);
      setStarted(true);
    }).catch(() => {
      // Browser blocked unmuted autoplay — play muted, show tap-to-hear button
      audio.muted = true;
      audio.play().then(() => {
        setStarted(true);
        setMuted(true);
      }).catch(() => {});
    });

    // Unlock on any user gesture
    const unlock = () => {
      if (!audioRef.current) return;
      audioRef.current.muted = false;
      audioRef.current.play().catch(() => {});
      setMuted(false);
    };
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
    window.addEventListener('scroll', unlock, { capture: true, passive: true, once: true } as EventListenerOptions);

    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('scroll', unlock, true);
    };
  }, []);

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (muted) {
      audioRef.current.muted = false;
      audioRef.current.play().catch(() => {});
      setMuted(false);
    } else {
      audioRef.current.muted = true;
      setMuted(true);
    }
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
        loop playsInline preload="auto"
        poster="/images/pages/home-hero-video.jpg"
        className="absolute inset-0 w-full h-full object-cover object-center hidden md:block"
      >
        <source src="/videos/homepage-hero-montage.mp4" type="video/mp4" />
      </video>
      <audio ref={audioRef} src="/audio/welcome-voiceover.mp3" preload="auto" aria-hidden="true" />

      {/* Shown when browser blocks autoplay audio */}
      {started && (
        <button
          onClick={toggleMute}
          aria-label={muted ? 'Unmute welcome message' : 'Mute welcome message'}
          className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-white/90 hover:bg-white text-slate-900 text-sm font-semibold px-3 py-2 rounded-full shadow-md transition-all min-h-[44px]"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          {muted ? 'Tap to hear' : 'Playing'}
        </button>
      )}
    </div>
  );
}
