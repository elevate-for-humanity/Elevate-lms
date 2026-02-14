'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, X, User, RotateCcw } from 'lucide-react';

interface AvatarVideoOverlayProps {
  videoSrc: string;
  avatarName?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'inline';
  autoPlay?: boolean;
  showOnLoad?: boolean;
  size?: 'small' | 'medium' | 'large';
  loop?: boolean;
}

export default function AvatarVideoOverlay({
  videoSrc,
  avatarName = 'AI Guide',
  position = 'bottom-right',
  autoPlay = false,
  showOnLoad = true,
  size = 'medium',
  loop = false,
}: AvatarVideoOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(showOnLoad);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [hasEnded, setHasEnded] = useState(false);

  const [isExpanded, setIsExpanded] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // Always try to play with sound - user initiated
    video.muted = false;
    video.volume = 1;
    
    if (autoPlay && isVisible) {
      video.play().catch(() => {
        // Autoplay blocked by browser - wait for user interaction
      });
    }
  }, [autoPlay, isVisible]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    setHasInteracted(true);
    setHasEnded(false);
    
    // Ensure audio is on when user plays
    video.muted = false;
    video.volume = 1;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleReplay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = 0;
    video.play();
    setHasEnded(false);
    setIsPlaying(true);
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setHasEnded(true);
  };



  const handleClose = () => {
    const video = videoRef.current;
    if (video) {
      video.pause();
    }
    setIsVisible(false);
    setIsPlaying(false);
  };

  const handleOpen = () => {
    setIsVisible(true);
  };

  // Position classes - fixed position options or inline
  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4',
    'top-right': 'fixed top-20 right-4',
    'top-left': 'fixed top-20 left-4',
    'inline': 'relative',
  };
  
  const isInline = position === 'inline';

  // Responsive sizes - larger for better visibility
  const sizeClasses = {
    small: isExpanded ? 'w-64 sm:w-80 h-36 sm:h-48' : 'w-52 sm:w-64 h-32 sm:h-40',
    medium: isExpanded ? 'w-72 sm:w-96 h-44 sm:h-56' : 'w-60 sm:w-80 h-36 sm:h-48',
    large: isExpanded ? 'w-80 sm:w-[28rem] h-48 sm:h-64' : 'w-72 sm:w-96 h-44 sm:h-56',
  };

  // Minimized button when closed
  if (!isVisible) {
    return (
      <button
        onClick={handleOpen}
        className={`${positionClasses[position]} z-[60] flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-full shadow-lg transition-all hover:scale-105`}
        aria-label="Open AI Guide"
      >
        <User className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-xs sm:text-sm font-medium hidden sm:inline">AI Guide</span>
      </button>
    );
  }

  return (
    <div
      className={`${positionClasses[position]} z-[60] ${sizeClasses[size]} transition-all duration-300 ease-out`}
    >
      {/* Video Container */}
      <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-slate-900">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          loop={loop}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={handleVideoEnd}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>



        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-all"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>


          </div>

          {/* Avatar name */}
          <span className="text-white text-xs font-medium bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
            {avatarName}
          </span>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full text-white transition-all"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Expand/Collapse button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute top-2 left-2 p-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full text-white transition-all text-xs"
          aria-label={isExpanded ? 'Minimize' : 'Expand'}
        >
          {isExpanded ? '−' : '+'}
        </button>

        {/* Play overlay when not started */}
        {!hasInteracted && !autoPlay && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
            onClick={togglePlay}
          >
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-brand-blue-600 ml-1" />
            </div>
          </div>
        )}

        {/* Replay overlay when video ended */}
        {hasEnded && !loop && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer"
            onClick={handleReplay}
          >
            <div className="text-center">
              <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform mx-auto mb-2">
                <RotateCcw className="w-6 h-6 text-brand-blue-600" />
              </div>
              <span className="text-white text-sm font-medium">Watch Again</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
