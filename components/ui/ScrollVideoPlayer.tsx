'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface ScrollVideoPlayerProps {
  /** Video source URL - does NOT auto-play, only loads on scroll */
  src?: string;
  /** Poster image shown before video loads */
  poster?: string;
  /** Additional CSS classes */
  className?: string;
  /** Video aspect ratio */
  aspectRatio?: '16:9' | '21:9' | '4:3' | '1:1';
  /** Auto-play when scrolled into view (default: true) */
  autoPlayOnScroll?: boolean;
  /** Mute audio (default: true) */
  muted?: boolean;
  /** Show play button overlay */
  showPlayButton?: boolean;
  /** Custom onVideoEnd callback */
  onEnded?: () => void;
}

/**
 * ScrollVideoPlayer - Smart Video Component
 * 
 * Key behaviors:
 * - ✅ Plays video when 50% visible in viewport
 * - ✅ Pauses when scrolled out of view
 * - ✅ Does NOT loop (plays once)
 * - ✅ Stops when user navigates away (page hidden)
 * - ✅ Only loads when scrolled near viewport
 * - ✅ Shows poster until video starts
 * 
 * NO RUNTIME LOOPING - video stops after completion
 */
export default function ScrollVideoPlayer({
  src,
  poster,
  className = '',
  aspectRatio = '16:9',
  autoPlayOnScroll = true,
  muted = true,
  showPlayButton = true,
  onEnded,
}: ScrollVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPoster, setShowPoster] = useState(true);
  
  // Intersection observer for scroll detection
  useEffect(() => {
    if (!autoPlayOnScroll || !src) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            setIsVisible(true);
          } else {
            setIsVisible(false);
            if (videoRef.current && !videoRef.current.paused) {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '0px' }
    );
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, [autoPlayOnScroll, src]);
  
  // Handle visibility changes (tab/window)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);
  
  // Auto-play when visible
  useEffect(() => {
    if (!isVisible || !src || !autoPlayOnScroll) return;
    
    const video = videoRef.current;
    if (!video) return;
    
    const playVideo = async () => {
      try {
        setShowPoster(false);
        await video.play();
        setIsPlaying(true);
      } catch {
        setShowPoster(true);
      }
    };
    
    playVideo();
  }, [isVisible, src, autoPlayOnScroll]);
  
  const handleLoadedMetadata = useCallback(() => setIsLoaded(true), []);
  
  const handleVideoEnded = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setShowPoster(true);
    onEnded?.();
  }, [onEnded]);
  
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setShowPoster(false);
  }, []);
  
  const handlePause = useCallback(() => setIsPlaying(false), []);
  
  const handleManualPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      await video.play();
      setIsPlaying(true);
      setShowPoster(false);
    } catch (err) {
      console.warn('Play failed:', err);
    }
  }, []);
  
  const aspectStyles = {
    '16:9': 'aspect-video',
    '21:9': 'aspect-[21/9]',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
  };
  
  if (!src) {
    return poster ? (
      <div className={`relative overflow-hidden rounded-lg ${aspectStyles[aspectRatio]} ${className}`}>
        <img src={poster} alt="" className="absolute inset-0 w-full h-full object-cover" />
      </div>
    ) : null;
  }
  
  return (
    <div ref={containerRef} className={`relative overflow-hidden rounded-lg bg-slate-900 ${aspectStyles[aspectRatio]} ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted={muted}
        playsInline
        preload="none"
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleVideoEnded}
        onPlay={handlePlay}
        onPause={handlePause}
        className="absolute inset-0 w-full h-full object-cover"
        loop={false}
        controls={false}
      />
      
      {showPoster && poster && (
        <div className="absolute inset-0 cursor-pointer" onClick={handleManualPlay}>
          <img src={poster} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30" />
          {showPlayButton && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white transition-colors">
                <svg className="w-8 h-8 text-slate-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
        </div>
      )}
      
      {isVisible && !isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

/** Hero Video - auto-plays on mount, pauses on page change */
export function HeroVideoPlayer({ src, poster, className = '' }: { src: string; poster?: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    video.play().catch(() => {});
    
    const handleVisibility = () => {
      if (document.hidden) video.pause();
      else video.play().catch(() => {});
    };
    
    document.addEventListener('visibilitychange', handleVisibility);
    
    return () => {
      video.pause();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);
  
  if (!src) return null;
  
  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        muted
        playsInline
        loop={false}
        controls={false}
        className="w-full h-full object-cover"
        onEnded={(e) => { (e.target as HTMLVideoElement).style.opacity = '1'; }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
