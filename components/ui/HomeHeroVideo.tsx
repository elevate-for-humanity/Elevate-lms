'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, ArrowRight } from 'lucide-react';

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
  const narrationText = banner.transcript?.trim() || `${banner.belowHeroHeadline}. ${banner.belowHeroSubheadline}`.trim();

  useEffect(() => {
    setVideoFailed(false);
    if (videoRef.current && videoSrc) videoRef.current.play().catch(() => {});
  }, [videoSrc]);

  useEffect(() => () => {
    audioRef.current?.pause();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

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
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsNarrating(false);
  };

  const speakWithBrowserTts = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !narrationText) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(narrationText);
    utterance.rate = 0.96;
    utterance.onend = () => setIsNarrating(false);
    utterance.onerror = () => setIsNarrating(false);
    setIsNarrating(true);
    window.speechSynthesis.speak(utterance);
  };

  const toggleNarration = async () => {
    if (isNarrating) return stopNarration();
    if (videoRef.current) videoRef.current.muted = true;
    if (banner.voiceoverSrc && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        setIsNarrating(true);
        await audioRef.current.play();
        return;
      } catch {
        setIsNarrating(false);
      }
    }
    speakWithBrowserTts();
  };

  return (
    <div className="w-full bg-white">
      {banner.voiceoverSrc ? (
        <audio ref={audioRef} src={banner.voiceoverSrc} preload="metadata" onEnded={() => setIsNarrating(false)} />
      ) : null}

      <section
        className="relative w-full overflow-hidden bg-slate-950"
        style={{ height: 'clamp(340px, 46vw, 620px)' }}
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
            preload="metadata"
            onError={() => {
              setVideoFailed(true);
              setIsPlaying(false);
            }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : banner.posterImage ? (
          <img src={banner.posterImage} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}

        {banner.microLabel ? (
          <div className="absolute bottom-5 left-5 z-20 rounded-full bg-slate-950/75 px-4 py-2 backdrop-blur-sm">
            <span className="text-sm font-extrabold uppercase tracking-wider text-white">{banner.microLabel}</span>
          </div>
        ) : null}

        <div className="absolute bottom-5 right-5 z-20 flex items-center gap-2">
          {showVideo ? (
            <button type="button" onClick={togglePlay} className="rounded-full bg-slate-950/70 p-3 text-white backdrop-blur-sm" aria-label={isPlaying ? 'Pause video' : 'Play video'}>
              {isPlaying ? (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
              ) : (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>
              )}
            </button>
          ) : null}
          <button type="button" onClick={toggleNarration} className="rounded-full bg-slate-950/70 p-3 text-white backdrop-blur-sm" aria-label={isNarrating ? 'Stop narration' : 'Play narration'}>
            {isNarrating ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-10 sm:py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
            <div>
              {banner.eyebrow ? (
                <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.16em] text-brand-red-700">{banner.eyebrow}</p>
              ) : null}
              <h1 className="max-w-4xl text-4xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                {banner.belowHeroHeadline}
              </h1>
              <p className="mt-5 max-w-3xl text-xl font-medium leading-8 text-slate-800 sm:text-2xl sm:leading-9">
                {banner.belowHeroSubheadline}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <a href={banner.primaryCta.href} className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-7 py-4 text-lg font-extrabold text-white shadow-sm transition hover:bg-brand-red-700">
                {banner.primaryCta.label} <ArrowRight className="h-5 w-5" />
              </a>
              {banner.secondaryCta ? (
                <a href={banner.secondaryCta.href} className="inline-flex min-h-[56px] items-center justify-center rounded-xl border-2 border-slate-300 px-7 py-4 text-lg font-extrabold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50">
                  {banner.secondaryCta.label}
                </a>
              ) : null}
            </div>
          </div>

          {banner.trustIndicators?.length ? (
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {banner.trustIndicators.map((indicator) => (
                <li key={indicator} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-bold text-slate-900">
                  {indicator}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>
    </div>
  );
}
