'use client';

/**
 * CprHero — CPR & First Aid program hero.
 *
 * Uses cpr-training-real.jpg as a full-bleed cinematic image.
 * No text, CTAs, or overlays on the image — all content renders below.
 * Voiceover audio plays on first user gesture.
 */

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function CprHero() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(true);

  // Play voiceover on first user gesture
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handler = () => {
      if (audio.paused) {
        audio.play().then(() => setMuted(false)).catch(() => {});
      }
      ['click', 'scroll', 'touchstart', 'keydown'].forEach((e) =>
        window.removeEventListener(e, handler, { capture: true } as EventListenerOptions)
      );
    };
    ['click', 'scroll', 'touchstart', 'keydown'].forEach((e) =>
      window.addEventListener(e, handler, { capture: true, passive: true })
    );
    return () => {
      ['click', 'scroll', 'touchstart', 'keydown'].forEach((e) =>
        window.removeEventListener(e, handler, { capture: true } as EventListenerOptions)
      );
    };
  }, []);

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;
    if (muted) {
      audio.play().then(() => setMuted(false)).catch(() => {});
    } else {
      audio.pause();
      setMuted(true);
    }
  }

  return (
    <>
      {/* IMAGE FRAME — no text on it */}
      <section
        className="relative w-full overflow-hidden bg-slate-900"
        style={{ height: 'clamp(400px, 56vw, 780px)' }}
        aria-label="CPR & First Aid hero"
      >
        <Image
          src="/images/pages/cpr-training-real.jpg"
          alt="CPR training session"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        <audio
          ref={audioRef}
          src="/audio/heroes/cpr.mp3"
          preload="metadata"
          aria-hidden="true"
        />

        {/* Micro-label — bottom-left, 3 words max */}
        <div className="absolute bottom-4 left-4 z-10">
          <span className="text-white/80 text-xs font-semibold tracking-widest uppercase bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded">
            CPR &amp; First Aid
          </span>
        </div>

        {/* Sound toggle — bottom-right */}
        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={toggleMute}
            aria-label={muted ? 'Play voiceover' : 'Mute voiceover'}
            className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-black/40 text-white text-xs backdrop-blur-sm hover:bg-black/60 transition-colors"
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{muted ? 'Hear how it works' : 'Mute'}</span>
          </button>
        </div>
      </section>

      {/* BELOW-HERO CONTENT — all text lives here */}
      <div className="bg-white border-b border-slate-100 py-10 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-3">CPR &amp; First Aid Certification</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
            Get CPR certified — from the comfort of your own home.
          </h1>
          <p className="text-slate-600 text-lg leading-relaxed mb-6 max-w-2xl">
            A training mannequin is shipped directly to your door. A live instructor guides you through every step online. One session. Same-day certification card. <strong>$130</strong> — or free with any Elevate program enrollment.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/apply?program=cpr-first-aid"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors"
            >
              Enroll — $130
            </Link>
            <Link
              href="/programs/cpr-first-aid#details"
              className="border border-slate-300 text-slate-700 font-semibold px-8 py-3.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
