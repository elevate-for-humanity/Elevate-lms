'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

export interface HeroBanner {
  pageKey: string;
  videoSrcDesktop?: string;
  videoSrcMobile?: string;
  posterImage?: string;
  voiceoverSrc?: string;
  microLabel?: string;
  belowHeroHeadline: string;
  belowHeroSubheadline: string;
  primaryCta: { label: string; href: string; variant?: string };
  secondaryCta?: { label: string; href: string; variant?: string };
  trustIndicators?: string[];
  transcript?: string;
  analyticsName: string;
}

export interface HomeHeroVideoProps {
  banner: HeroBanner;
}

export default function HomeHeroVideo({ banner }: HomeHeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceoverRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  const videoSrc = banner.videoSrcMobile || banner.videoSrcDesktop;

  useEffect(() => {
    if (videoRef.current && videoSrc) {
      videoRef.current.play().catch(() => {});
    }
  }, [videoSrc]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.muted = false;
        if (banner.voiceoverSrc && voiceoverRef.current) {
          voiceoverRef.current.play().catch(() => {});
        }
      } else {
        videoRef.current.muted = true;
        if (voiceoverRef.current) {
          voiceoverRef.current.pause();
        }
      }
      setIsMuted(!isMuted);
    }
  };

  if (!videoSrc) {
    return (
      <section className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden bg-gradient-to-br from-slate-900 via-brand-red-900/20 to-slate-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white max-w-4xl px-4">
            <p className="text-sm uppercase tracking-wider text-brand-red-400 mb-4">{banner.microLabel}</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">{banner.belowHeroHeadline}</h1>
            <p className="text-xl sm:text-2xl mb-8 max-w-2xl mx-auto">{banner.belowHeroSubheadline}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={banner.primaryCta.href}
                className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-lg transition"
              >
                {banner.primaryCta.label}
              </a>
              {banner.secondaryCta && (
                <a
                  href={banner.secondaryCta.href}
                  className="inline-block border-2 border-white text-white font-bold px-8 py-4 rounded-lg hover:bg-white hover:text-slate-900 transition"
                >
                  {banner.secondaryCta.label}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden bg-slate-900">
      {/* Video */}
      <video
        ref={videoRef}
        src={videoSrc}
        poster={banner.posterImage}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Fallback gradient if no poster */}
      {!banner.posterImage && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-brand-red-900/30 to-slate-900" />
      )}
      
      <audio ref={voiceoverRef} src={banner.voiceoverSrc} preload="none" />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl">
            {banner.microLabel && (
              <p className="text-sm uppercase tracking-wider text-brand-red-400 font-semibold mb-4">
                {banner.microLabel}
              </p>
            )}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              {banner.belowHeroHeadline}
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl">
              {banner.belowHeroSubheadline}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={banner.primaryCta.href}
                className="inline-flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-lg transition shadow-lg shadow-brand-red-900/50"
              >
                {banner.primaryCta.label}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              {banner.secondaryCta && (
                <a
                  href={banner.secondaryCta.href}
                  className="inline-flex items-center justify-center gap-2 border-2 border-white/50 text-white font-bold px-8 py-4 rounded-lg hover:bg-white hover:text-slate-900 transition"
                >
                  {banner.secondaryCta.label}
                </a>
              )}
            </div>
            {banner.trustIndicators && (
              <div className="flex flex-wrap gap-4 mt-6">
                {banner.trustIndicators.map((indicator) => (
                  <span key={indicator} className="text-sm text-white/70 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-red-400" />
                    {indicator}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 right-6 flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="p-3 rounded-full bg-black/40 hover:bg-black/60 text-white transition backdrop-blur-sm"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button
          onClick={toggleMute}
          className="p-3 rounded-full bg-black/40 hover:bg-black/60 text-white transition backdrop-blur-sm"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>
    </section>
  );
}
