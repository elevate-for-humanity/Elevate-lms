'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export function CareerHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const unmutedRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const play = async () => {
      try { await video.play(); setIsPlaying(true); } catch { /* poster visible */ }
    };
    if (video.readyState >= 2) play();
    else video.addEventListener('canplay', play, { once: true });
    return () => video.removeEventListener('canplay', play);
  }, []);

  const unmute = useCallback(() => {
    const video = videoRef.current;
    if (!video || unmutedRef.current) return;
    unmutedRef.current = true;
    video.muted = false;
    setIsMuted(false);
    if (video.paused) video.play().then(() => setIsPlaying(true)).catch(() => {});
  }, []);

  useEffect(() => {
    const h = () => { unmute(); window.removeEventListener('scroll', h); window.removeEventListener('touchstart', h); window.removeEventListener('click', h); };
    window.addEventListener('scroll', h, { once: true, passive: true });
    window.addEventListener('touchstart', h, { once: true, passive: true });
    window.addEventListener('click', h, { once: true });
    return () => { window.removeEventListener('scroll', h); window.removeEventListener('touchstart', h); window.removeEventListener('click', h); };
  }, [unmute]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) { video.muted = false; setIsMuted(false); unmutedRef.current = true; if (video.paused) video.play().then(() => setIsPlaying(true)).catch(() => {}); }
    else { video.muted = true; setIsMuted(true); }
  };

  return (
    <section className="relative h-[50vh] min-h-[350px] overflow-hidden">
      <video ref={videoRef} autoPlay loop muted playsInline preload="auto" className="absolute inset-0 w-full h-full object-cover">
        <source src="https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/career-services-hero.mp4" type="video/mp4" />
      </video>
      {isPlaying && (
        <button onClick={toggleMute} className="absolute bottom-4 right-4 z-20 flex items-center gap-2 px-4 py-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white rounded-full transition-colors shadow-lg" aria-label={isMuted ? 'Unmute video' : 'Mute video'}>
          {isMuted ? (<><VolumeX className="w-5 h-5" /><span className="text-sm font-semibold hidden sm:inline">Tap for Sound</span></>) : (<><Volume2 className="w-5 h-5" /><span className="text-sm font-semibold hidden sm:inline">Sound On</span></>)}
        </button>
      )}
    </section>
  );
}
