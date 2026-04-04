'use client';

import { useEffect, useRef, useState } from 'react';

const LESSONS = [
  { num: 1,  title: 'Welcome to the Barber Apprenticeship',  module: 'Infection Control & Safety' },
  { num: 4,  title: 'Tool Disinfection Procedures',           module: 'Infection Control & Safety' },
  { num: 5,  title: 'Shop Sanitation & Client Safety',        module: 'Infection Control & Safety' },
  { num: 6,  title: 'Indiana Barbering Laws & Regulations',   module: 'Infection Control & Safety' },
  { num: 9,  title: 'Hair Growth Cycle',                      module: 'Hair Science & Scalp Analysis' },
  { num: 10, title: 'Hair Texture, Density & Porosity',       module: 'Hair Science & Scalp Analysis' },
  { num: 11, title: 'Scalp Conditions & Disorders',           module: 'Hair Science & Scalp Analysis' },
  { num: 18, title: 'Clipper Maintenance & Blade Care',       module: 'Tools, Equipment & Ergonomics' },
  { num: 19, title: 'Ergonomics & Body Mechanics',            module: 'Tools, Equipment & Ergonomics' },
  { num: 20, title: 'Draping & Client Preparation',           module: 'Tools, Equipment & Ergonomics' },
  { num: 22, title: 'Head Shape & Sectioning',                module: 'Haircutting Techniques' },
  { num: 27, title: 'Flat Top & Classic Cuts',                module: 'Haircutting Techniques' },
  { num: 29, title: 'Shave Preparation & Hot Towel Service',  module: 'Shaving & Beard Services' },
  { num: 32, title: 'Post-Shave Care & Skin Treatment',       module: 'Shaving & Beard Services' },
  { num: 35, title: 'Written Exam Strategies',                module: 'State Board Exam Prep' },
  { num: 36, title: 'Practical Exam Preparation',             module: 'State Board Exam Prep' },
  { num: 37, title: 'Mock State Board Exam',                  module: 'State Board Exam Prep' },
  { num: 38, title: 'Career Pathways in Barbering',           module: 'Career Launch' },
  { num: 41, title: 'Advanced Cutting Techniques',            module: 'Career Launch' },
  { num: 42, title: 'Building Your Client Book',              module: 'Career Launch' },
  { num: 43, title: 'Continuing Education & Growth',          module: 'Career Launch' },
  { num: 46, title: 'Capstone Project Overview',              module: 'Career Launch' },
  { num: 47, title: 'Portfolio Development',                  module: 'Career Launch' },
  { num: 48, title: 'Final Assessment Prep',                  module: 'Career Launch' },
  { num: 49, title: 'Program Completion & Next Steps',        module: 'Career Launch' },
];

export default function SlidePreviewPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  const current = LESSONS[activeIdx];

  // Load + autoplay whenever the active lesson changes
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.load();
    v.play().catch(() => {});
  }, [activeIdx]);

  function handleEnded() {
    if (activeIdx < LESSONS.length - 1) {
      setActiveIdx((i) => i + 1);
    } else {
      setPlaying(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col lg:flex-row">

      {/* ── VIDEO PANEL ── */}
      <div className="flex-1 flex flex-col">
        <div className="bg-black aspect-video w-full">
          <video
            ref={videoRef}
            key={current.num}
            src={`/videos/barber-lessons/barber-lesson-${current.num}.mp4`}
            className="w-full h-full object-contain"
            autoPlay
            playsInline
            controls
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={handleEnded}
          />
        </div>

        {/* Now playing bar */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between gap-4 border-t border-slate-800">
          <div className="min-w-0">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-0.5">{current.module}</p>
            <p className="font-bold text-white truncate">Lesson {current.num} — {current.title}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
              disabled={activeIdx === 0}
              className="p-2 rounded-lg hover:bg-slate-700 disabled:opacity-30 transition-colors"
              aria-label="Previous"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
              </svg>
            </button>
            <button
              onClick={() => setActiveIdx((i) => Math.min(LESSONS.length - 1, i + 1))}
              disabled={activeIdx === LESSONS.length - 1}
              className="p-2 rounded-lg hover:bg-slate-700 disabled:opacity-30 transition-colors"
              aria-label="Next"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6h2v12h-2z"/>
              </svg>
            </button>
          </div>
          <p className="text-slate-500 text-sm flex-shrink-0">{activeIdx + 1} / {LESSONS.length}</p>
        </div>
      </div>

      {/* ── PLAYLIST ── */}
      <div className="lg:w-80 bg-slate-900 border-l border-slate-800 overflow-y-auto lg:max-h-screen">
        <div className="px-4 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Barber Apprenticeship</p>
          <p className="text-sm text-slate-300 mt-0.5">{LESSONS.length} lessons</p>
        </div>
        <ul>
          {LESSONS.map((lesson, idx) => (
            <li key={lesson.num}>
              <button
                onClick={() => setActiveIdx(idx)}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors border-b border-slate-800/50 ${
                  idx === activeIdx
                    ? 'bg-red-900/40 border-l-2 border-l-red-500'
                    : 'hover:bg-slate-800'
                }`}
              >
                <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                  idx === activeIdx ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-400'
                }`}>
                  {idx === activeIdx && playing ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                  ) : (
                    lesson.num
                  )}
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-medium leading-snug ${idx === activeIdx ? 'text-white' : 'text-slate-300'}`}>
                    {lesson.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{lesson.module}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
