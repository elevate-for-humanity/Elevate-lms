"use client";

import React, { useRef } from 'react';
import { useAutoPlayOnVisible } from '@/hooks/useAutoPlayOnVisible';
import { useVideoProgress } from '@/hooks/useVideoProgress';

type VideoShellProps = {
  src: string;
  title?: string;
  poster?: string;
  caption?: string;
  onEnded?: () => void;
  className?: string;
  layout?: 'vertical' | 'horizontal';
  lessonId?: string | number;
  autoPlay?: boolean;
};

export function VideoShell({
  src,
  title,
  poster,
  caption,
  onEnded,
  className = '',
  layout = 'vertical',
  lessonId,
  autoPlay = true,
}: VideoShellProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // TikTok-style behavior - always call hook, pass autoPlay flag
  useAutoPlayOnVisible(videoRef, autoPlay);

  // Progress tracking for LMS
  useVideoProgress(videoRef, { lessonId, threshold: 0.8 });

  const handlePlayPause = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch((err) => {
        // Video playback may fail due to browser autoplay policies
      });
    } else {
      v.pause();
    }
  };

  const isVertical = layout === 'vertical';

  return (
    <div
      className={[
        'relative overflow-hidden shadow-2xl bg-black border border-slate-900',
        'rounded-3xl',
        isVertical
          ? 'w-full aspect-[9/16] max-w-[420px] mx-auto sm:max-w-[460px]'
          : 'w-full max-w-5xl mx-auto aspect-video',
        className,
      ].join(' ')}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="h-full w-full object-cover cursor-pointer"
        onClick={handlePlayPause}
        onEnded={onEnded}
        playsInline
        controls={false}
      />
      {/* Top overlay with title */}
      {title && (
        <div className="pointer-events-none absolute inset-x-0 top-0 p-4">
          <div className="rounded-2xl     px-4 py-3 max-w-[90%]">
            <p className="text-[0.65rem] tracking-[0.2em] text-orange-300 uppercase mb-1">
              Elevate for Humanity
            </p>
            <h2 className="text-white font-semibold text-sm sm:text-base leading-tight line-clamp-2">
              {title}
            </h2>
          </div>
        </div>
      )}
      {/* Bottom overlay with caption + brand chips + play button */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
        <div className="rounded-2xl     px-4 py-3 flex items-end justify-between gap-3">
          <div className="flex-1 min-w-0">
            {caption && (
              <p className="text-[0.8rem] sm:text-[0.9rem] leading-snug text-white/95 line-clamp-3">
                {caption}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.7rem]">
              <span className="px-2 py-0.5 rounded-full bg-orange-500/90 font-semibold uppercase tracking-wide text-[0.65rem]">
                Innovate • Elevate • Reset
              </span>
              <span className="px-2 py-0.5 rounded-full bg-brand-blue-600/80 border border-brand-blue-400/40 text-slate-100">
                Workforce Ready
              </span>
            </div>
          </div>
          {/* Play icon button */}
          <button
            type="button"
            onClick={handlePlayPause}
            className="pointer-events-auto flex-shrink-0 h-10 w-10 rounded-full border border-white/70 bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            <span className="sr-only">Play / Pause</span>
            <div className="h-0 w-0 border-y-[7px] border-y-transparent border-l-[12px] border-l-white ml-[2px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
