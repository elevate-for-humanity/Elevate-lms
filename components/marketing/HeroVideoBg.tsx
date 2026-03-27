'use client';

import { useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

/**
 * Background video for the homepage hero with a mute/unmute toggle.
 * Starts muted (browser autoplay requirement). User can unmute.
 */
export function HeroVideoBg({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  function toggleSound() {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuted(videoRef.current.muted);
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
        className="absolute inset-0 w-full h-full object-cover"
      />
      <button
        onClick={toggleSound}
        aria-label={muted ? 'Unmute video' : 'Mute video'}
        className="absolute bottom-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
      >
        {muted
          ? <VolumeX className="w-5 h-5 text-white" />
          : <Volume2 className="w-5 h-5 text-white" />
        }
      </button>
    </>
  );
}
