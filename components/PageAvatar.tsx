'use client';

import { useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface PageAvatarProps {
  videoSrc: string;
  title?: string;
  position?: 'default' | 'inline';
  loop?: boolean;
}

export default function PageAvatar({ videoSrc, title, position = 'default', loop = false }: PageAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // User clicks play → video starts WITH sound (browser allows on user gesture)
  const handlePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    video.play()
      .then(() => {
        setIsPlaying(true);
        setHasStarted(true);
        setIsMuted(false);
      })
      .catch(() => {
        // Fallback: if browser still blocks, try muted
        video.muted = true;
        video.play()
          .then(() => {
            setIsPlaying(true);
            setHasStarted(true);
            setIsMuted(true);
          })
          .catch(() => {});
      });
  };

  const handlePause = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setIsPlaying(false);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  if (position === 'inline') {
    return (
      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-900 relative cursor-pointer" onClick={hasStarted ? (isPlaying ? handlePause : handlePlay) : handlePlay}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src={videoSrc}
          loop={loop}
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
    <div className="w-full rounded-2xl overflow-hidden shadow-xl bg-slate-900 relative aspect-video">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src={videoSrc}
        loop={loop}
        playsInline
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
      {/* Play button — shown when not playing */}
      {!isPlaying && (
        <button
          onClick={handlePlay}
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors cursor-pointer"
          aria-label="Play video"
        >
          <span className="flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white text-base font-bold rounded-full px-6 py-3 transition-colors shadow-lg">
            <Play className="w-6 h-6 fill-white" />
            {hasStarted ? 'Resume' : 'Play'}
          </span>
        </button>
      )}
      {/* Controls — shown when playing */}
      {isPlaying && (
        <div className="absolute bottom-3 left-3 z-20 flex gap-2">
          <button
            onClick={handlePause}
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
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
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
