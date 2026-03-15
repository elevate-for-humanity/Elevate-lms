'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { Volume2, VolumeX } from 'lucide-react';
import { useHeroVideo } from '@/hooks/useHeroVideo';

export default function HomeHeroVideo() {
  const { videoRef } = useHeroVideo({ pauseOffScreen: false });
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const playedRef = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 1;

    function trigger() {
      if (playedRef.current) return;
      playedRef.current = true;
      audio!.play().then(() => setAudioPlaying(true)).catch(() => {});
      cleanup();
    }

    function cleanup() {
      window.removeEventListener('scroll', trigger, true);
      window.removeEventListener('wheel', trigger, true);
      window.removeEventListener('touchstart', trigger, true);
      window.removeEventListener('touchmove', trigger, true);
      window.removeEventListener('click', trigger, true);
      window.removeEventListener('keydown', trigger, true);
      document.removeEventListener('scroll', trigger, true);
    }

    // Every possible first-interaction event
    window.addEventListener('scroll',     trigger, { capture: true, passive: true });
    window.addEventListener('wheel',      trigger, { capture: true, passive: true });
    window.addEventListener('touchstart', trigger, { capture: true, passive: true });
    window.addEventListener('touchmove',  trigger, { capture: true, passive: true });
    window.addEventListener('click',      trigger, { capture: true, passive: true });
    window.addEventListener('keydown',    trigger, { capture: true, passive: true });
    document.addEventListener('scroll',   trigger, { capture: true, passive: true });

    return cleanup;
  }, []);

  function toggleAudio() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audioPlaying) {
      audio.pause();
      setAudioPlaying(false);
    } else {
      playedRef.current = true;
      audio.play().then(() => setAudioPlaying(true)).catch(() => {});
    }
  }

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
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/images/pages/home-hero-video.jpg"
        className="absolute inset-0 w-full h-full object-cover object-center"
      >
        <source src="/videos/homepage-hero-montage.mp4" type="video/mp4" />
      </video>
      <audio ref={audioRef} src="/audio/welcome-voiceover.mp3" preload="auto" aria-hidden="true" />

      <button
        onClick={toggleAudio}
        aria-label={audioPlaying ? 'Mute welcome message' : 'Unmute welcome message'}
        className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-black/50 hover:bg-black/70 text-white text-xs font-semibold px-3 py-2 rounded-full backdrop-blur-sm transition-all"
      >
        {audioPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        <span className="hidden sm:inline">{audioPlaying ? 'Playing' : 'Hear our story'}</span>
      </button>
    </div>
  );
}
