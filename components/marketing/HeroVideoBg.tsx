'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface HeroVideoBgProps {
  src: string;
  poster?: string;
  audioSrc?: string;
}

export function HeroVideoBg({ src, poster, audioSrc }: HeroVideoBgProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Detect reduced-motion preference after mount
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Autoplay video (muted — required by browsers)
  useEffect(() => {
    const v = videoRef.current;
    if (!v || reducedMotion) return;
    v.play().catch(() => {});
  }, [reducedMotion]);

  // Start audio from the beginning on first genuine user gesture (click or touch).
  // Audio is a voiceover script — it must always start from 0, not synced to
  // video position. The video is ambient b-roll and does not need to be in sync.
  // scroll is intentionally excluded — browsers do not treat scroll as a
  // user gesture for audio autoplay and the play() call silently fails.
  useEffect(() => {
    if (!audioSrc) return;
    const tryPlay = () => {
      const a = audioRef.current;
      if (!a) return;
      a.currentTime = 0;
      a.play().catch(() => {});
      setMuted(false);
    };
    window.addEventListener('click',      tryPlay, { once: true });
    window.addEventListener('touchstart', tryPlay, { once: true, passive: true });
    return () => {
      window.removeEventListener('click',      tryPlay);
      window.removeEventListener('touchstart', tryPlay);
    };
  }, [audioSrc]);

  function toggleMute() {
    const a = audioRef.current;
    if (muted) {
      // Resume from beginning — voiceover is a script, not synced to video
      if (a) { a.currentTime = 0; a.play().catch(() => {}); }
      setMuted(false);
    } else {
      if (a) { a.pause(); a.currentTime = 0; }
      setMuted(true);
    }
  }

  // Reduced-motion: show poster image only, no video
  if (reducedMotion) {
    return poster ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={poster}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 10 }}
      />
    ) : null;
  }

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 10 }}
      />

      {audioSrc && (
        <audio ref={audioRef} src={audioSrc} preload="none" aria-hidden="true" className="hidden" />
      )}

      {audioSrc && (
        <button
          onClick={toggleMute}
          aria-label={muted ? 'Unmute voiceover' : 'Mute voiceover'}
          className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-black/40 hover:bg-black/60 text-white text-xs font-semibold px-3 py-2 rounded-full transition-colors border border-white/30"
        >
          {muted ? (
            <><VolumeX className="w-4 h-4 flex-shrink-0" /><span className="hidden sm:inline">Tap to hear</span></>
          ) : (
            <><Volume2 className="w-4 h-4 flex-shrink-0 text-brand-red-400" /><span className="hidden sm:inline">Mute</span></>
          )}
        </button>
      )}
    </>
  );
}
