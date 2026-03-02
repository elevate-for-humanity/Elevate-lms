'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export default function OrientationAvatar() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = false;
    video.volume = 1;

    video.play().catch(() => {
      video.muted = true;
      setMuted(true);
      video.play().catch(() => {});
    });
  }, []);

  const handleTap = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.muted = false;
      video.volume = 1;
      video.play().then(() => setMuted(false)).catch(() => {});
    } else {
      video.muted = !video.muted;
      if (!video.muted) video.volume = 1;
      setMuted(video.muted);
    }
  };

  return (
    <div className="mb-6">
      <div
        className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 cursor-pointer max-w-2xl mx-auto"
        onClick={handleTap}
      >
        <video
          ref={videoRef}
          className="w-full aspect-video object-cover"
          playsInline
          autoPlay
          preload="auto"
        >
          <source src="/videos/orientation-full.mp4" type="video/mp4" />
        </video>
        {/* Elevate logo */}
        <div className="absolute bottom-2 right-2 bg-white/90 rounded-lg px-2 py-1 flex items-center gap-1.5 shadow-sm pointer-events-none">
          <Image src="/logo.png" alt="Elevate" width={20} height={20} />
          <span className="text-xs font-semibold text-slate-800">Elevate</span>
        </div>
        {muted && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/60 text-white px-5 py-3 rounded-xl text-base font-medium animate-pulse">
              Tap to unmute
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
