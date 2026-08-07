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
  eyebrow?: string;
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
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);

  const videoSrc = banner.videoSrcMobile || banner.videoSrcDesktop;
  const showVideo = Boolean(videoSrc) && !videoFailed;

  useEffect(() => {
    setVideoFailed(false);
    if (videoRef.current && videoSrc) {
      videoRef.current.play().catch(() => {});
    }
  }, [videoSrc]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play().catch(() => {});
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="w-full">
      <section
        className="relative w-full overflow-hidden bg-slate-900"
        style={{ height: 'clamp(300px, 38vw, 520px)' }}
        aria-label={banner.analyticsName ? `${banner.analyticsName} hero` : 'Hero'}
      >
        {showVideo ? (
          <video
            ref={videoRef}
            src={videoSrc}
            poster={banner.posterImage}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            preload="metadata"
            onError={() => {
              setVideoFailed(true);
              setIsPlaying(false);
            }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : banner.posterImage ? (
          <img
            src={banner.posterImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}

        {banner.microLabel && (
          <div className="absolute bottom-4 left-4 z-20">
            <span className="text-xs font-semibold uppercase tracking-widest text-white">
              {banner.microLabel}
            </span>
          </div>
        )}

        {showVideo && (
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition hover:bg-black/60"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
            </button>
            <button
              onClick={toggleMute}
              className="rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition hover:bg-black/60"
              aria-label={isMuted ? 'Unmute narration' : 'Mute narration'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        )}
      </section>

      <section className="border-b border-slate-100 py-8 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {banner.eyebrow && (
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-red-500 opacity-90 sm:text-sm">
              {banner.eyebrow}
            </p>
          )}
          <h1
            className="mb-3 text-2xl font-extrabold leading-tight text-slate-900 sm:mb-4 sm:text-4xl lg:text-5xl"
            style={{ textWrap: 'balance' }}
          >
            {banner.belowHeroHeadline}
          </h1>
          <p className="mb-6 max-w-2xl text-base leading-relaxed text-slate-700 sm:mb-8 sm:text-lg">
            {banner.belowHeroSubheadline}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={banner.primaryCta.href}
              className="rounded-lg bg-brand-red-600 px-7 py-3.5 text-center text-sm font-bold text-white transition-colors hover:bg-brand-red-700"
            >
              {banner.primaryCta.label}
            </a>
            {banner.secondaryCta && (
              <a
                href={banner.secondaryCta.href}
                className="rounded-lg border border-slate-300 px-7 py-3.5 text-center text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
              >
                {banner.secondaryCta.label}
              </a>
            )}
          </div>
          {banner.trustIndicators && banner.trustIndicators.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5">
              {banner.trustIndicators.map((indicator) => (
                <li key={indicator} className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                  <span className="h-1 w-1 flex-shrink-0 rounded-full bg-brand-red-400" />
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
