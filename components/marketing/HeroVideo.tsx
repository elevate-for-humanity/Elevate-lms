'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';

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
  /** Poster shown while video buffers and as the permanent fallback on video failure. */
  posterImage?: string;
  voiceoverSrc?: string;
  microLabel?: string;
  /** Deprecated for hero rendering. Branding is kept out of the video frame. */
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
  /** Demo slides are intentionally not rendered over canonical hero video. */
  demoSlides?: HeroDemoSlide[];
  demoStartSeconds?: number;
  demoSlideSeconds?: number;
  heightClassName?: string;
}

export default function HeroVideo({
  videoSrcDesktop,
  videoSrcMobile,
  posterImage,
  voiceoverSrc,
  microLabel,
  showBrandBug: _showBrandBug = false,
  belowHeroHeadline,
  belowHeroSubheadline,
  ctas,
  trustIndicators,
  transcript,
  analyticsName,
  className = '',
  children,
  mediaFit = 'cover',
  demoSlides: _demoSlides = [],
  demoStartSeconds: _demoStartSeconds = 6,
  demoSlideSeconds: _demoSlideSeconds = 4.5,
  heightClassName = 'h-[38vh] min-h-[260px] max-h-[520px]',
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoSrc, setVideoSrc] = useState(videoSrcDesktop || videoSrcMobile || '');
  const transcriptId = useId();
  const mediaClass = mediaFit === 'contain' ? 'object-contain' : 'object-cover';

  const chooseVideoSource = useCallback(() => {
    if (typeof window === 'undefined') return videoSrcDesktop || videoSrcMobile || '';
    return window.innerWidth < 768
      ? videoSrcMobile || videoSrcDesktop || ''
      : videoSrcDesktop || videoSrcMobile || '';
  }, [videoSrcDesktop, videoSrcMobile]);

  useEffect(() => {
    const syncSource = () => {
      const next = chooseVideoSource();
      setVideoSrc((current) => (current === next ? current : next));
    };
    syncSource();
    window.addEventListener('resize', syncSource);
    return () => window.removeEventListener('resize', syncSource);
  }, [chooseVideoSource]);

  useEffect(() => {
    setVideoFailed(false);
    setMuted(true);
    const video = videoRef.current;
    if (!video || !videoSrc) return;
    video.muted = true;
    video.loop = false;
    void video.play().catch(() => {
      // Browser autoplay policy may defer playback until interaction.
      // The poster remains visible underneath until a frame can render.
    });
  }, [videoSrc]);

  useEffect(() => {
    return () => {
      videoRef.current?.pause();
      audioRef.current?.pause();
    };
  }, []);

  async function toggleSound() {
    const video = videoRef.current;
    const audio = audioRef.current;

    if (!muted) {
      audio?.pause();
      if (video) video.muted = true;
      setMuted(true);
      return;
    }

    try {
      if (voiceoverSrc && audio) {
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

  const showVideo = Boolean(videoSrc) && !videoFailed;
  const showPoster = Boolean(posterImage);

  return (
    <div className={`w-full ${className}`}>
      <section
        className={`relative w-full overflow-hidden bg-black ${heightClassName}`}
        aria-label={analyticsName ? `${analyticsName} hero media` : 'Hero media'}
      >
        {showPoster ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${posterImage})` }}
            aria-hidden="true"
          />
        ) : null}

        {showVideo ? (
          <video
            ref={videoRef}
            src={videoSrc}
            poster={posterImage}
            preload="auto"
            autoPlay
            playsInline
            muted
            onCanPlay={() => {
              const video = videoRef.current;
              if (video?.paused) void video.play().catch(() => {});
            }}
            onError={() => {
              setVideoFailed(true);
              setMuted(true);
            }}
            className={`absolute inset-0 h-full w-full ${mediaClass} object-center`}
            aria-label={analyticsName ? `${analyticsName} video` : 'Hero video'}
          />
        ) : null}

        {voiceoverSrc ? (
          <audio
            ref={audioRef}
            src={voiceoverSrc}
            preload="metadata"
            aria-hidden="true"
            className="hidden"
            onEnded={() => setMuted(true)}
          />
        ) : null}
      </section>

      {microLabel || belowHeroHeadline || belowHeroSubheadline || ctas?.length || trustIndicators?.length || children || voiceoverSrc || showVideo ? (
        <section className="border-b border-slate-100 bg-white py-8 sm:py-14">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            {microLabel ? (
              <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.16em] text-brand-red-700">
                {microLabel}
              </p>
            ) : null}

            {children ? children : (
              <>
                {belowHeroHeadline ? (
                  <h1 className="mb-3 text-2xl font-extrabold leading-tight text-slate-950 sm:mb-4 sm:text-4xl lg:text-5xl">
                    {belowHeroHeadline}
                  </h1>
                ) : null}
                {belowHeroSubheadline ? (
                  <p className="mb-6 max-w-2xl text-base font-medium leading-relaxed text-slate-800 sm:mb-8 sm:text-lg">
                    {belowHeroSubheadline}
                  </p>
                ) : null}
                {ctas?.length ? (
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row">
                    {ctas.map((cta) => (
                      <a
                        key={`${cta.href}-${cta.label}`}
                        href={cta.href}
                        className={cta.variant === 'secondary'
                          ? 'rounded-lg border border-slate-400 px-7 py-3.5 text-center text-sm font-bold text-slate-950 transition-colors hover:bg-slate-50'
                          : 'rounded-lg bg-brand-red-600 px-7 py-3.5 text-center text-sm font-bold text-white transition-colors hover:bg-brand-red-700'}
                      >
                        {cta.label}
                      </a>
                    ))}
                  </div>
                ) : null}
                {trustIndicators?.length ? (
                  <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                    {Array.from(new Set(trustIndicators)).map((item) => (
                      <li key={item} className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-red-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            )}

            {(voiceoverSrc || showVideo) ? (
              <button
                type="button"
                onClick={() => void toggleSound()}
                aria-label={muted ? 'Play hero audio' : 'Pause hero audio'}
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-950 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-red-600"
              >
                <Volume2 className="h-4 w-4" />
                <span>{muted ? 'Play audio' : 'Audio playing'}</span>
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

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
