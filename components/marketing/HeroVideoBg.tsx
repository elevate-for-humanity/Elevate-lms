'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface HeroVideoBgProps {
  src: string;
  poster?: string;
  /** Voiceover caption shown when unmuted. Pass the short 30-sec script. */
  caption?: string;
}

/**
 * Full-bleed background video for hero sections.
 *
 * - Starts muted (browser autoplay requirement)
 * - Mute/unmute button always visible — bottom-right
 * - When unmuted, shows a caption strip with the voiceover script
 * - Respects prefers-reduced-motion (shows poster only)
 */
export function HeroVideoBg({ src, poster, caption }: HeroVideoBgProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Autoplay on mount — hero is always above the fold
  useEffect(() => {
    if (reducedMotion || failed) return;
    videoRef.current?.play().catch(() => {});
  }, [reducedMotion, failed]);

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    if (!v.muted && v.paused) v.play().catch(() => {});
    setMuted(v.muted);
  }

  if (reducedMotion || failed) {
    return poster ? (
      <img src={poster} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
    ) : null;
  }

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        poster={poster}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        onError={() => setFailed(true)}
      />

      {/* Mute toggle — always visible, prominent */}
      <button
        onClick={toggleMute}
        aria-label={muted ? 'Unmute video' : 'Mute video'}
        title={muted ? 'Click to hear the voiceover' : 'Mute'}
        className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white text-xs font-semibold px-3 py-2 rounded-full transition-colors backdrop-blur-sm border border-white/20"
      >
        {muted ? (
          <>
            <VolumeX className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Tap to hear</span>
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4 flex-shrink-0 text-brand-red-400" />
            <span className="hidden sm:inline">Mute</span>
          </>
        )}
      </button>

      {/* Caption strip — shown when unmuted and a script is provided */}
      {caption && !muted && (
        <div className="absolute bottom-16 left-4 right-20 z-20 pointer-events-none">
          <p className="bg-black/75 text-white text-xs sm:text-sm leading-relaxed px-4 py-3 rounded-lg backdrop-blur-sm max-w-xl">
            {caption}
          </p>
        </div>
      )}
    </>
  );
}
