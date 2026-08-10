'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, ArrowRight } from 'lucide-react';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';

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
  const naturalVoice = useNaturalVoice();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isRecordedNarrating, setIsRecordedNarrating] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const videoSrc = banner.videoSrcMobile || banner.videoSrcDesktop;
  const showVideo = Boolean(videoSrc) && !videoFailed;
  const narrationText = banner.transcript?.trim() || `${banner.belowHeroHeadline}. ${banner.belowHeroSubheadline}`.trim();
  const isNarrating = isRecordedNarrating || naturalVoice.isPlaying || naturalVoice.isPaused;

  useEffect(() => {
    setVideoFailed(false);
    if (videoRef.current && videoSrc) videoRef.current.play().catch(() => {});
  }, [videoSrc]);

  useEffect(() => () => {
    audioRef.current?.pause();
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
    naturalVoice.stop();
    setIsRecordedNarrating(false);
  };

  const toggleNarration = async () => {
    if (isNarrating) return stopNarration();
    if (videoRef.current) videoRef.current.muted = true;
    if (banner.voiceoverSrc && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        setIsRecordedNarrating(true);
        await audioRef.current.play();
        return;
      } catch {
        setIsRecordedNarrating(false);
      }
    }
    await naturalVoice.play(narrationText, { voice: 'coral', style: 'commercial', rate: 1 });
  };

  return (
    <div className="w-full bg-white">
      {banner.voiceoverSrc ? (
        <audio ref={audioRef} src={banner.voiceoverSrc} preload="metadata" onEnded={() => setIsRecordedNarrating(false)} />
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
          <div className="absolute bottom-5 left-5 z-20 rounded-full bg-slate-950/85 px-4 py-2 backdrop-blur-sm">
            <span className="text-sm font-extrabold uppercase tracking-wider text-white">{banner.microLabel}</span>
          </div>
        ) : null}

        <div className="absolute bottom-5 right-5 z-20 flex items-center gap-2">
          {showVideo ? (
            <button type="button" onClick={togglePlay} className="rounded-full bg-slate-950/85 p-3 text-white backdrop-blur-sm" aria-label={isPlaying ? 'Pause video' : 'Play video'}>
              {isPlaying ? (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
              ) : (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>
              )}
            </button>
          ) : null}
          <button type="button" onClick={() => void toggleNarration()} disabled={naturalVoice.isLoading} className="rounded-full bg-slate-950/85 p-3 text-white backdrop-blur-sm disabled:opacity-60" aria-label={isNarrating ? 'Stop narration' : 'Play natural narration'}>
            {naturalVoice.isLoading ? <span className="block h-[18px] w-[18px] animate-spin rounded-full border-2 border-white/40 border-t-white" /> : isNarrating ? <Volume2 size={18} /> : <VolumeX size={18} />}
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
                <a href={banner.secondaryCta.href} className="inline-flex min-h-[56px] items-center justify-center rounded-xl border-2 border-slate-400 px-7 py-4 text-lg font-extrabold text-slate-950 transition hover:border-slate-500 hover:bg-slate-50">
                  {banner.secondaryCta.label}
                </a>
              ) : null}
            </div>
          </div>

          {banner.trustIndicators?.length ? (
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {banner.trustIndicators.map((indicator) => (
                <li key={indicator} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-bold text-slate-950">
                  {indicator}
                </li>
              ))}
            </ul>
          ) : null}
          {naturalVoice.error ? <p className="mt-3 text-sm font-semibold text-red-800">Natural narration is temporarily unavailable.</p> : null}
        </div>
      </section>
    </div>
  );
}
