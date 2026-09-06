'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { Volume2, VolumeX } from 'lucide-react';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';

export interface HeroVideoCta {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
}

export interface HeroDemoSlide {
  src: string;
  alt: string;
  label?: string;
  className?: string;
}

export interface HeroVideoProps {
  videoSrcDesktop?: string;
  videoSrcMobile?: string;
  /** Presentation speed for the looping hero video. */
  videoPlaybackRate?: number;
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
  /** Read the approved transcript aloud when the video has no narration track. */
  narrateTranscript?: boolean;
  analyticsName?: string;
  className?: string;
  children?: React.ReactNode;
  mediaFit?: 'cover' | 'contain';
  /** Optional shared color treatment for a coordinated media set. */
  mediaClassName?: string;
  demoSlides?: HeroDemoSlide[];
  demoActiveSlideIndex?: number;
  demoStartSeconds?: number;
  demoSlideSeconds?: number;
  heightClassName?: string;
  overlayMode?: 'default' | 'soft' | 'none';
  soundButtonVariant?: 'pill' | 'prominent';
  /** Allows a parent-level narration controller to remain the single audio authority. */
  showSoundControl?: boolean;
  /** Hides the transcript disclosure when the parent supplies its own accessible narration UI. */
  showTranscriptControl?: boolean;
  /** Delay mounting remote video sources so the first visual frame can paint without competing network work. */
  deferVideoMs?: number;
}

export default function HeroVideo({
  videoSrcDesktop,
  videoSrcMobile,
  videoPlaybackRate = 1,
  posterImage,
  mountedFrameImage,
  voiceoverSrc,
  microLabel,
  belowHeroHeadline,
  belowHeroSubheadline,
  ctas,
  trustIndicators,
  transcript,
  narrateTranscript = false,
  analyticsName,
  className = '',
  children,
  mediaFit = 'cover',
  mediaClassName = '',
  heightClassName = 'h-[clamp(380px,58vh,620px)]',
  overlayMode = 'default',
  soundButtonVariant = 'pill',
  showSoundControl = true,
  showTranscriptControl = true,
  deferVideoMs = 0,
  demoSlides,
  demoActiveSlideIndex = 0,
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(deferVideoMs <= 0);
  const [videoReady, setVideoReady] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  const soundRequestedRef = useRef(false);
  const transcriptVoice = useNaturalVoice();
  const prepareTranscriptVoice = transcriptVoice.prepare;
  const transcriptId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const scrollNarrationAttemptedRef = useRef(false);

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
    // Visual slide/source changes must not interrupt active narration or make
    // the sound control claim it is muted while the narration is still playing.
    if (!soundRequestedRef.current) setMuted(true);

    const video = videoRef.current;
    if (!videoEnabled || !video || !desktopSource) return;

    video.muted = true;
    void video.play().catch(() => {});
  }, [desktopSource, mobileSource, videoEnabled]);

  useEffect(
    () => () => {
      videoRef.current?.pause();
      audioRef.current?.pause();
    },
    [],
  );

  useEffect(() => {
    if (!narrateTranscript || !transcript) return;
    void prepareTranscriptVoice(transcript, { style: 'commercial', rate: 0.96 });
  }, [narrateTranscript, prepareTranscriptVoice, transcript]);

  useEffect(() => {
    if (!voiceoverSrc || audioFailed) return;
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || entry.intersectionRatio < 0.2) {
          const audio = audioRef.current;
          if (audio && !audio.paused) {
            audio.pause();
            audio.currentTime = 0;
          }
          transcriptVoice.stop();
          soundRequestedRef.current = false;
          setMuted(true);
          return;
        }
        if (entry.intersectionRatio < 0.55 || scrollNarrationAttemptedRef.current) return;
        scrollNarrationAttemptedRef.current = true;
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = 0;
        audio
          .play()
          .then(() => {
            soundRequestedRef.current = true;
            setMuted(false);
          })
          .catch(() => {
            // Browsers may require a tap before audible playback. The visible
            // Play audio control remains available when that policy applies.
            scrollNarrationAttemptedRef.current = false;
          });
      },
      { threshold: [0, 0.2, 0.55] },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [audioFailed, voiceoverSrc]);

  async function toggleSound() {
    const video = videoRef.current;
    const audio = audioRef.current;

    if (!muted) {
      soundRequestedRef.current = false;
      audio?.pause();
      transcriptVoice.stop();
      if (video) video.muted = true;
      setMuted(true);
      return;
    }

    try {
      soundRequestedRef.current = true;
      if (voiceoverSrc && audio && !audioFailed) {
        if (video) {
          video.muted = true;
          if (video.paused) await video.play();
        }
        // Narration is its own short presentation, not the video's native
        // soundtrack. Never seek it to the looping video's current time.
        if (
          audio.ended ||
          (Number.isFinite(audio.duration) && audio.currentTime >= audio.duration - 0.25)
        ) {
          audio.currentTime = 0;
        }
        await audio.play();
      } else if (narrateTranscript && transcript) {
        if (video) {
          video.muted = true;
          if (video.paused) await video.play();
        }
        const started = await transcriptVoice.play(transcript, {
          style: 'commercial',
          rate: 0.96,
          onEnded: () => {
            soundRequestedRef.current = false;
            setMuted(true);
          },
          onError: () => {
            soundRequestedRef.current = false;
            setMuted(true);
          },
        });
        if (!started) throw new Error('Transcript narration could not start.');
      } else if (video) {
        video.muted = false;
        video.volume = 1;
        await video.play();
      }
      setMuted(false);
    } catch {
      soundRequestedRef.current = false;
      if (video) video.muted = true;
      setMuted(true);
    }
  }

  const hasHeroContent = Boolean(
    microLabel ||
    belowHeroHeadline ||
    belowHeroSubheadline ||
    ctas?.length ||
    trustIndicators?.length ||
    children,
  );

  return (
    <div className={`w-full ${className}`}>
      <section
        ref={sectionRef}
        className={`relative isolate w-full overflow-hidden flex items-end bg-slate-900 ${heightClassName}`}
        aria-label={analyticsName ? `${analyticsName} hero` : 'Hero'}
      >
        {demoSlides?.length ? (
          demoSlides.map((slide, index) => (
            <Image
              key={slide.src}
              src={slide.src}
              alt={slide.alt}
              fill
              priority={index < 2}
              unoptimized
              sizes="100vw"
              aria-hidden={index !== demoActiveSlideIndex}
              className={`absolute inset-0 z-0 h-full w-full ${mediaClass} transform-gpu object-center transition-[opacity,transform] duration-1000 ease-in-out motion-reduce:transition-none ${mediaClassName} ${slide.className || ''} ${
                index === demoActiveSlideIndex
                  ? 'scale-100 opacity-100'
                  : 'scale-[1.015] opacity-0'
              }`}
            />
          ))
        ) : mountedFrameImage || posterImage ? (
          <Image
            src={mountedFrameImage || posterImage || ''}
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className={`absolute inset-0 z-0 h-full w-full ${mediaClass} object-center ${mediaClassName}`}
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
            onLoadedData={(event) => {
              event.currentTarget.defaultPlaybackRate = videoPlaybackRate;
              event.currentTarget.playbackRate = videoPlaybackRate;
              setVideoReady(true);
            }}
            onCanPlay={() => {
              setVideoReady(true);
              const video = videoRef.current;
              if (video) {
                video.defaultPlaybackRate = videoPlaybackRate;
                video.playbackRate = videoPlaybackRate;
                if (video.paused) void video.play().catch(() => {});
              }
            }}
            onPlaying={() => setVideoReady(true)}
            onError={() => {
              setVideoFailed(true);
              setVideoReady(false);
              setMuted(true);
            }}
            className={`absolute inset-0 z-10 h-full w-full ${mediaClass} object-center transition-opacity duration-500 ${mediaClassName} ${videoReady ? 'opacity-100' : 'opacity-0'}`}
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
            <div
              className="absolute inset-0 z-20 bg-gradient-to-r from-slate-950/90 via-slate-950/62 to-slate-950/20"
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 z-20 bg-gradient-to-t from-slate-950/65 via-transparent to-slate-950/10"
              aria-hidden="true"
            />
          </>
        ) : overlayMode === 'soft' ? (
          <>
            <div
              className="absolute inset-0 z-20 bg-gradient-to-r from-slate-950/58 via-slate-950/24 to-transparent"
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 z-20 bg-gradient-to-t from-slate-950/38 via-transparent to-transparent"
              aria-hidden="true"
            />
          </>
        ) : null}

        {voiceoverSrc ? (
          <audio
            ref={audioRef}
            src={voiceoverSrc}
            preload="metadata"
            aria-hidden="true"
            className="hidden"
            onEnded={() => {
              soundRequestedRef.current = false;
              setMuted(true);
            }}
            onError={() => {
              setAudioFailed(true);
              soundRequestedRef.current = false;
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
                        <li
                          key={item}
                          className="flex items-center gap-2 text-sm font-bold text-white/90"
                        >
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-red-500"
                            aria-hidden="true"
                          />
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

        {showSoundControl &&
        ((voiceoverSrc && !audioFailed) || (narrateTranscript && transcript) || showVideo) ? (
          <button
            type="button"
            onClick={() => void toggleSound()}
            aria-label={muted ? 'Play hero audio' : 'Pause hero audio'}
            className={`absolute right-4 z-40 inline-flex min-h-14 min-w-[10.5rem] touch-manipulation items-center justify-center gap-3 border-2 px-5 py-3 text-sm font-black text-white shadow-2xl transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${
              soundButtonVariant === 'prominent'
                ? 'top-4 rounded-lg border-red-300 bg-brand-red-700 hover:bg-brand-red-800'
                : 'bottom-4 rounded-full border-white/70 bg-slate-950/45 backdrop-blur-sm hover:bg-slate-950/70'
            }`}
          >
            {muted ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
            <span>{muted ? 'Turn sound on' : 'Turn sound off'}</span>
          </button>
        ) : null}
      </section>

      {transcript && showTranscriptControl ? (
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
              <p
                id={transcriptId}
                className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-slate-800"
              >
                {transcript}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
