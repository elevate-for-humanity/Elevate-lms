'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { Volume2, VolumeX } from 'lucide-react';

export interface HeroVideoCta {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
}

export interface HeroDemoSlide {
  src: string;
  alt: string;
  label?: string;
}

export interface HeroVideoProps {
  videoSrcDesktop?: string;
  videoSrcMobile?: string;
  posterImage?: string;
  /** Exact first frame mounted beneath the video to prevent a poster/hydration flash. */
  mountedFrameImage?: string;
  voiceoverSrc?: string;
  microLabel?: string;
  showBrandBug?: boolean;
  belowHeroHeadline?: string;
  belowHeroSubheadline?: string;
  ctas?: HeroVideoCta[];
  trustIndicators?: string[];
  transcript?: string;
  analyticsName?: string;
  className?: string;
  children?: React.ReactNode;
  mediaFit?: 'cover' | 'contain';
  demoSlides?: HeroDemoSlide[];
  demoStartSeconds?: number;
  demoSlideSeconds?: number;
  heightClassName?: string;
  overlayMode?: 'default' | 'none';
  /** Delay mounting remote video sources so the first visual frame can paint without competing network work. */
  deferVideoMs?: number;
}

export default function HeroVideo({
  videoSrcDesktop,
  videoSrcMobile,
  posterImage,
  mountedFrameImage,
  voiceoverSrc,
  microLabel,
  belowHeroHeadline,
  belowHeroSubheadline,
  ctas,
  trustIndicators,
  transcript,
  analyticsName,
  className = '',
  children,
  mediaFit = 'cover',
  heightClassName = 'h-[38vh] min-h-[320px] max-h-[520px]',
  overlayMode = 'default',
  deferVideoMs = 0,
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(deferVideoMs <= 0);
  const [videoReady, setVideoReady] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  const [userActivated, setUserActivated] = useState(false);
  const [manualAudioOverride, setManualAudioOverride] = useState(false);
  const transcriptId = useId();

  const mediaClass = mediaFit === 'contain' ? 'object-contain' : 'object-cover';
  const desktopSource = videoSrcDesktop || videoSrcMobile || '';
  const mobileSource = videoSrcMobile || videoSrcDesktop || '';
  const showVideo = Boolean(desktopSource) && !videoFailed && videoEnabled;

  useEffect(() => {
    if (deferVideoMs <= 0) {
      setVideoEnabled(true);
      return;
    }
    const timer = window.setTimeout(() => setVideoEnabled(true), deferVideoMs);
    return () => window.clearTimeout(timer);
  }, [deferVideoMs]);

  useEffect(() => {
    setVideoFailed(false);
    setVideoReady(false);
    setAudioFailed(false);
    setMuted(true);
    setManualAudioOverride(false);

    const video = videoRef.current;
    if (!videoEnabled || !video || !desktopSource) return;

    video.muted = true;
    void video.play().catch(() => {});
  }, [desktopSource, mobileSource, videoEnabled]);

  useEffect(() => {
    const unlock = () => setUserActivated(true);
    window.addEventListener('pointerdown', unlock, { passive: true, once: true });
    window.addEventListener('touchstart', unlock, { passive: true, once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('wheel', unlock, { passive: true, once: true });

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('wheel', unlock);
    };
  }, []);

  useEffect(() => {
    if (!voiceoverSrc || audioFailed || !userActivated || manualAudioOverride) return;

    const audio = audioRef.current;
    const video = videoRef.current;
    if (!audio) return;

    if (video) {
      video.muted = true;
      if (video.paused) void video.play().catch(() => {});
    }

    void audio.play().then(() => setMuted(false)).catch(() => setMuted(true));
  }, [audioFailed, manualAudioOverride, userActivated, voiceoverSrc]);

  useEffect(
    () => () => {
      videoRef.current?.pause();
      audioRef.current?.pause();
    },
    [],
  );

  async function toggleSound() {
    const video = videoRef.current;
    const audio = audioRef.current;
    setUserActivated(true);
    setManualAudioOverride(true);

    if (!muted) {
      audio?.pause();
      if (video) video.muted = true;
      setMuted(true);
      return;
    }

    try {
      if (voiceoverSrc && audio && !audioFailed) {
        if (video) {
          video.muted = true;
          if (video.paused) await video.play();
          const targetTime = video.currentTime || 0;
          audio.currentTime = Number.isFinite(audio.duration) && audio.duration > 0
            ? Math.min(targetTime, audio.duration)
            : targetTime;
        }
        await audio.play();
      } else if (video) {
        video.muted = false;
        video.volume = 1;
        await video.play();
      }
      setMuted(false);
    } catch {
      if (video) video.muted = true;
      setMuted(true);
    }
  }

  const hasHeroContent = Boolean(
    microLabel || belowHeroHeadline || belowHeroSubheadline || ctas?.length || trustIndicators?.length || children,
  );

  return (
    <div className={`w-full ${className}`}>
      <section
        className={`relative isolate w-full overflow-hidden flex items-end bg-slate-900 ${heightClassName}`}
        aria-label={analyticsName ? `${analyticsName} hero` : 'Hero'}
      >
        {mountedFrameImage || posterImage ? (
          <Image
            src={mountedFrameImage || posterImage || ''}
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className={`absolute inset-0 z-0 h-full w-full ${mediaClass} object-center`}
            aria-hidden="true"
          />
        ) : null}

        {showVideo ? (
          <video
            key={`${mobileSource}|${desktopSource}`}
            ref={videoRef}
            preload="metadata"
            autoPlay
            loop
            playsInline
            muted
            disablePictureInPicture
            data-video-ready={videoReady ? 'true' : 'false'}
            onLoadedData={() => setVideoReady(true)}
            onCanPlay={() => {
              setVideoReady(true);
              const video = videoRef.current;
              if (video?.paused) void video.play().catch(() => {});
            }}
            onPlaying={() => setVideoReady(true)}
            onError={() => {
              setVideoFailed(true);
              setVideoReady(false);
              setMuted(true);
            }}
            className={`absolute inset-0 z-10 h-full w-full ${mediaClass} object-center transition-opacity duration-500 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
            aria-label={analyticsName ? `${analyticsName} video` : 'Hero video'}
          >
            {mobileSource && mobileSource !== desktopSource ? (
              <source media="(max-width: 767px)" src={mobileSource} type="video/mp4" />
            ) : null}
            <source src={desktopSource} type="video/mp4" />
          </video>
        ) : null}

        {overlayMode === 'default' ? (
          <>
            <div className="absolute inset-0 z-20 bg-gradient-to-r from-slate-950/90 via-slate-950/62 to-slate-950/20" aria-hidden="true" />
            <div className="absolute inset-0 z-20 bg-gradient-to-t from-slate-950/65 via-transparent to-slate-950/10" aria-hidden="true" />
          </>
        ) : null}

        {voiceoverSrc ? (
          <audio
            ref={audioRef}
            src={voiceoverSrc}
            preload="metadata"
            aria-hidden="true"
            className="hidden"
            onEnded={() => setMuted(true)}
            onError={() => {
              setAudioFailed(true);
              setMuted(true);
            }}
          />
        ) : null}

        {hasHeroContent ? (
          <div className="relative z-30 mx-auto w-full max-w-7xl px-5 pb-9 pt-24 sm:px-8 sm:pb-12 lg:px-10 lg:pb-16">
            <div className="max-w-4xl">
              {microLabel ? (
                <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.18em] text-white/95 sm:text-sm">
                  {microLabel}
                </p>
              ) : null}

              {children ?? (
                <>
                  {belowHeroHeadline ? (
                    <h1 className="max-w-4xl text-4xl font-black leading-[1.02] tracking-tight text-white drop-shadow-sm sm:text-5xl lg:text-6xl">
                      {belowHeroHeadline}
                    </h1>
                  ) : null}

                  {belowHeroSubheadline ? (
                    <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-white/90 sm:text-lg sm:leading-8">
                      {belowHeroSubheadline}
                    </p>
                  ) : null}

                  {ctas?.length ? (
                    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      {ctas.map((cta) => (
                        <a
                          key={`${cta.href}-${cta.label}`}
                          href={cta.href}
                          className={
                            cta.variant === 'secondary'
                              ? 'inline-flex min-h-12 items-center justify-center rounded-xl border border-white/70 bg-slate-950/25 px-7 py-3.5 text-center text-sm font-black text-white backdrop-blur-sm transition hover:bg-white hover:text-slate-950'
                              : 'inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-red-600 px-7 py-3.5 text-center text-sm font-black text-white shadow-lg transition hover:bg-brand-red-700'
                          }
                        >
                          {cta.label}
                        </a>
                      ))}
                    </div>
                  ) : null}

                  {trustIndicators?.length ? (
                    <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                      {Array.from(new Set(trustIndicators)).map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm font-bold text-white/90">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-red-500" aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </>
              )}
            </div>
          </div>
        ) : null}

        {(voiceoverSrc && !audioFailed) || showVideo ? (
          <button
            type="button"
            onClick={() => void toggleSound()}
            aria-label={muted ? 'Play hero audio' : 'Pause hero audio'}
            className="absolute bottom-4 right-4 z-40 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/70 bg-slate-950/45 px-4 py-2 text-xs font-black text-white backdrop-blur-sm transition hover:bg-slate-950/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            {muted ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span>{muted ? 'Play audio' : 'Pause audio'}</span>
          </button>
        ) : null}
      </section>

      {transcript ? (
        <div className="border-b border-slate-100 bg-slate-50">
          <div className="mx-auto max-w-4xl px-6 py-3">
            <button
              type="button"
              onClick={() => setTranscriptOpen((open) => !open)}
              aria-expanded={transcriptOpen}
              aria-controls={transcriptId}
              className="flex min-h-11 items-center gap-2 rounded text-xs font-semibold text-slate-800 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-500 focus-visible:ring-offset-2"
            >
              <span>{transcriptOpen ? '▲' : '▼'}</span>
              Video transcript
            </button>
            {transcriptOpen ? (
              <p id={transcriptId} className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-slate-800">
                {transcript}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
