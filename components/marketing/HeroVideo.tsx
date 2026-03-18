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

import { useEffect, useRef, useState, useId } from 'react';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';

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
  /** Poster image shown while video loads and as reduced-motion fallback */
  posterImage: string;
  /** Optional separate voiceover audio track */
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
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

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
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const transcriptId = useId();
  const triggeredRef = useRef(false);

  // Detect reduced-motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Preload audio on mount so it's buffered before scroll fires
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || prefersReducedMotion) return;
    audio.load();
  }, [prefersReducedMotion]);

  // Autoplay muted on load — browser allows muted autoplay
  useEffect(() => {
    if (prefersReducedMotion) return;
    const video = videoRef.current;
    if (!video) return;
    triggeredRef.current = true;
    video.muted = true;
    video.play()
      .then(() => setPlaying(true))
      .catch(() => {});
  }, [prefersReducedMotion]);

  // Pause video + audio when scrolled out of view; resume when back in view
  useEffect(() => {
    if (prefersReducedMotion) return;
    const el = wrapperRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        const audio = audioRef.current;
        if (!video || !triggeredRef.current) return;
        if (entry.isIntersecting) {
          video.play().catch(() => {});
          if (audio && !muted) audio.play().catch(() => {});
          setPlaying(true);
        } else {
          video.pause();
          if (audio) audio.pause();
          setPlaying(false);
        }
      },
      // threshold: 0 — only pause when the hero is fully off screen
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [prefersReducedMotion, muted]);

  function toggleMute() {
    const video = videoRef.current;
    const audio = audioRef.current;
    const nextMuted = !muted;
    setMuted(nextMuted);

    if (video) video.muted = nextMuted;

    if (audio) {
      if (nextMuted) {
        audio.pause();
      } else {
        if (audio.ended) audio.currentTime = 0;
        audio.play().catch(() => setMuted(true));
      }
    }
  }

  function togglePlay() {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      if (audio && !muted) audio.play().catch(() => {});
      setPlaying(true);
    } else {
      video.pause();
      if (audio) audio.pause();
      setPlaying(false);
    }
  }

  // Determine video source based on viewport
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const videoSrc = (isMobile && videoSrcMobile) ? videoSrcMobile : videoSrcDesktop;

  return (
    <div ref={wrapperRef} className={`w-full ${className}`}>
      {/* ── VIDEO FRAME ── */}
      {/* Height: 56vw clamped between 280px and 680px — no layout shift */}
      <section
        className="relative w-full overflow-hidden bg-slate-900"
        style={{ height: 'clamp(280px, 56vw, 680px)' }}
        aria-label={analyticsName ? `${analyticsName} hero video` : 'Hero video'}
      >
        {/* Video or poster fallback */}
        {!prefersReducedMotion && !videoFailed ? (
          <video
            ref={videoRef}
            loop
            playsInline
            preload="none"
            poster={posterImage}
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-center"
            onError={() => setVideoFailed(true)}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        ) : (
          // Reduced-motion or video-failed: show poster only
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        )}

        {/* Voiceover audio — preload metadata so it's ready when scroll fires */}
        {voiceoverSrc && (
          <audio ref={audioRef} src={voiceoverSrc} preload="metadata" aria-hidden="true" loop />
        )}

        {/* ── ON-VIDEO ELEMENTS (only these three are allowed) ── */}

        {/* Brand bug — top-left, only when requested */}
        {showBrandBug && (
          <div className="absolute top-4 left-4 z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/Elevate_for_Humanity_logo_81bf0fab.jpg"
              alt="Elevate for Humanity"
              className="h-7 w-auto opacity-90"
            />
          </div>
        )}

        {/* Micro-label — bottom-left, 2–4 words max */}
        {microLabel && (
          <div className="absolute bottom-4 left-4 z-10">
            <span className="text-white/80 text-xs font-semibold tracking-widest uppercase bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded">
              {microLabel}
            </span>
          </div>
        )}

        {/* Controls — bottom-right, always */}
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            aria-label={playing ? 'Pause video' : 'Play video'}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white transition-colors"
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Sound toggle */}
          <button
            onClick={toggleMute}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-black/40 text-white text-xs backdrop-blur-sm hover:bg-black/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white transition-colors"
          >
            {muted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">Sound on</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* ── BELOW-HERO CONTENT ── */}
      {/* All primary messaging lives here — never on the video */}
      {(belowHeroHeadline || belowHeroSubheadline || ctas || trustIndicators || children) && (
        <section className="bg-white border-b border-slate-100 py-10 sm:py-14">
          <div className="max-w-4xl mx-auto px-6">
            {children ? (
              children
            ) : (
              <>
                {belowHeroHeadline && (
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
                    {belowHeroHeadline}
                  </h1>
                )}
                {belowHeroSubheadline && (
                  <p className="text-slate-600 text-lg leading-relaxed mb-8 max-w-2xl">
                    {belowHeroSubheadline}
                  </p>
                )}
                {ctas && ctas.length > 0 && (
                  <div className="flex flex-wrap gap-3 mb-6">
                    {ctas.map((cta) => (
                      <a
                        key={cta.href}
                        href={cta.href}
                        className={
                          cta.variant === 'secondary'
                            ? 'border border-slate-300 text-slate-700 font-bold px-7 py-3 rounded-lg hover:bg-slate-50 transition-colors text-sm'
                            : 'bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3 rounded-lg transition-colors text-sm'
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
                      <li key={item} className="flex items-center gap-1.5 text-slate-500 text-sm">
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

      {/* ── TRANSCRIPT ── */}
      {/* Expandable, below the fold — never over the video */}
      {transcript && (
        <div className="bg-slate-50 border-b border-slate-100">
          <div className="max-w-4xl mx-auto px-6 py-3">
            <button
              onClick={() => setTranscriptOpen((o) => !o)}
              aria-expanded={transcriptOpen}
              aria-controls={transcriptId}
              className="flex items-center gap-2 text-slate-500 text-xs font-semibold hover:text-slate-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-red-500 rounded"
            >
              <span>{transcriptOpen ? '▲' : '▼'}</span>
              Video transcript
            </button>
            {transcriptOpen && (
              <p
                id={transcriptId}
                className="mt-3 text-slate-600 text-sm leading-relaxed max-w-2xl"
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
