'use client';

/**
 * HeroVideo — shared premium hero video component.
 *
 * Rules (non-negotiable):
 * - No gradient overlays on the video frame.
 * - No headline, subheadline, paragraph, or CTA on top of the video.
 * - Only allowed on-video elements: brand bug, sound control, micro-label (2–4 words max).
 * - All primary messaging renders in the below-hero content slot.
 * - Transcript renders below the fold, never over the video.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import CanonicalVideo from '@/components/video/CanonicalVideo';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { hero as heroTokens } from '@/lib/page-design-tokens';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface HeroVideoCta {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
}

export interface HeroVideoProps {
  /** Desktop video source */
  videoSrcDesktop: string;
  /** Mobile video source — falls back to desktop if omitted */
  videoSrcMobile?: string;
  /** @deprecated Posters are not used on marketing heroes — video-only frame. */
  posterImage?: string;
  /** Voiceover audio track — starts on first user interaction */
  voiceoverSrc?: string;
  /** 2–4 word micro-label rendered in bottom-left corner of video */
  microLabel?: string;
  /** Show small brand bug in top-left corner */
  showBrandBug?: boolean;
  /** Below-hero headline */
  belowHeroHeadline?: string;
  /** Below-hero supporting line */
  belowHeroSubheadline?: string;
  /** CTA buttons rendered below the hero */
  ctas?: HeroVideoCta[];
  /** Optional trust indicator row below CTAs */
  trustIndicators?: string[];
  /** Voiceover transcript — rendered in expandable section below the fold */
  transcript?: string;
  /** Analytics name for tracking */
  analyticsName?: string;
  /** Additional className for the outer wrapper */
  className?: string;
  /** Render below-hero content as children instead of structured props */
  children?: React.ReactNode;
  /**
   * When true, hero video uses preload=auto (home page only).
   * Default false — metadata preload avoids blocking LCP on inner pages.
   */
  eagerVideoLoad?: boolean;
  /** Tighter below-hero typography and spacing (home page). */
  compactBelowHero?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function HeroVideo({
  videoSrcDesktop,
  videoSrcMobile,
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
  eagerVideoLoad = false,
  compactBelowHero = false,
}: HeroVideoProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const transcriptId = useId();
  // Resolve the correct src synchronously on first render so there is no
  // desktop→mobile src swap after hydration that causes a poster flash.
  // Always start with desktop src to match SSR — swap to mobile in useEffect
  // after hydration to avoid server/client mismatch.
  const [videoSrc, setVideoSrc] = useState(videoSrcDesktop);
  const [ttsSupported, setTtsSupported] = useState(false);

  useEffect(() => {
    if (videoSrcMobile && window.innerWidth < 768) {
      setVideoSrc(videoSrcMobile);
    }
  }, [videoSrcMobile]);

  const ttsText = useMemo(() => {
    const fallback = [belowHeroHeadline, belowHeroSubheadline].filter(Boolean).join(' ');
    return (transcript || fallback).trim();
  }, [belowHeroHeadline, belowHeroSubheadline, transcript]);

  const hasVoiceNarration = Boolean(voiceoverSrc) || (ttsSupported && ttsText.length > 0);

  const startTtsNarration = useCallback(() => {
    if (!ttsSupported || !ttsText || typeof window === 'undefined' || !window.speechSynthesis) {
      return false;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(ttsText);
    utterance.rate = 0.95;
    utterance.pitch = 1;

    // Select a consistent, professional-sounding voice.
    // Priority: Google US English → Microsoft US English → any en-US → default.
    // Without this, the browser picks whatever OS voice is first — often a
    // robotic system voice that doesn't match the brand tone.
    const voices = window.speechSynthesis.getVoices();
    const preferred = [
      'Google US English',
      'Microsoft Aria Online (Natural) - English (United States)',
      'Microsoft Guy Online (Natural) - English (United States)',
      'Microsoft Zira - English (United States)',
      'Samantha', // macOS
    ];
    const voice =
      preferred.reduce<SpeechSynthesisVoice | null>((found, name) => {
        return found ?? voices.find((v) => v.name === name) ?? null;
      }, null) ??
      voices.find((v) => v.lang === 'en-US' && !v.localService) ?? // prefer cloud voices
      voices.find((v) => v.lang === 'en-US') ??
      voices.find((v) => v.lang.startsWith('en')) ??
      null;

    if (voice) utterance.voice = voice;
    utterance.lang = 'en-US';
    utterance.onend = () => setMuted(true);
    utterance.onerror = () => setMuted(true);
    window.speechSynthesis.speak(utterance);
    setMuted(false);
    return true;
  }, [ttsSupported, ttsText]);

  // src is resolved synchronously in useState initializer above — no swap needed.

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // Voices may not be loaded yet on first render (Chrome async loads them).
    // Mark supported immediately so the sound button appears, then voices
    // will be available by the time the user clicks.
    setTtsSupported(true);

    // Pre-load voices so they're ready on first interaction
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  // Voiceover is user-initiated only — no auto-play on scroll/click.
  // The sound button below lets users start narration on demand.

  function toggleMute() {
    if (!voiceoverSrc) {
      if (muted) {
        startTtsNarration();
      } else if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setMuted(true);
      }
      return;
    }

    const a = audioRef.current;
    if (!a) return;
    if (muted) {
      a.play()
        .then(() => setMuted(false))
        .catch(() => {
          startTtsNarration();
        });
    } else {
      a.pause();
      a.currentTime = 0;
      setMuted(true);
    }
  }

  return (
    <div ref={wrapperRef} className={`w-full ${className}`}>
      {/* VIDEO FRAME */}
      {/* Height is intentionally restrained so the first viewport includes the message below the video. */}
      <section
        className={`relative w-full overflow-hidden bg-slate-900 ${heroTokens.imageWrap}`}
        aria-label={analyticsName ? `${analyticsName} hero video` : 'Hero video'}
      >
        <CanonicalVideo
          src={videoSrc}
          className="absolute inset-0 w-full h-full object-cover object-center sm:object-[center_35%]"
          autoPlayOnMount
          loop
          preloadFull={eagerVideoLoad}
        />

        {/* Hidden audio element for voiceover */}
        {voiceoverSrc && (
          <audio
            ref={audioRef}
            src={voiceoverSrc}
            preload="none"
            aria-hidden="true"
            className="hidden"
          />
        )}

        {/* ON-VIDEO ELEMENTS (only these three are allowed) */}

        {/* Brand bug — top-left, only when requested */}
        {showBrandBug && (
          <div className="absolute top-4 left-4 z-10">
            {/* IMAGE-CONTRACT: allow raw img because legacy markup */}
            <img
              src="/images/Elevate_for_Humanity_logo_81bf0fab.jpg"
              alt={PLATFORM_DEFAULTS.orgName}
              className="h-7 w-auto opacity-90"
            />
          </div>
        )}

        {/* Micro-label — bottom-left, 2–4 words max */}
        {microLabel && (
          <div className="absolute bottom-4 left-4 z-10">
            <span className="text-white text-xs font-semibold tracking-widest uppercase">
              {microLabel}
            </span>
          </div>
        )}

        {/* Sound toggle — bottom-right, shown when narration is available */}
        {hasVoiceNarration && (
          <div className="absolute bottom-4 right-4 z-10">
            <button
              onClick={toggleMute}
              aria-label={muted ? 'Unmute narration' : 'Mute narration'}
              className="flex items-center gap-2 text-white/70 hover:text-white text-xs font-semibold px-2 py-1.5 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-red-600"
            >
              {muted ? (
                <>
                  <VolumeX className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Tap to hear</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 flex-shrink-0 text-brand-red-400" />
                  <span className="hidden sm:inline">Mute</span>
                </>
              )}
            </button>
          </div>
        )}
      </section>

      {/* BELOW-HERO CONTENT */}
      {/* All primary messaging lives here — never on the video */}
      {(belowHeroHeadline || belowHeroSubheadline || ctas || trustIndicators || children) && (
        <section
          className={
            compactBelowHero
              ? 'border-b border-slate-100 py-4 sm:py-5'
              : heroTokens.belowPanel
          }
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            {children ? (
              children
            ) : (
              <>
                {belowHeroHeadline && (
                  <h1
                    className={
                      compactBelowHero
                        ? 'text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 leading-snug mb-2'
                        : heroTokens.belowHeadline
                    }
                  >
                    {belowHeroHeadline}
                  </h1>
                )}
                {belowHeroSubheadline && (
                  <p
                    className={
                      compactBelowHero
                        ? 'text-slate-600 text-sm sm:text-[0.9375rem] leading-relaxed mb-4 max-w-xl'
                        : 'text-slate-700 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 max-w-2xl'
                    }
                  >
                    {belowHeroSubheadline}
                  </p>
                )}
                {ctas && ctas.length > 0 && (
                  <div
                    className={
                      compactBelowHero
                        ? 'flex flex-col sm:flex-row gap-2 mb-2'
                        : 'flex flex-col sm:flex-row gap-3 mb-6'
                    }
                  >
                    {ctas.map((cta) => (
                      <a
                        key={cta.href}
                        href={cta.href}
                        className={
                          cta.variant === 'secondary'
                            ? compactBelowHero
                              ? 'text-center border border-slate-300 text-slate-700 font-semibold px-5 py-2 rounded-lg hover:bg-slate-50 transition-colors text-sm'
                              : 'text-center border border-slate-300 text-slate-700 font-bold px-7 py-3.5 rounded-lg hover:bg-slate-50 transition-colors text-sm'
                            : compactBelowHero
                              ? 'text-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold px-5 py-2 rounded-lg transition-colors text-sm'
                              : 'text-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm'
                        }
                      >
                        {cta.label}
                      </a>
                    ))}
                  </div>
                )}
                {trustIndicators && trustIndicators.length > 0 && (
                  <ul className="flex flex-wrap gap-x-6 gap-y-1.5 mt-2">
                    {trustIndicators.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-1.5 text-slate-900 text-sm font-medium"
                      >
                        <span className="w-1 h-1 rounded-full bg-brand-red-400 flex-shrink-0" />
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

      {/* TRANSCRIPT */}
      {/* Expandable, below the fold — never over the video */}
      {transcript && (
        <div className="bg-slate-50 border-b border-slate-100">
          <div className="max-w-4xl mx-auto px-6 py-3">
            <button
              onClick={() => setTranscriptOpen((o) => !o)}
              aria-expanded={transcriptOpen}
              aria-controls={transcriptId}
              className="flex items-center gap-2 rounded text-xs font-semibold text-slate-500 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-500 focus-visible:ring-offset-2"
            >
              <span>{transcriptOpen ? '▲' : '▼'}</span>
              Video transcript
            </button>
            {transcriptOpen && (
              <p
                id={transcriptId}
                className="mt-3 text-slate-800 text-sm leading-relaxed max-w-2xl"
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
