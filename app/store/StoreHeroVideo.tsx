'use client';

import { useState, useRef } from 'react';
import { RotateCcw } from 'lucide-react';

export default function StoreHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasEnded, setHasEnded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const replayVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {});
    setHasEnded(false);
  };

  return (
    <div className="relative max-w-2xl mx-auto mb-8">
      <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 bg-white">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="metadata"
          poster="/images/pages/store-hero.jpg"
          onEnded={() => setHasEnded(true)}
          onLoadedData={() => setIsLoaded(true)}
        >
          <source src="/videos/avatars/store-assistant.mp4" type="video/mp4" />
        </video>

        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-blue-200 border-t-brand-blue-600" />
          </div>
        )}

        {hasEnded && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-white/50 cursor-pointer"
            onClick={replayVideo}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform mx-auto mb-2">
                <RotateCcw className="w-8 h-8 text-brand-blue-600" />
              </div>
              <span className="text-slate-900 text-sm font-medium">Watch Again</span>
            </div>
          </div>
        )}
      </div>
      <p className="text-slate-600 text-sm mt-3">
        Watch our guide explain what&apos;s available in the store
      </p>
    </div>
  );
}
