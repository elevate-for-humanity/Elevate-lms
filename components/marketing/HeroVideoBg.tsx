'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface HeroVideoBgProps {
  src: string;
  poster?: string;
  /** Separate MP3 voiceover — starts on first user interaction */
  audioSrc?: string;
}

export function HeroVideoBg({ src, poster, audioSrc }: HeroVideoBgProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Load video after mount so it does not block initial page paint.
  // Poster stays visible (z-0) until video is playing — video fades in over it.
  useEffect(() => {
    if (reducedMotion) return;
    const v = videoRef.current;
    if (!v) return;
    const onCanPlay = () => {
      v.play().catch(() => {});
    };
    const onPlaying = () => {
      // Only mark ready once video is actually playing, not just buffered.
      // This keeps the poster visible until the first frame is on screen.
      setVideoReady(true);
    };
    v.addEventListener('canplay', onCanPlay, { once: true });
    v.addEventListener('playing', onPlaying, { once: true });
    v.src = src;
    v.load();
    return () => {
      v.removeEventListener('canplay', onCanPlay);
      v.removeEventListener('playing', onPlaying);
    };
  }, [reducedMotion, src]);

  // Start audio on first user interaction — browser autoplay policy
  useEffect(() => {
    if (reducedMotion) return;
    const tryPlay = () => {
      const a = audioRef.current;
      const v = videoRef.current;
      if (!a) return;
      a.currentTime = v?.currentTime ?? 0;
      a.play().catch(() => {});
      setMuted(false);
    };
    window.addEventListener('touchstart', tryPlay, { once: true, passive: true });
    window.addEventListener('scroll', tryPlay, { once: true, passive: true });
    window.addEventListener('click', tryPlay, { once: true });
    return () => {
      window.removeEventListener('touchstart', tryPlay);
      window.removeEventListener('scroll', tryPlay);
      window.removeEventListener('click', tryPlay);
    };
  }, [reducedMotion]);

  function toggleMute() {
    const v = videoRef.current;
    const a = audioRef.current;
    if (!v || !a) return;
    if (muted) {
      a.currentTime = v.currentTime;
      a.play().catch(() => {});
      setMuted(false);
    } else {
      a.pause();
      a.currentTime = 0;
      setMuted(true);
    }
  }

  return (
    <>
      {/* Poster — always visible until video is playing. fetchPriority=high for LCP. */}
      {poster && (
        <img
          src={poster}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-700 ${videoReady ? 'opacity-0' : 'opacity-100'}`}
        />
      )}

      {/* Video — fades in once playing. No autoPlay attr (src set dynamically). */}
      {!reducedMotion && (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          poster={poster}
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-700 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
        />
      )}

      {/* Voiceover — preload none, only fetched on interaction */}
      {audioSrc && (
        <audio ref={audioRef} src={audioSrc} preload="none" aria-hidden="true" />
      )}

      {/* Mute toggle */}
      <button
        onClick={toggleMute}
        aria-label={muted ? 'Unmute voiceover' : 'Mute voiceover'}
        className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white text-xs font-semibold px-3 py-2 rounded-full transition-colors backdrop-blur-sm border border-white/20"
      >
        {muted ? (
          <><VolumeX className="w-4 h-4 flex-shrink-0" /><span className="hidden sm:inline">Tap to hear</span></>
        ) : (
          <><Volume2 className="w-4 h-4 flex-shrink-0 text-brand-red-400" /><span className="hidden sm:inline">Mute</span></>
        )}
      </button>
    </>
  );
}
