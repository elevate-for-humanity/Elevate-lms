'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface CaptionSegment {
  start: number;
  end: number;
  text: string;
}

interface Props {
  segments: CaptionSegment[];
  /**
   * CSS selector used to locate the video element. Defaults to 'video' which
   * finds the first video in the document. On pages with multiple video elements
   * pass a scoped selector (e.g. '[data-lesson-video]') to target the correct one.
   */
  videoSelector?: string;
}

export default function VideoCaptions({ segments, videoSelector = 'video' }: Props) {
  const [currentTime, setCurrentTime] = useState(0);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let video: HTMLVideoElement | null = null;
    let handler: (() => void) | null = null;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    const findVideo = () => {
      video = document.querySelector(videoSelector) as HTMLVideoElement;
      if (video) {
        handler = () => setCurrentTime(video!.currentTime);
        video.addEventListener('timeupdate', handler);
      } else if (attempts < 30) {
        attempts++;
        timer = setTimeout(findVideo, 500);
      }
    };

    findVideo();
    return () => {
      clearTimeout(timer);
      if (video && handler) video.removeEventListener('timeupdate', handler);
    };
  }, [videoSelector]);

  useEffect(() => {
    const idx = segments.findIndex(s => currentTime >= s.start && currentTime < s.end);
    setActiveIdx(idx);
  }, [currentTime, segments]);

  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIdx]);

  const seekTo = (time: number) => {
    const video = document.querySelector(videoSelector) as HTMLVideoElement;
    if (video) {
      video.currentTime = time;
      video.play().catch(() => {});
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-200 flex items-center gap-2 bg-slate-50">
        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        <span className="text-base font-semibold text-slate-700">Lesson Transcript</span>
        <span className="text-sm text-slate-400 ml-auto hidden sm:inline">Tap any line to jump to that point</span>
      </div>
      <div
        ref={containerRef}
        className="max-h-[250px] sm:max-h-[400px] overflow-y-auto p-3 sm:p-4"
        style={{ scrollbarWidth: 'thin' }}
      >
        {segments.map((seg, i) => {
          const isActive = i === activeIdx;
          const isPast = activeIdx >= 0 && i < activeIdx;
          return (
            <div
              key={i}
              ref={isActive ? activeRef : undefined}
              onClick={() => seekTo(seg.start)}
              className={`flex gap-3 sm:gap-4 px-3 sm:px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 mb-2 min-h-[44px] ${
                isActive
                  ? 'bg-brand-blue-50 border-2 border-brand-blue-400 shadow-sm'
                  : isPast
                  ? 'opacity-60 hover:opacity-90 hover:bg-slate-50'
                  : 'hover:bg-slate-50 border border-transparent'
              }`}
            >
              <span className={`text-sm font-mono whitespace-nowrap pt-0.5 min-w-[3rem] ${
                isActive ? 'text-brand-blue-600 font-bold' : 'text-slate-400'
              }`}>
                {formatTime(seg.start)}
              </span>
              <span className={`text-base leading-relaxed ${
                isActive ? 'text-slate-900 font-semibold' : 'text-slate-600'
              }`}>
                {seg.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
