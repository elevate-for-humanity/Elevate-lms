'use client';

/**
 * HomeHero — home page hero.
 *
 * Video autoplays muted (browser requirement).
 * Voiceover (homepage-hero-new.mp3) starts automatically on first scroll,
 * unmuted. A toggle lets the user mute/unmute after that.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Volume2, VolumeX } from 'lucide-react';

export default function HomeHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);

  // Autoplay video muted on mount
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    v.play().catch(() => {});
  }, []);

  // Start voiceover unmuted on first scroll
  useEffect(() => {
    if (started) return;
    const audio = audioRef.current;
    if (!audio) return;

    const onScroll = () => {
      if (started) return;
      setStarted(true);
      audio.play()
        .then(() => setPlaying(true))
        .catch(() => {});
      window.removeEventListener('scroll', onScroll);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [started]);

  function toggleAudio() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play()
        .then(() => { setPlaying(true); setStarted(true); })
        .catch(() => {});
    }
  }

  return (
    <section className="bg-slate-950 px-4 sm:px-8 py-10 sm:py-14">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

        {/* VIDEO CARD — no text overlay */}
        <div
          className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
          style={{ aspectRatio: '16/9' }}
        >
          <video
            ref={videoRef}
            src="/videos/barber-hero.mp4"
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Home page voiceover — separate audio track */}
          <audio
            ref={audioRef}
            src="/videos/homepage-hero-new.mp3"
            preload="auto"
            onEnded={() => setPlaying(false)}
            aria-hidden="true"
          />

          {/* Micro-label — bottom-left only */}
          <div className="absolute bottom-3 left-3 z-10">
            <span className="text-white/80 text-xs font-semibold tracking-widest uppercase bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded">
              Elevate for Humanity
            </span>
          </div>

          {/* Sound toggle — bottom-right */}
          <div className="absolute bottom-3 right-3 z-10">
            <button
              onClick={toggleAudio}
              aria-label={playing ? 'Mute voiceover' : 'Play voiceover'}
              className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-black/60 text-white text-xs backdrop-blur-sm hover:bg-black/80 transition-colors border border-white/20"
            >
              {playing
                ? <><Volume2 className="w-3.5 h-3.5" /><span>Mute</span></>
                : <><VolumeX className="w-3.5 h-3.5" /><span className="font-semibold">▶ Sound</span></>
              }
            </button>
          </div>
        </div>

        {/* COPY — all text lives here, never on the video */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">
            Indianapolis, Indiana
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-5">
            We train adults for real jobs —<br className="hidden sm:block" /> in weeks, not years.
          </h1>
          <p className="text-slate-300 text-base leading-relaxed mb-4 max-w-lg">
            Short-term career training in healthcare, skilled trades, CDL, barbering, and technology.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-lg">
            Most programs are available at{' '}
            <span className="text-white font-semibold">no cost</span> to eligible Indiana residents
            through WIOA and state funding. DOL Registered Apprenticeship Sponsor. ETPL approved.
          </p>

          <div className="flex flex-wrap gap-2 mb-8">
            {['DOL Registered Apprenticeship', 'ETPL Approved', 'WIOA Funded', 'Indiana DWD Partner'].map((b) => (
              <span key={b} className="text-xs font-semibold text-slate-300 bg-white/10 border border-white/10 px-3 py-1 rounded-full">
                {b}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/wioa-eligibility"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-base"
            >
              Start Here — It&apos;s Free
            </Link>
            <Link
              href="/programs"
              className="border border-white/20 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-base"
            >
              See All Programs
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
