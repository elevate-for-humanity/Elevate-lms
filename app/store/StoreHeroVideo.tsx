'use client';

import { useRef, useEffect, useState } from 'react';
import { Volume2, VolumeX, RotateCcw } from 'lucide-react';

/**
 * Autoplay muted hero video for the store page.
 * Primary: store-demo-narrated.mp4. Fallback: store-demo.mp4.
 * Falls back to poster image on error.
 */
export default function StoreHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [hasEnded, setHasEnded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {
      // Autoplay blocked — poster remains visible
    });
  }, []);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const replay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {});
    setHasEnded(false);
  };

  return (
    <div className="relative max-w-2xl mx-auto mb-8">
      <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 bg-slate-900">
        {!hasError && (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
            poster="/images/pages/store-licensing-hero.jpg"
            onLoadedData={() => setIsLoaded(true)}
            onEnded={() => setHasEnded(true)}
            onError={() => setHasError(true)}
          >
            <source src="/videos/store-demo-narrated.mp4" type="video/mp4" />
            <source src="/videos/store-demo.mp4" type="video/mp4" />
          </video>
        )}

        {/* Loading spinner */}
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-brand-red-500" />
          </div>
        )}

        {/* Fallback poster on video error */}
        {hasError && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url(/images/pages/store-licensing-hero.jpg)' }}
          />
        )}

        {/* Replay overlay */}
        {hasEnded && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer"
            onClick={replay}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform mx-auto mb-2">
                <RotateCcw className="w-8 h-8 text-brand-red-600" />
              </div>
              <span className="text-white text-sm font-medium">Watch Again</span>
            </div>
          </div>
        )}

        {/* Mute toggle */}
        {isLoaded && !hasEnded && !hasError && (
          <button
            onClick={toggleMute}
            className="absolute bottom-3 right-3 p-2 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted
              ? <VolumeX className="w-4 h-4 text-white" />
              : <Volume2 className="w-4 h-4 text-white" />
            }
          </button>
        )}
      </div>
      <p className="text-slate-500 text-sm mt-3 text-center">
        Platform walkthrough — 2 min overview
      </p>
    </div>
  );
}
