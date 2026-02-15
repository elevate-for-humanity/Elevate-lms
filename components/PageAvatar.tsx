'use client';

import { useRef, useState, useEffect } from 'react';
import { Play } from 'lucide-react';

interface PageAvatarProps {
  videoSrc: string;
  title?: string;
  position?: 'default' | 'inline';
  loop?: boolean;
}

export default function PageAvatar({ videoSrc, title, position = 'default', loop = false }: PageAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = async () => {
      video.muted = true;
      video.playsInline = true;
      try {
        await video.play();
        setIsPlaying(true);
      } catch {
        // Autoplay blocked — play button will show
      }
    };

    tryPlay();

    const handleInteraction = () => tryPlay();
    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('touchstart', handleInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  const handlePlay = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  if (position === 'inline') {
    return (
      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-900 relative">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src={videoSrc}
          muted
          autoPlay
          loop={loop}
          playsInline
          preload="auto"
        />
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-xl bg-slate-900 relative aspect-video">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src={videoSrc}
        muted
        autoPlay
        loop={loop}
        playsInline
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      {!isPlaying && (
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/30 transition-colors z-20"
        >
          <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-10 h-10 text-slate-900 ml-1" fill="currentColor" />
          </div>
        </button>
      )}
      {title && (
        <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
          <span className="bg-black/70 text-white text-xs font-medium rounded px-2 py-1">{title}</span>
        </div>
      )}
    </div>
  );
}
