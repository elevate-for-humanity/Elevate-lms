'use client';

import { useState, useRef } from 'react';
import { Play, Volume2, VolumeX, RotateCcw } from 'lucide-react';

export default function StoreHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const playVideo = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = false;
      video.volume = 1;
      video.play();
      setIsPlaying(true);
      setHasEnded(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const replayVideo = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.muted = false;
      video.volume = 1;
      video.play();
      setHasEnded(false);
      setIsPlaying(true);
    }
  };

  return (
    <div className="relative max-w-2xl mx-auto mb-8">
      <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 bg-slate-800">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => { setHasEnded(true); setIsPlaying(false); }}
          onLoadedData={() => setIsLoaded(true)}
        >
          <source src="https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/avatars/store-assistant.mp4" type="video/mp4" />
        </video>

        {/* Loading state */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
          </div>
        )}

        {/* Play overlay - show when not playing */}
        {!isPlaying && !hasEnded && isLoaded && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
            onClick={playVideo}
          >
            <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <Play className="w-10 h-10 text-brand-blue-600 ml-1" />
            </div>
          </div>
        )}

        {/* Replay overlay */}
        {hasEnded && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer"
            onClick={replayVideo}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform mx-auto mb-2">
                <RotateCcw className="w-8 h-8 text-brand-blue-600" />
              </div>
              <span className="text-white text-sm font-medium">Watch Again</span>
            </div>
          </div>
        )}

        {/* Controls - only show when playing */}
        {isPlaying && !hasEnded && (
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <button
              onClick={toggleMute}
              className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-all"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
            
            <span className="text-white text-sm font-medium bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
              Store Guide
            </span>
            
            <div className="w-12" />
          </div>
        )}
      </div>
      
      <p className="text-slate-400 text-sm mt-3">
        Watch our guide explain what&apos;s available in the store
      </p>
    </div>
  );
}
