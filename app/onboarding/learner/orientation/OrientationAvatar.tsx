'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import LogoImage from '@/components/site/LogoImage';
import { Volume2, VolumeX } from 'lucide-react';

export default function OrientationAvatar() {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Start muted — browsers block unmuted autoplay. User taps to unmute.
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  // Autoplay muted on mount (always succeeds in all browsers)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => {});
  }, []);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    video.muted = !video.muted;
    video.volume = 1;
    setMuted(video.muted);
  };

  return (
    <div className="mb-6">
      <div
        className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 cursor-pointer max-w-2xl mx-auto"
        onClick={toggleMute}
      >
        <video
          ref={videoRef}
          className="w-full aspect-video object-cover"
          playsInline
          muted
          preload="metadata"
          onPlaying={() => setPlaying(true)}
        >
          <source src="/videos/orientation-full.mp4" type="video/mp4" />
        </video>

        {/* Unmute prompt — shown until user taps, only once video is playing */}
        {muted && playing && (
          <div className="absolute inset-0 flex items-end justify-center pb-12 pointer-events-none">
            <div className="flex items-center gap-2 bg-black/70 text-white px-5 py-3 rounded-xl text-sm font-semibold backdrop-blur-sm animate-pulse">
              <Volume2 className="w-4 h-4 flex-shrink-0" />
              Tap to hear the audio
            </div>
          </div>
        )}

        {/* Mute/unmute button — bottom right */}
        {playing && (
          <button
            onClick={(e) => { e.stopPropagation(); toggleMute(); }}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 bg-black/60 hover:bg-black/80 text-white text-xs font-semibold px-3 py-2 rounded-full transition-colors backdrop-blur-sm border border-white/20"
          >
            {muted
              ? <><VolumeX className="w-3.5 h-3.5" /> Unmute</>
              : <><Volume2 className="w-3.5 h-3.5 text-emerald-400" /> Mute</>
            }
          </button>
        )}

        {/* Brand bug — bottom left */}
        <div className="absolute bottom-3 left-3 bg-white/90 rounded-lg px-2 py-1 flex items-center gap-1.5 shadow-sm pointer-events-none">
          <LogoImage alt="Elevate" width={16} height={16} />
          <span className="text-xs font-semibold text-slate-800">Elevate</span>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 mt-2">
        10-minute orientation · tap the video to unmute
      </p>
    </div>
  );
}
