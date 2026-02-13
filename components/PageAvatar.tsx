'use client';

import { useRef, useState } from 'react';
import { Play, Volume2, VolumeX } from 'lucide-react';

interface PageAvatarProps {
  videoSrc: string;
  voiceoverSrc?: string;
  title?: string;
  position?: 'default' | 'inline';
  loop?: boolean;
}

export default function PageAvatar({ videoSrc, title, position = 'default', loop = false }: PageAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [showPlay, setShowPlay] = useState(false);

  const handlePlay = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = false;
      setIsMuted(false);
      video.play();
      setShowPlay(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  };

  if (position === 'inline') {
    return (
      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-black relative">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src={videoSrc}
          autoPlay
          muted
          loop={loop}
          playsInline
          preload="auto"
          onPause={() => setShowPlay(true)}
        />
        <button
          onClick={toggleMute}
          className="absolute bottom-1 right-1 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-xl bg-black relative aspect-video">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src={videoSrc}
        autoPlay
        muted
        loop={loop}
        playsInline
        preload="auto"
        onPause={() => setShowPlay(true)}
        onPlay={() => setShowPlay(false)}
      />
      {showPlay && (
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/30 transition-colors z-20"
        >
          <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-10 h-10 text-slate-900 ml-1" fill="currentColor" />
          </div>
        </button>
      )}
      <button
        onClick={toggleMute}
        className="absolute bottom-4 left-4 p-3 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors z-20"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
      {title && (
        <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
          <span className="bg-black/70 text-white text-xs font-medium rounded px-2 py-1">{title}</span>
        </div>
      )}
    </div>
  );
}
