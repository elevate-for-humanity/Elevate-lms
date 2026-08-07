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
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isNarrating, setIsNarrating] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const videoSrc = banner.videoSrcMobile || banner.videoSrcDesktop;
  const showVideo = Boolean(videoSrc) && !videoFailed;
  const narrationText =
    banner.transcript?.trim() ||
    `${banner.belowHeroHeadline}. ${banner.belowHeroSubheadline}`.trim();

  useEffect(() => {
    setVideoFailed(false);
    if (videoRef.current && videoSrc) {
      videoRef.current.play().catch(() => {});
    }
  }, [videoSrc]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    setIsNarrating(false);
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [banner.pageKey]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play().catch(() => {});
    setIsPlaying(!isPlaying);
  };

  const stopNarration = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsNarrating(false);
  };

  const speakWithBrowserTts = () => {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      typeof SpeechSynthesisUtterance === 'undefined' ||
      !narrationText
    ) {
      setIsNarrating(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(narrationText);
    utterance.rate = 0.96;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onend = () => setIsNarrating(false);
    utterance.onerror = () => setIsNarrating(false);
    setIsNarrating(true);
    window.speechSynthesis.speak(utterance);
  };

  const toggleNarration = async () => {
    if (isNarrating) {
      stopNarration();
      return;
    }

    // Keep the cinematic video itself muted. Narration is a separate audio track
    // so the sound control behaves consistently even when the MP4 has no audio.
    if (videoRef.current) videoRef.current.muted = true;

    if (banner.voiceoverSrc && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        setIsNarrating(true);
        await audioRef.current.play();
        return;
      } catch {
        // Missing/blocked voiceover files fall back to browser text-to-speech.
        setIsNarrating(false);
      }
    }

    speakWithBrowserTts();
  };

  return (
    <div className="w-full">
      {banner.voiceoverSrc && (
        <audio
          ref={audioRef}
          src={banner.voiceoverSrc}
          preload="metadata"
          onEnded={() => setIsNarrating(false)}
          onError={() => setIsNarrating(false)}
        />
      )}

      <section
        className="relative w-full overflow-hidden bg-slate-900"
        style={{ height: 'clamp(300px, 38vw, 520px)' }}
        aria-label={banner.analyticsName ? `${banner.analyticsName} hero` : 'Hero'}
      >
        {showVideo ? (
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
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

        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
          {showVideo && (
            <button
              type="button"
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
          )}
          <button
            type="button"
            onClick={toggleNarration}
            className="rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition hover:bg-black/60"
            aria-label={isNarrating ? 'Stop narration' : 'Play narration'}
            title={isNarrating ? 'Stop narration' : 'Play narration'}
          >
            {isNarrating ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
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
