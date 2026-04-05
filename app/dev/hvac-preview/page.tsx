'use client';

import { useEffect, useRef, useState } from 'react';

const LESSONS = [
  {
    uuid: '2f172cb2-4657-5460-9b93-f9b062ad8dd2',
    title: 'Welcome to HVAC Technician Training',
    module: 'Module 1 — Program Orientation',
  },
  {
    uuid: '96576bf0-cbd5-581f-99aa-f36e48e694fd',
    title: 'WIOA Funding & Support Services',
    module: 'Module 1 — Program Orientation',
  },
  {
    uuid: '5c5b516c-2e7c-5cae-8231-1f4483c1a912',
    title: 'HVAC Career Pathways',
    module: 'Module 1 — Program Orientation',
  },
  {
    uuid: '4097148b-7a06-5784-9807-5e3470d4c091',
    title: 'Orientation Quiz',
    module: 'Module 1 — Program Orientation',
  },
  {
    uuid: 'ee8c4e3a-b1c6-51bf-acd5-2836c8b16e56',
    title: 'How HVAC Systems Work',
    module: 'Module 2 — HVAC Fundamentals & Safety',
  },
];

export default function HvacPreviewPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [idx, setIdx] = useState(0);
  const [error, setError] = useState(false);
  const [ended, setEnded] = useState(false);

  const lesson = LESSONS[idx];
  const src = `/hvac/videos/lesson-${lesson.uuid}.mp4`;

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
        <span className="text-orange-500 font-bold text-sm tracking-widest uppercase">
          HVAC EPA 608 — Preview
        </span>
        <span className="text-slate-500 text-sm tabular-nums">
          {idx + 1} / {LESSONS.length}
        </span>
      </div>

      {/* Video — full width 16:9 */}
      <div className="w-full bg-black relative" style={{ aspectRatio: '16/9' }}>
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500">
            <p className="text-sm">Video unavailable</p>
            <p className="text-xs font-mono text-slate-700">{src}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            key={lesson.uuid}
            src={src}
            className="w-full h-full"
            controls
            autoPlay
            playsInline
            onError={() => setError(true)}
            onEnded={() => setEnded(true)}
          />
        )}

        {/* End-of-video overlay */}
        {ended && idx < LESSONS.length - 1 && (
          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-4">
            <p className="text-slate-500 text-sm uppercase tracking-widest">Up next</p>
            <p className="text-white text-xl font-bold">{LESSONS[idx + 1].title}</p>
            <button
              onClick={next}
              className="mt-2 px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition-colors"
            >
              Play Next →
            </button>
          </div>
        )}
      </div>

      {/* Lesson info + prev/next */}
      <div className="bg-slate-900 border-t border-slate-800 px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-orange-500 text-xs uppercase tracking-widest font-semibold mb-1">
            {lesson.module}
          </p>
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
            className="px-5 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Lesson strip */}
      <div className="flex gap-2 px-6 py-4 overflow-x-auto bg-slate-950 border-t border-slate-800">
        {LESSONS.map((l, i) => (
          <button
            key={l.uuid}
            onClick={() => setIdx(i)}
            className={`flex-shrink-0 w-48 text-left px-4 py-3 rounded-lg border transition-colors ${
              i === idx
                ? 'bg-orange-900/40 border-orange-600'
                : 'bg-slate-900 border-slate-800 hover:border-slate-600'
            }`}
          >
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${i === idx ? 'text-orange-400' : 'text-slate-600'}`}>
              Lesson {i + 1}
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
