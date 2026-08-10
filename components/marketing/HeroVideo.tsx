'use client';

/**
 * HeroVideo — shared marketing hero video component.
 *
 * Production contract:
 * - No gradient overlay over media.
 * - No primary copy over media.
 * - Video begins when substantially scrolled into view.
 * - Once started, video continues to completion even if the user scrolls away.
 * - Video plays once; it never loops.
 * - Optional demo slides advance once in order; they never wrap/overlap indefinitely.
 * - All video, timers, narration, and speech stop immediately on route change/unmount.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Volume2, VolumeX } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

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
  videoSrcDesktop: string;
  videoSrcMobile?: string;
  posterImage?: string;
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
  /** Canonical hero frame sizing. Override only for an intentional compact/full variant. */
  heightClassName?: string;
}

export default function HeroVideo({
  videoSrcDesktop,
  videoSrcMobile,
  posterImage,
  voiceoverSrc,
  microLabel,
  showBrandBug = false,
  belowHeroHeadline,
  belowHeroSubheadline,
  ctas,
  trustIndicators,
  transcript,
  analyticsName,
  className = '',
  children,
  mediaFit = 'cover',
  demoSlides = [],
  demoStartSeconds = 6,
  demoSlideSeconds = 4.5,
  heightClassName = 'h-[38vh] min-h-[260px] max-h-[520px]',
}: HeroVideoProps) {
  const pathname = usePathname();
  const initialPathRef = useRef(pathname);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const demoStartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const demoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const [hasEnded, setHasEnded] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [videoSrc, setVideoSrc] = useState(videoSrcDesktop);
  const [demoActive, setDemoActive] = useState(false);
  const [demoSlideIndex, setDemoSlideIndex] = useState(0);
  const transcriptId = useId();

  useEffect(() => {
    setVideoSrc(videoSrcMobile && window.innerWidth < 768 ? videoSrcMobile : videoSrcDesktop);
  }, [videoSrcDesktop, videoSrcMobile]);

  const ttsText = useMemo(() => {
    const fallback = [belowHeroHeadline, belowHeroSubheadline].filter(Boolean).join(' ');
    return (transcript || fallback).trim();
  }, [belowHeroHeadline, belowHeroSubheadline, transcript]);

  const clearDemoTimers = useCallback(() => {
    if (demoStartTimerRef.current) clearTimeout(demoStartTimerRef.current);
    if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    demoStartTimerRef.current = null;
    demoIntervalRef.current = null;
  }, []);

  const stopNarration = useCallback((reset = false) => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      if (reset) audio.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (reset) window.speechSynthesis.cancel();
      else window.speechSynthesis.pause();
    }
    setMuted(true);
  }, []);

  const stopAllMedia = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      try {
        video.currentTime = 0;
      } catch {
        // Media may not have metadata yet; pausing is sufficient.
      }
    }
    clearDemoTimers();
    stopNarration(true);
  }, [clearDemoTimers, stopNarration]);

  const startDemoSequence = useCallback(() => {
    if (!demoSlides.length || demoStartTimerRef.current || demoActive) return;
    demoStartTimerRef.current = setTimeout(() => {
      setDemoActive(true);
      setDemoSlideIndex(0);
      demoStartTimerRef.current = null;
      if (demoSlides.length > 1) {
        demoIntervalRef.current = setInterval(() => {
          setDemoSlideIndex((current) => {
            if (current >= demoSlides.length - 1) {
              if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
              demoIntervalRef.current = null;
              return current;
            }
            return current + 1;
          });
        }, Math.max(2000, demoSlideSeconds * 1000));
      }
    }, Math.max(0, demoStartSeconds * 1000));
  }, [demoActive, demoSlideSeconds, demoSlides.length, demoStartSeconds]);

  useEffect((): (() => void) | undefined => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return undefined;
    setTtsSupported(true);
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  const startTtsNarration = useCallback(() => {
    if (!ttsSupported || !ttsText || typeof window === 'undefined' || !window.speechSynthesis) {
      return false;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(ttsText);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.lang = 'en-US';

    const voices = window.speechSynthesis.getVoices();
    const preferred = [
      'Google US English',
      'Microsoft Aria Online (Natural) - English (United States)',
      'Microsoft Guy Online (Natural) - English (United States)',
      'Microsoft Zira - English (United States)',
      'Samantha',
    ];
    const voice =
      preferred.reduce<SpeechSynthesisVoice | null>(
        (found, name) => found ?? voices.find((candidate) => candidate.name === name) ?? null,
        null,
      ) ??
      voices.find((candidate) => candidate.lang === 'en-US' && !candidate.localService) ??
      voices.find((candidate) => candidate.lang === 'en-US') ??
      voices.find((candidate) => candidate.lang.startsWith('en')) ??
      null;

    if (voice) utterance.voice = voice;
    utterance.onend = () => setMuted(true);
    utterance.onerror = () => setMuted(true);
    window.speechSynthesis.speak(utterance);
    setMuted(false);
    return true;
  }, [ttsSupported, ttsText]);

  const startAudibleTrack = useCallback(async () => {
    if (voiceoverSrc && audioRef.current) {
      try {
        audioRef.current.currentTime = Math.min(
          videoRef.current?.currentTime ?? 0,
          Number.isFinite(audioRef.current.duration) ? audioRef.current.duration : 0,
        );
        await audioRef.current.play();
        setMuted(false);
        return true;
      } catch {
        // Browser blocked audible autoplay; user can use the sound button.
      }
    }

    if (ttsText && startTtsNarration()) return true;

    const video = videoRef.current;
    if (video) {
      try {
        video.muted = false;
        video.volume = 1;
        await video.play();
        setMuted(false);
        return true;
      } catch {
        video.muted = true;
      }
    }

    setMuted(true);
    return false;
  }, [startTtsNarration, ttsText, voiceoverSrc]);

  const startOrResume = useCallback(async () => {
    const video = videoRef.current;
    if (!video || hasEnded) return;

    startDemoSequence();
    video.loop = false;
    if (!hasStarted) video.muted = true;

    try {
      await video.play();
      setHasStarted(true);
      if (muted) void startAudibleTrack();
    } catch {
      // Keep the poster/frame visible. User can start from native interaction.
    }
  }, [hasEnded, hasStarted, muted, startAudibleTrack, startDemoSequence]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || hasStarted || hasEnded) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      void startOrResume();
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
          void startOrResume();
          observer.disconnect();
        }
      },
      { threshold: [0, 0.35, 0.75] },
    );

    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [hasEnded, hasStarted, startOrResume]);

  useEffect(() => {
    if (pathname !== initialPathRef.current) stopAllMedia();
  }, [pathname, stopAllMedia]);

  useEffect(() => () => stopAllMedia(), [stopAllMedia]);

  async function toggleMute() {
    if (!muted) {
      if (!voiceoverSrc && !ttsText && videoRef.current) {
        videoRef.current.muted = true;
      }
      stopNarration(false);
      return;
    }

    if (
      typeof window !== 'undefined' &&
      window.speechSynthesis?.paused &&
      ttsText &&
      !voiceoverSrc
    ) {
      window.speechSynthesis.resume();
      setMuted(false);
      return;
    }

    await startAudibleTrack();
  }

  function handleEnded() {
    setHasEnded(true);
    videoRef.current?.pause();
    if (!demoSlides.length) stopNarration(true);
  }

  const hasSoundControl = Boolean(voiceoverSrc || ttsText || videoSrc);
  const activeSlide = demoActive ? demoSlides[demoSlideIndex] : null;

  return (
    <div ref={wrapperRef} className={`w-full ${className}`}>
      <section
        className={`relative w-full overflow-hidden bg-slate-900 ${heightClassName}`}
        aria-label={analyticsName ? `${analyticsName} hero video` : 'Hero video'}
      >
        <video
          ref={videoRef}
          src={videoSrc}
          poster={posterImage}
          preload="auto"
          playsInline
          muted
          loop={false}
          onEnded={handleEnded}
          className={`absolute inset-0 z-10 h-full w-full ${mediaFit === 'contain' ? 'object-contain' : 'object-cover'} object-center`}
          aria-label={analyticsName ? `${analyticsName} video` : 'Program video'}
        />

        {activeSlide && (
          <div className="absolute inset-0 z-[11] bg-slate-950" aria-live="polite">
            {demoSlides.map((slide, index) => (
              <div
                key={`${slide.src}-${index}`}
                className={`absolute inset-0 transition-opacity duration-500 ${index === demoSlideIndex ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                aria-hidden={index !== demoSlideIndex}
              >
                <img src={slide.src} alt={slide.alt} className="h-full w-full object-contain" />
                {slide.label && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-slate-950/90 px-4 py-2 text-xs font-bold text-white shadow-lg sm:text-sm">
                    {slide.label}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {voiceoverSrc && (
          <audio
            ref={audioRef}
            src={voiceoverSrc}
            preload="metadata"
            aria-hidden="true"
            className="hidden"
            onEnded={() => setMuted(true)}
          />
        )}

        {showBrandBug && (
          <div className="absolute left-4 top-4 z-20">
            <img
              src="/images/Elevate_for_Humanity_logo_81bf0fab.jpg"
              alt={PLATFORM_DEFAULTS.orgName}
              className="h-7 w-auto opacity-90"
            />
          </div>
        )}

        {microLabel && (
          <div className="absolute bottom-4 left-4 z-20">
            <span className="rounded bg-slate-950/90 px-2 py-1 text-xs font-semibold uppercase tracking-widest text-white">
              {microLabel}
            </span>
          </div>
        )}

        {hasSoundControl && (!hasEnded || demoSlides.length > 0) && (
          <div className="absolute bottom-4 right-4 z-20">
            <button
              type="button"
              onClick={() => void toggleMute()}
              aria-label={muted ? 'Turn on hero audio' : 'Turn off hero audio'}
              className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full bg-slate-950/90 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              <span className="hidden sm:inline">{muted ? 'Sound on' : 'Sound off'}</span>
            </button>
          </div>
        )}
      </section>

      {(belowHeroHeadline || belowHeroSubheadline || ctas || trustIndicators || children) && (
        <section className="border-b border-slate-100 py-8 sm:py-14">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            {children ? (
              children
            ) : (
              <>
                {belowHeroHeadline && (
                  <h1 className="mb-3 text-2xl font-extrabold leading-tight text-slate-950 sm:mb-4 sm:text-4xl lg:text-5xl">
                    {belowHeroHeadline}
                  </h1>
                )}
                {belowHeroSubheadline && (
                  <p className="mb-6 max-w-2xl text-base leading-relaxed text-slate-800 sm:mb-8 sm:text-lg">
                    {belowHeroSubheadline}
                  </p>
                )}
                {ctas && ctas.length > 0 && (
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row">
                    {ctas.map((cta) => (
                      <a
                        key={`${cta.href}-${cta.label}`}
                        href={cta.href}
                        className={
                          cta.variant === 'secondary'
                            ? 'rounded-lg border border-slate-300 px-7 py-3.5 text-center text-sm font-bold text-slate-900 transition-colors hover:bg-slate-50'
                            : 'rounded-lg bg-brand-red-600 px-7 py-3.5 text-center text-sm font-bold text-white transition-colors hover:bg-brand-red-700'
                        }
                      >
                        {cta.label}
                      </a>
                    ))}
                  </div>
                )}
                {trustIndicators && trustIndicators.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                    {Array.from(new Set(trustIndicators)).map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-1.5 text-sm font-semibold text-slate-900"
                      >
                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-red-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {transcript && (
        <div className="border-b border-slate-100 bg-slate-50">
          <div className="mx-auto max-w-4xl px-6 py-3">
            <button
              type="button"
              onClick={() => setTranscriptOpen((open) => !open)}
              aria-expanded={transcriptOpen}
              aria-controls={transcriptId}
              className="flex min-h-11 items-center gap-2 rounded text-xs font-semibold text-slate-700 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-500 focus-visible:ring-offset-2"
            >
              <span>{transcriptOpen ? '▲' : '▼'}</span>
              Video transcript
            </button>
            {transcriptOpen && (
              <p
                id={transcriptId}
                className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-800"
              >
                {transcript}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
