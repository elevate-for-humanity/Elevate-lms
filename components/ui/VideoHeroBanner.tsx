'use client';

import { useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import CanonicalVideo from '@/components/video/CanonicalVideo';

interface VideoHeroBannerProps {
  videoSrc: string;
  posterSrc: string;
  posterAlt?: string;
  /** Voiceover caption shown when unmuted */
  caption?: string;
}

export default function VideoHeroBanner({ videoSrc, posterSrc, caption }: VideoHeroBannerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);

  function toggleMute() {
    const video = wrapperRef.current?.querySelector('video');
    if (!video) return;
    video.muted = !video.muted;
    if (!video.muted && video.paused) video.play().catch(() => {});
    setMuted(video.muted);
  }

  return (
    <div ref={wrapperRef} className="absolute inset-0 w-full h-full">
      <CanonicalVideo
        src={videoSrc}
        poster={posterSrc as `/${string}`}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlayOnMount
      />

      <button
        onClick={toggleMute}
        aria-label={muted ? 'Unmute video' : 'Mute video'}
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

      {caption && !muted && (
        <div className="absolute bottom-16 left-4 right-20 z-20 pointer-events-none">
          <p className="bg-black/75 text-white text-xs sm:text-sm leading-relaxed px-4 py-3 rounded-lg backdrop-blur-sm max-w-xl">
            {caption}
          </p>
        </div>
      )}
    </div>
  );
}
