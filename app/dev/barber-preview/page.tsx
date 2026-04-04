'use client';

import { useEffect, useRef, useState } from 'react';

const LESSONS = [
  { num: 1, slug: 'barber-lesson-1', title: 'Welcome to the Barber Apprenticeship',  module: 'Module 1 — Infection Control & Safety' },
  { num: 2, slug: 'barber-lesson-2', title: 'Infection Control Fundamentals',         module: 'Module 1 — Infection Control & Safety' },
  { num: 3, slug: 'barber-lesson-3', title: 'Bloodborne Pathogens & OSHA Standards',  module: 'Module 1 — Infection Control & Safety' },
  { num: 4, slug: 'barber-lesson-4', title: 'Tool Disinfection Procedures',           module: 'Module 1 — Infection Control & Safety' },
  { num: 5, slug: 'barber-lesson-5', title: 'Shop Sanitation & Client Safety',        module: 'Module 1 — Infection Control & Safety' },
];

export default function BarberPreviewPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [idx, setIdx] = useState(0);
  const [error, setError] = useState(false);
  const [ended, setEnded] = useState(false);

  const lesson = LESSONS[idx];
  const src = `/videos/barber-lessons/${lesson.slug}.mp4`;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    setError(false);
    setEnded(false);
    v.load();
    v.play().catch(() => {});
  }, [idx]);

  function prev() { if (idx > 0) setIdx(idx - 1); }
  function next() { if (idx < LESSONS.length - 1) setIdx(idx + 1); }

  return (
    <div className="min-h-screen bg-black flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800">
        <span className="text-amber-500 font-bold text-sm tracking-widest uppercase">
          Barber Apprenticeship — Preview
        </span>
        <span className="text-slate-500 text-sm tabular-nums">
          {idx + 1} / {LESSONS.length}
        </span>
      </div>

      {/* Video */}
      <div className="w-full bg-black relative" style={{ aspectRatio: '16/9' }}>
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500">
            <p className="text-sm">Video unavailable</p>
            <p className="text-xs font-mono text-slate-700">{src}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            key={lesson.slug}
            src={src}
            className="w-full h-full"
            controls
            autoPlay
            playsInline
            onError={() => setError(true)}
            onEnded={() => setEnded(true)}
          />
        )}

        {ended && idx < LESSONS.length - 1 && (
          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-4">
            <p className="text-slate-400 text-sm uppercase tracking-widest">Up next</p>
            <p className="text-white text-xl font-bold">{LESSONS[idx + 1].title}</p>
            <button
              onClick={next}
              className="mt-2 px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors"
            >
              Play Next →
            </button>
          </div>
        )}
      </div>

      {/* Info + nav */}
      <div className="bg-slate-900 border-t border-slate-800 px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-amber-500 text-xs uppercase tracking-widest font-semibold mb-1">{lesson.module}</p>
          <h1 className="text-white text-2xl font-bold">{lesson.title}</h1>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={prev}
            disabled={idx === 0}
            className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            ← Prev
          </button>
          <button
            onClick={next}
            disabled={idx === LESSONS.length - 1}
            className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Strip */}
      <div className="flex gap-2 px-6 py-4 overflow-x-auto bg-slate-950 border-t border-slate-800">
        {LESSONS.map((l, i) => (
          <button
            key={l.slug}
            onClick={() => setIdx(i)}
            className={`flex-shrink-0 w-48 text-left px-4 py-3 rounded-lg border transition-colors ${
              i === idx
                ? 'bg-amber-900/40 border-amber-600'
                : 'bg-slate-900 border-slate-800 hover:border-slate-600'
            }`}
          >
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${i === idx ? 'text-amber-400' : 'text-slate-600'}`}>
              Lesson {l.num}
            </p>
            <p className={`text-sm font-medium leading-snug line-clamp-2 ${i === idx ? 'text-white' : 'text-slate-400'}`}>
              {l.title}
            </p>
          </button>
        ))}
      </div>

    </div>
  );
}
