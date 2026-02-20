'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface PageAvatarProps {
  videoSrc: string;
  title?: string;
  position?: 'default' | 'inline';
  loop?: boolean;
}

/**
 * Video avatar that auto-plays when scrolled into view.
 * Starts muted (browser autoplay policy), shows tap-to-unmute prompt.
 * Pauses when scrolled out of view.
 */
export default function PageAvatar({ videoSrc, title, position = 'default', loop = false }: PageAvatarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Scroll-triggered visibility
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Auto-play when visible, pause when not
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isVisible) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else if (!video.paused) {
      video.pause();
      setIsPlaying(false);
    }
  }, [isVisible]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const unmute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    setIsMuted(false);
    setHasInteracted(true);
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    setHasInteracted(true);
  }, []);

  if (position === 'inline') {
    return (
      <div
        ref={containerRef}
        className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-900 relative cursor-pointer"
        onClick={isMuted && !hasInteracted ? unmute : togglePlay}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src={videoSrc}
          loop={loop}
          muted
          playsInline
          preload="auto"
        />
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play className="w-6 h-6 text-white fill-white" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full rounded-2xl overflow-hidden shadow-xl bg-slate-900 relative aspect-video">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src={videoSrc}
        loop={loop}
        muted
        playsInline
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Tap to unmute — shown when playing muted before user interaction */}
      {isPlaying && isMuted && !hasInteracted && (
        <button
          onClick={unmute}
          className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer"
          aria-label="Tap to unmute"
        >
          <span className="flex items-center gap-2 bg-black/70 hover:bg-black/80 text-white text-sm font-semibold rounded-full px-5 py-2.5 transition-colors shadow-lg backdrop-blur-sm">
            <VolumeX className="w-5 h-5" />
            Tap to unmute
          </span>
        </button>
      )}

      {/* Play button — shown when paused */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors cursor-pointer"
          aria-label="Play video"
        >
          <span className="flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white text-base font-bold rounded-full px-6 py-3 transition-colors shadow-lg">
            <Play className="w-6 h-6 fill-white" />
            Play
          </span>
        </button>
      )}

      {/* Controls — shown after user has interacted */}
      {isPlaying && hasInteracted && (
        <div className="absolute bottom-3 left-3 z-20 flex gap-2">
          <button
            onClick={togglePlay}
            className="p-2 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
            title="Pause"
          >
            <Pause className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={toggleMute}
            className="p-2 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
          </button>
        </div>
      )}

      {title && (
        <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
          <span className="bg-black/70 text-white text-xs font-medium rounded px-2 py-1">{title}</span>
        </div>
      )}
    </div>
  );
}
