'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export interface HeroBanner {
  videoSrc: string;
  posterSrc: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaHref: string;
  voiceoverSrc?: string;
}

export interface HomeHeroVideoProps {
  banner: HeroBanner;
}

export default function HomeHeroVideo({ banner }: HomeHeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceoverRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [voiceActive, setVoiceActive] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.muted = false;
        if (banner.voiceoverSrc && voiceoverRef.current) {
          voiceoverRef.current.play().catch(() => {});
        }
        setVoiceActive(true);
      } else {
        videoRef.current.muted = true;
        if (voiceoverRef.current) {
          voiceoverRef.current.pause();
        }
        setVoiceActive(false);
      }
      setIsMuted(!isMuted);
    }
  };

  return (
    <section className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden bg-slate-900">
      <video
        ref={videoRef}
        src={banner.videoSrc}
        poster={banner.posterSrc}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      <audio ref={voiceoverRef} src={banner.voiceoverSrc} preload="none" />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white max-w-4xl px-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">{banner.headline}</h1>
          <p className="text-xl sm:text-2xl mb-8">{banner.subheadline}</p>
          <a
            href={banner.ctaHref}
            className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-lg transition"
          >
            {banner.ctaText}
          </a>
        </div>
      </div>

      <button
        onClick={toggleMute}
        className="absolute bottom-4 right-4 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
      </button>
    </section>
  );
}
