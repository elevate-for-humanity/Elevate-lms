"use client";

import * as React from "react";
import { Play, Volume2, BookOpen } from "lucide-react";

interface LessonPlayerProps {
  videoUrl: string;
  lessonTitle: string;
  moduleTitle?: string;
  transcript?: string | null;
  onProgress?: (percent: number) => void;
  onComplete?: () => void;
}

/**
 * Audio-first lesson player for AI-generated narrated lessons (MP4 with
 * static/blank video track). Shows a branded overlay instead of a black
 * frame, surfaces the audio controls prominently, and provides an
 * optional transcript panel.
 */
export default function LessonPlayer({
  videoUrl,
  lessonTitle,
  moduleTitle,
  transcript,
  onProgress,
  onComplete,
}: LessonPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [hasStarted, setHasStarted] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [showOverlay, setShowOverlay] = React.useState(true);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    v.muted = false;
    if (typeof v.volume === "number") v.volume = 1;

    const onPlay = () => {
      setHasStarted(true);
      setIsPlaying(true);
      setShowOverlay(false);
    };
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      onComplete?.();
    };
    const onTimeUpdate = () => {
      const t = v.currentTime;
      const d = v.duration;
      setCurrentTime(t);
      if (d && onProgress) onProgress((t / d) * 100);
    };
    const onLoaded = () => {
      if (v.duration && !isNaN(v.duration)) setDuration(v.duration);
    };

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("loadedmetadata", onLoaded);

    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [onComplete, onProgress]);

  const start = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      v.muted = false;
      if (typeof v.volume === "number") v.volume = 1;
      await v.play();
    } catch (e) {
      // If autoplay policy blocks, hide overlay so native controls are visible
      console.error("LessonPlayer play() blocked:", e);
      setShowOverlay(false);
    }
  };

  const togglePlay = async () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      await start();
    } else {
      v.pause();
    }
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full">
      {/* Player container */}
      <div className="relative w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
        <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
          {/* Branded overlay — replaces black screen perception */}
          {showOverlay && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
              <div className="mx-auto max-w-2xl px-6 text-center text-white">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue-600/20">
                  <BookOpen className="h-8 w-8 text-brand-blue-400" />
                </div>

                {moduleTitle && (
                  <p className="text-xs uppercase tracking-wider text-slate-400">
                    {moduleTitle}
                  </p>
                )}

                <h2 className="mt-2 text-xl font-semibold sm:text-2xl">
                  {lessonTitle}
                </h2>

                <p className="mt-3 text-sm text-slate-300">
                  Narrated instructional lesson. Click below to begin audio-guided training.
                </p>

                <button
                  type="button"
                  onClick={start}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-blue-700"
                >
                  <Play className="h-4 w-4" />
                  Start Lesson
                </button>

                <p className="mt-3 flex items-center justify-center gap-1 text-xs text-slate-400">
                  <Volume2 className="h-3 w-3" />
                  Ensure your volume is on
                </p>
              </div>
            </div>
          )}

          {/* Hidden video element — drives audio playback */}
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full"
            src={videoUrl}
            preload="metadata"
            playsInline
          />

          {/* Post-start: branded playback panel (replaces black video frame) */}
          {hasStarted && !showOverlay && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
              {/* Animated audio indicator */}
              <div className="mb-6 flex items-end gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full bg-brand-blue-500 transition-all duration-300 ${
                      isPlaying ? "animate-pulse" : ""
                    }`}
                    style={{
                      height: isPlaying ? `${12 + Math.random() * 20}px` : "6px",
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>

              {moduleTitle && (
                <p className="text-xs uppercase tracking-wider text-slate-400">
                  {moduleTitle}
                </p>
              )}
              <h3 className="mt-1 text-lg font-semibold text-white sm:text-xl">
                {lessonTitle}
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                {isPlaying ? "Playing narration..." : "Paused"}
                {duration > 0 && ` — ${fmt(currentTime)} / ${fmt(duration)}`}
              </p>

              {/* Play/pause toggle */}
              <button
                type="button"
                onClick={togglePlay}
                className="mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue-600 text-white transition hover:bg-brand-blue-700"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <Play className="h-6 w-6 ml-0.5" />
                )}
              </button>

              {/* Progress bar */}
              {duration > 0 && (
                <div className="mt-5 w-full max-w-md px-6">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
                    <div
                      className="h-full rounded-full bg-brand-blue-500 transition-all duration-300"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info panel below player */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {lessonTitle}
        </h3>
        {moduleTitle && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Module: {moduleTitle}
          </p>
        )}
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          This lesson uses audio narration to guide you through the material.
          If the screen appears static, that is expected — the narration is the instruction.
        </p>

        {transcript && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold text-brand-blue-600 dark:text-brand-blue-400">
              View lesson transcript
            </summary>
            <div className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
              {transcript}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
