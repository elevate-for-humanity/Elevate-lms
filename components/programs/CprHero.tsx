'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

/**
 * CPR & First Aid program hero.
 *
 * No video file exists for CPR — uses the cpr-mannequin.jpg photo as a
 * full-bleed cinematic hero. The cpr.mp3 voiceover plays automatically on
 * the first user gesture (scroll/click/touchstart) — same policy as
 * useHeroVideo. Script lines animate in sync with the audio timing.
 *
 * Script (matches cpr.mp3):
 *   "Get CPR and First Aid certified — from the comfort of your own home.
 *    A training mannequin is shipped directly to your door.
 *    A live instructor guides you through every step online.
 *    One session. Same-day certification. $130.
 *    Enroll today at Elevate for Humanity."
 */

const SCRIPT_LINES = [
  { text: 'Get CPR and First Aid certified —',         start: 0,    end: 3.2  },
  { text: 'from the comfort of your own home.',         start: 3.2,  end: 6.0  },
  { text: 'A training mannequin is shipped to your door.', start: 6.5, end: 10.5 },
  { text: 'A live instructor guides you through every step.', start: 11.0, end: 15.0 },
  { text: 'One session. Same-day certification.',       start: 15.5, end: 19.0 },
  { text: '$130. Enroll today.',                        start: 19.5, end: 22.5 },
];

export default function CprHero() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [activeLine, setActiveLine] = useState<number>(-1);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number>(0);

  // Sync caption line to audio currentTime
  function syncCaptions() {
    const audio = audioRef.current;
    if (!audio) return;
    const t = audio.currentTime;
    const idx = SCRIPT_LINES.findIndex((l) => t >= l.start && t < l.end);
    setActiveLine(idx);
    rafRef.current = requestAnimationFrame(syncCaptions);
  }

  function startAudio() {
    const audio = audioRef.current;
    if (!audio || playing) return;
    audio.play().then(() => {
      setPlaying(true);
      rafRef.current = requestAnimationFrame(syncCaptions);
    }).catch(() => {});
  }

  // Play on first user gesture anywhere on the page
  useEffect(() => {
    const handler = () => {
      startAudio();
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
      cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAudioEnded() {
    setPlaying(false);
    setActiveLine(-1);
    cancelAnimationFrame(rafRef.current);
  }

  function handleReplay() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().then(() => {
      setPlaying(true);
      rafRef.current = requestAnimationFrame(syncCaptions);
    }).catch(() => {});
  }

  return (
    <section className="relative w-full h-[60vh] sm:h-[70vh] min-h-[400px] overflow-hidden">
      {/* Background photo */}
      <Image
        src="/images/pages/cpr-mannequin.jpg"
        alt="CPR training mannequin for at-home certification"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Hidden audio */}
      <audio
        ref={audioRef}
        src="/audio/heroes/cpr.mp3"
        preload="auto"
        onEnded={handleAudioEnded}
        aria-hidden="true"
      />

      {/* Animated caption overlay — bottom of hero */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-8 px-4 pointer-events-none">
        <div className="min-h-[3.5rem] flex items-center justify-center mb-4">
          {SCRIPT_LINES.map((line, i) => (
            <p
              key={i}
              className={`absolute text-center text-white font-bold text-lg sm:text-2xl leading-snug drop-shadow-lg transition-all duration-300 max-w-2xl px-4 ${
                activeLine === i
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-2 pointer-events-none'
              }`}
            >
              {line.text}
            </p>
          ))}
          {activeLine === -1 && !playing && (
            <p className="text-slate-500 text-sm font-medium drop-shadow">
              CPR &amp; First Aid — Train From Home
            </p>
          )}
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 justify-center pointer-events-auto">
          <Link
            href="/apply?program=cpr-first-aid"
            className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg shadow-lg transition-all text-sm sm:text-base"
          >
            Enroll — $130
          </Link>
          {!playing && (
            <button
              onClick={handleReplay}
              aria-label="Play course overview"
              className="bg-white/15 border border-white/30 text-white font-semibold px-5 py-3 rounded-lg hover:bg-white/25 transition-all text-sm backdrop-blur-sm"
            >
              ▶ Hear How It Works
            </button>
          )}
        </div>
      </div>

      {/* Price badge */}
      <div className="absolute top-4 right-4 bg-brand-red-600 text-white font-extrabold text-sm px-3 py-1.5 rounded-full shadow-lg">
        $130 · Live Instructor
      </div>
    </section>
  );
}
