'use client';

/**
 * HomeHeroVideo — full-width hero video for marketing pages.
 *
 * Rules (non-negotiable):
 * - No gradient overlays on the video frame.
 * - No headline, subheadline, paragraph, or CTA on top of the video.
 * - All primary messaging renders in the below-video content slot.
 * - Only allowed on-video elements: sound control, micro-label (2-4 words max).
 */

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

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
      <section className="w-full bg-slate-900">
        {/* Video frame — dark fallback, no gradient */}
        <div className="w-full overflow-hidden" style={{ height: 'clamp(300px, 38vw, 520px)' }} />

        {/* Below-video content — all messaging here, never on the video */}
        <section className="border-b border-slate-100 py-8 sm:py-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            {banner.microLabel && (
              <p className="text-sm uppercase tracking-wider text-brand-red-400 font-semibold mb-4">
                {banner.microLabel}
              </p>
            )}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-3 sm:mb-4">
              {banner.belowHeroHeadline}
            </h1>
            <p className="text-slate-700 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 max-w-2xl">
              {banner.belowHeroSubheadline}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={banner.primaryCta.href}
                className="text-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm"
              >
                {banner.primaryCta.label}
              </a>
              {banner.secondaryCta && (
                <a
                  href={banner.secondaryCta.href}
                  className="text-center border border-slate-300 text-slate-700 font-bold px-7 py-3.5 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  {banner.secondaryCta.label}
                </a>
              )}
            </div>
            {banner.trustIndicators && banner.trustIndicators.length > 0 && (
              <ul className="flex flex-wrap gap-x-6 gap-y-1.5 mt-4">
                {banner.trustIndicators.map((indicator) => (
                  <li key={indicator} className="flex items-center gap-1.5 text-slate-900 text-sm font-medium">
                    <span className="w-1 h-1 rounded-full bg-brand-red-400 flex-shrink-0" />
                    {indicator}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </section>
    );
  }

  return (
    <div className="w-full">
      {/* VIDEO FRAME — no text, no CTAs, no gradient overlay */}
      <section
        className="relative w-full overflow-hidden bg-slate-900"
        style={{ height: 'clamp(300px, 38vw, 520px)' }}
        aria-label={banner.analyticsName ? `${banner.analyticsName} hero video` : 'Hero video'}
      >
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <audio ref={voiceoverRef} src={banner.voiceoverSrc} preload="none" />

        {/* ON-VIDEO ELEMENTS (only sound controls + micro-label are allowed) */}

        {/* Micro-label — bottom-left, 2–4 words max */}
        {banner.microLabel && (
          <div className="absolute bottom-4 left-4 z-20">
            <span className="text-white text-xs font-semibold tracking-widest uppercase">
              {banner.microLabel}
            </span>
          </div>
        )}

        {/* Sound toggle — bottom-right */}
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
          {isPlaying && (
            <button
              onClick={togglePlay}
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition backdrop-blur-sm"
              aria-label="Pause video"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            </button>
          )}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition backdrop-blur-sm"
              aria-label="Play video"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </button>
          )}
          <button
            onClick={toggleMute}
            className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition backdrop-blur-sm"
            aria-label={isMuted ? 'Unmute narration' : 'Mute narration'}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </section>

      {/* BELOW-VIDEO CONTENT — all primary messaging lives here */}
      <section className="border-b border-slate-100 py-8 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-3 sm:mb-4">
            {banner.belowHeroHeadline}
          </h1>
          <p className="text-slate-700 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 max-w-2xl">
            {banner.belowHeroSubheadline}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={banner.primaryCta.href}
              className="text-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm"
            >
              {banner.primaryCta.label}
            </a>
            {banner.secondaryCta && (
              <a
                href={banner.secondaryCta.href}
                className="text-center border border-slate-300 text-slate-700 font-bold px-7 py-3.5 rounded-lg hover:bg-slate-50 transition-colors text-sm"
              >
                {banner.secondaryCta.label}
              </a>
            )}
          </div>
          {banner.trustIndicators && banner.trustIndicators.length > 0 && (
            <ul className="flex flex-wrap gap-x-6 gap-y-1.5 mt-4">
              {banner.trustIndicators.map((indicator) => (
                <li key={indicator} className="flex items-center gap-1.5 text-slate-900 text-sm font-medium">
                  <span className="w-1 h-1 rounded-full bg-brand-red-400 flex-shrink-0" />
                  {indicator}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
