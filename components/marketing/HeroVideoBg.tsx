'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface HeroVideoBgProps {
  src: string;
  poster?: string; // kept for API compatibility — not rendered
  audioSrc?: string;
}

export function HeroVideoBg({ src, poster, audioSrc }: HeroVideoBgProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {});
  }, []);

  // Start audio on first genuine user gesture (click or touch).
  // scroll is intentionally excluded — browsers do not treat scroll as a
  // user gesture for audio autoplay and the play() call silently fails.
  useEffect(() => {
    if (!audioSrc) return;
    const tryPlay = () => {
      const a = audioRef.current;
      const v = videoRef.current;
      if (!a) return;
      a.currentTime = v?.currentTime ?? 0;
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
    const v = videoRef.current;
    const a = audioRef.current;
    if (!v) return;
    if (muted) {
      if (a) { a.currentTime = v.currentTime; a.play().catch(() => {}); }
      setMuted(false);
    } else {
      if (a) { a.pause(); a.currentTime = 0; }
      setMuted(true);
    }
  }

  return (
    <>
      {/* Video — no poster, dark bg shows until first frame loads */}
      <video
        ref={videoRef}
        src={src}
        muted
        loop
        playsInline
        autoPlay
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
