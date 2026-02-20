'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function ProgramsHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const play = async () => {
      try { await video.play(); setIsPlaying(true); } catch { /* poster visible */ }
    };
    if (video.readyState >= 2) play();
    else video.addEventListener('loadeddata', play, { once: true });
    return () => video.removeEventListener('loadeddata', play);
  }, []);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.muted = false;
      setIsMuted(false);
      if (video.paused) video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  return (
    <>
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover brightness-110" loop muted playsInline autoPlay preload="metadata" poster="/images/artlist/hero-training-3.jpg">
        <source src="https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/programs-overview-video-with-narration.mp4" type="video/mp4" />
      </video>
      {isPlaying && (
        <button
          onClick={toggleMute}
          className={`absolute z-20 flex items-center gap-2 backdrop-blur-sm text-white rounded-full shadow-lg transition-all ${
            isMuted
              ? 'bottom-6 right-6 px-5 py-3 bg-brand-red-600 hover:bg-brand-red-700 animate-pulse'
              : 'bottom-4 right-4 px-4 py-2.5 bg-black/60 hover:bg-black/80'
          }`}
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
        >
          {isMuted ? (
            <><VolumeX className="w-5 h-5" /><span className="text-sm font-bold">Tap for Sound</span></>
          ) : (
            <><Volume2 className="w-5 h-5" /><span className="text-sm font-semibold hidden sm:inline">Sound On</span></>
          )}
        </button>
      )}
    </>
  );
}
