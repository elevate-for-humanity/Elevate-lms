'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Play, Pause, Maximize2 } from 'lucide-react';

/**
 * Demo video shown on the store page.
 * Uses Module 1, Lesson 1 of the HVAC Technician course as a live sample
 * of the course content organizations can license.
 */
export default function StoreDemoVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);

  const start = () => {
    setStarted(true);
    setTimeout(() => {
      videoRef.current?.play().then(() => setPlaying(true)).catch(() => {});
    }, 100);
  };

  const toggle = () => {
    if (!started) { start(); return; }
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };

  const fullscreen = () => {
    videoRef.current?.requestFullscreen?.();
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 aspect-video group cursor-pointer transition-transform duration-700 ease-out ${started ? 'scale-[1.02]' : 'scale-100'}`}
      onClick={toggle}
    >
      {/* Poster — shown before play */}
      {!started && (
        <>
          <Image
            src="/images/pages/hvac-technician.jpg"
            alt="HVAC Technician course — Module 1 preview"
            fill
            className="object-cover"
            sizes="100vw"
            quality={90}
            priority
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform mb-4">
              <Play className="w-11 h-11 text-brand-red-600 ml-1" />
            </div>
            <p className="text-white font-bold text-lg drop-shadow-lg">Watch: HVAC Course — Module 1, Lesson 1</p>
            <p className="text-white/80 text-sm mt-1 drop-shadow">Sample lesson from the licensable HVAC Technician course</p>
          </div>
        </>
      )}

      {/* Video — single file, no loop */}
      {started && (
        <>
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-contain bg-black"
            playsInline
            controls={false}
            onEnded={() => setPlaying(false)}
          >
            <source src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/course-videos/hvac/hvac-module1-lesson1.mp4`} type="video/mp4" />
          </video>
          <div className="absolute bottom-0 inset-x-0 p-3 flex items-center justify-between bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); toggle(); }} className="text-white hover:text-white/80">
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); fullscreen(); }} className="text-white hover:text-white/80">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
