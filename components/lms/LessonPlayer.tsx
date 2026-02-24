"use client";

import * as React from "react";
import { Play, Pause, Volume2, BookOpen, RotateCcw } from "lucide-react";

interface LessonPlayerProps {
  videoUrl: string;
  lessonTitle: string;
  moduleTitle?: string;
  transcript?: string | null;
  onProgress?: (percent: number) => void;
  onComplete?: () => void;
}

/**
 * Audio-first lesson player for AI-generated narrated lessons.
 * Uses <audio> instead of <video> — no black frame is possible.
 */
export default function LessonPlayer({
  videoUrl,
  lessonTitle,
  moduleTitle,
  transcript,
  onProgress,
  onComplete,
}: LessonPlayerProps) {
  // Use <video> as the playback engine because the MP4 container
  // (content-type video/mp4) is rejected by <audio> in most browsers.
  // The element is hidden — all visuals come from the branded UI below.
  const audioRef = React.useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [hasStarted, setHasStarted] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [ended, setEnded] = React.useState(false);

  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    a.volume = 1;

    const onPlay = () => {
      setIsPlaying(true);
      setHasStarted(true);
    };
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setEnded(true);
      onComplete?.();
    };
    const onTimeUpdate = () => {
      setCurrentTime(a.currentTime);
      if (a.duration && onProgress) {
        onProgress((a.currentTime / a.duration) * 100);
      }
    };
    const onLoaded = () => {
      if (a.duration && !isNaN(a.duration)) setDuration(a.duration);
    };

    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);
    a.addEventListener("timeupdate", onTimeUpdate);
    a.addEventListener("loadedmetadata", onLoaded);

    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("timeupdate", onTimeUpdate);
      a.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [onComplete, onProgress]);

  const play = async () => {
    const a = audioRef.current;
    if (!a) return;
    try {
      a.volume = 1;
      await a.play();
    } catch (e) {
      console.error("LessonPlayer play() blocked:", e);
    }
  };

  const togglePlay = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      await play();
    } else {
      a.pause();
    }
  };

  const restart = async () => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = 0;
    setEnded(false);
    await play();
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    a.currentTime = pct * duration;
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full">
      {/* Hidden video element used as audio engine — MP4 container requires <video>.
          Visually hidden so no black frame is ever shown. */}
      <video
        ref={audioRef}
        src={videoUrl}
        preload="metadata"
        playsInline
        className="sr-only"
        aria-hidden="true"
      />

      {/* Player card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-xl">
        <div className="px-6 py-10 sm:px-10 sm:py-14">
          <div className="mx-auto max-w-lg text-center">
            {/* Icon */}
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue-600/20">
              <BookOpen className="h-8 w-8 text-brand-blue-400" />
            </div>

            {/* Module label */}
            {moduleTitle && (
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                {moduleTitle}
              </p>
            )}

            {/* Lesson title */}
            <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
              {lessonTitle}
            </h2>

            {/* Status text */}
            <p className="mt-2 text-sm text-slate-400">
              {!hasStarted
                ? "Narrated lesson \u2014 click play to begin"
                : ended
                  ? "Lesson complete"
                  : isPlaying
                    ? "Playing..."
                    : "Paused"}
            </p>

            {/* Audio visualizer bars */}
            {hasStarted && (
              <div className="mt-5 flex items-end justify-center gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-brand-blue-500 transition-all duration-150"
                    style={{
                      height: isPlaying
                        ? `${8 + ((Math.sin(Date.now() / 200 + i * 0.8) + 1) / 2) * 20}px`
                        : "4px",
                    }}
                  />
                ))}
              </div>
            )}

            {/* Play / Pause / Restart button */}
            <div className="mt-6">
              {ended ? (
                <button
                  type="button"
                  onClick={restart}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-blue-600 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-blue-700"
                >
                  <RotateCcw className="h-4 w-4" />
                  Replay Lesson
                </button>
              ) : (
                <button
                  type="button"
                  onClick={togglePlay}
                  className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue-600 text-white shadow-lg transition hover:bg-brand-blue-700 hover:shadow-xl"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 ml-0.5" />
                  )}
                </button>
              )}
            </div>

            {/* Progress bar + time */}
            {(hasStarted || duration > 0) && (
              <div className="mt-6">
                <div
                  className="mx-auto h-2 max-w-md cursor-pointer overflow-hidden rounded-full bg-slate-700"
                  onClick={seek}
                  role="progressbar"
                  aria-valuenow={Math.round(progressPct)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-brand-blue-500 transition-all duration-200"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-slate-500">
                  <span>{fmt(currentTime)}</span>
                  <span>{duration > 0 ? fmt(duration) : "--:--"}</span>
                </div>
              </div>
            )}

            {/* Volume hint */}
            {!hasStarted && (
              <p className="mt-4 flex items-center justify-center gap-1 text-xs text-slate-500">
                <Volume2 className="h-3 w-3" />
                Make sure your volume is on
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Info panel */}
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
          The screen displays lesson information while the audio plays.
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
