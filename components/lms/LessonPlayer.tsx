"use client";

import * as React from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Maximize2,
  Minimize2,
  BookOpen,
  SkipForward,
  SkipBack,
  Headphones,
} from "lucide-react";

interface LessonPlayerProps {
  videoUrl: string;
  lessonTitle: string;
  moduleTitle?: string;
  transcript?: string | null;
  lessonContent?: string | null;
  lessonNumber?: number;
  totalLessons?: number;
  durationMinutes?: number;
  captionUrl?: string | null;
  onProgress?: (percent: number) => void;
  onComplete?: () => void;
}

/* ── Media type detection ─────────────────────────────────── */

type MediaKind = "video" | "audio" | "unknown";

function detectMediaKind(url?: string | null): MediaKind {
  if (!url) return "unknown";
  const clean = url.toLowerCase().split("?")[0];
  if (/\.(mp4|webm|mov|m4v|ogv)$/.test(clean)) return "video";
  if (/\.(mp3|m4a|wav|aac|ogg|flac)$/.test(clean)) return "audio";
  // Default to video for URLs without extension (Supabase storage, CDN)
  return "video";
}

function mimeForUrl(url: string): string | undefined {
  const clean = url.toLowerCase().split("?")[0];
  if (clean.endsWith(".mp4")) return "video/mp4";
  if (clean.endsWith(".webm")) return "video/webm";
  if (clean.endsWith(".mov")) return "video/quicktime";
  if (clean.endsWith(".mp3")) return "audio/mpeg";
  if (clean.endsWith(".m4a")) return "audio/mp4";
  if (clean.endsWith(".wav")) return "audio/wav";
  if (clean.endsWith(".aac")) return "audio/aac";
  if (clean.endsWith(".ogg")) return "audio/ogg";
  return undefined;
}

/* ── Component ────────────────────────────────────────────── */

export default function LessonPlayer({
  videoUrl,
  lessonTitle,
  moduleTitle,
  lessonNumber,
  totalLessons,
  durationMinutes,
  captionUrl,
  onProgress,
  onComplete,
}: LessonPlayerProps) {
  const mediaKind = React.useMemo(() => detectMediaKind(videoUrl), [videoUrl]);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [hasStarted, setHasStarted] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [ended, setEnded] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [showControls, setShowControls] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const hideControlsTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWatchedRef = React.useRef(0);

  const getMedia = React.useCallback((): HTMLMediaElement | null => {
    return mediaKind === "audio" ? audioRef.current : videoRef.current;
  }, [mediaKind]);

  // Reset state when URL changes
  React.useEffect(() => {
    setIsPlaying(false);
    setHasStarted(false);
    setCurrentTime(0);
    setDuration(0);
    setEnded(false);
    setHasError(false);
    setIsLoading(true);
    maxWatchedRef.current = 0;
  }, [videoUrl]);

  // Media event listeners
  React.useEffect(() => {
    const v = getMedia();
    if (!v) return;

    const onPlay = () => { setIsPlaying(true); setHasStarted(true); setIsLoading(false); };
    const onPause = () => setIsPlaying(false);
    const onEnded = () => { setIsPlaying(false); setEnded(true); onComplete?.(); };
    const onTimeUpdate = () => {
      setCurrentTime(v.currentTime);
      if (v.currentTime > maxWatchedRef.current) {
        maxWatchedRef.current = v.currentTime;
      }
      if (v.duration && onProgress) onProgress((maxWatchedRef.current / v.duration) * 100);
    };
    const onSeeking = () => {
      if (v.currentTime > maxWatchedRef.current + 2) {
        v.currentTime = maxWatchedRef.current;
      }
    };
    const onLoaded = () => {
      if (v.duration && !isNaN(v.duration)) setDuration(v.duration);
      setIsLoading(false);
    };
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onPlaying = () => setIsLoading(false);
    const onStalled = () => setIsLoading(true);
    const onError = () => { setIsLoading(false); setHasError(true); };

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("seeking", onSeeking);
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("stalled", onStalled);
    v.addEventListener("error", onError);

    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("seeking", onSeeking);
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("stalled", onStalled);
      v.removeEventListener("error", onError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onComplete, onProgress, getMedia, videoUrl, mediaKind]);

  // Fullscreen listener
  React.useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Auto-hide controls after 3s during playback
  const resetControlsTimer = React.useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (isPlaying) {
      hideControlsTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying]);

  React.useEffect(() => {
    if (!isPlaying) setShowControls(true);
    else resetControlsTimer();
    return () => { if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current); };
  }, [isPlaying, resetControlsTimer]);

  /* ── Playback controls ──────────────────────────────────── */

  const play = async () => {
    const v = getMedia();
    if (!v) return;
    setIsLoading(true);
    setHasStarted(true);
    try { await v.play(); } catch { setIsPlaying(false); setIsLoading(false); }
  };

  const togglePlay = async () => {
    const v = getMedia();
    if (!v) return;
    if (v.paused) await play(); else v.pause();
  };

  const restart = async () => {
    const v = getMedia();
    if (!v) return;
    v.currentTime = 0;
    setEnded(false);
    await play();
  };

  const toggleMute = () => {
    const v = getMedia();
    if (!v) return;
    v.muted = !muted;
    setMuted(!muted);
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await el.requestFullscreen();
  };

  const skip = (seconds: number) => {
    const v = getMedia();
    if (!v) return;
    const target = v.currentTime + seconds;
    v.currentTime = Math.max(0, Math.min(maxWatchedRef.current + 2, target));
  };

  /* ── Seek bar helpers ───────────────────────────────────── */

  const seekFromEvent = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    target: HTMLDivElement,
  ) => {
    const v = getMedia();
    if (!v || !duration) return;
    const rect = target.getBoundingClientRect();
    const clientX =
      "touches" in e ? e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0 : e.clientX;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    v.currentTime = pct * duration;
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => seekFromEvent(e, e.currentTarget);
  const [isSeeking, setIsSeeking] = React.useState(false);
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => { setIsSeeking(true); seekFromEvent(e, e.currentTarget); };
  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => { if (isSeeking) seekFromEvent(e, e.currentTarget); };
  const onTouchEnd = () => setIsSeeking(false);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Keyboard shortcuts
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case " ": case "k": e.preventDefault(); togglePlay(); break;
        case "m": toggleMute(); break;
        case "f": if (mediaKind === "video") toggleFullscreen(); break;
        case "ArrowLeft": skip(-10); break;
        case "ArrowRight": skip(10); break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  /* ── Shared progress bar ────────────────────────────────── */

  const ProgressBar = (
    <div
      className="group flex cursor-pointer items-center py-1"
      onClick={seek}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      role="slider"
      aria-valuenow={Math.round(progressPct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Media progress"
      tabIndex={0}
    >
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/20 transition-all group-hover:h-1.5">
        <div
          className="h-full rounded-full bg-brand-blue-500 transition-all duration-150"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );

  /* ── No media: clean empty state ────────────────────────── */

  if (!videoUrl) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <BookOpen className="h-4 w-4" />
          {moduleTitle && <span>{moduleTitle} &middot; </span>}
          <span>{lessonNumber && totalLessons ? `Lesson ${lessonNumber} of ${totalLessons}` : "Lesson"}</span>
        </div>
        <h3 className="text-lg font-semibold text-slate-900">{lessonTitle}</h3>
        <p className="mt-3 text-sm text-slate-500">No playable media attached to this lesson.</p>
      </div>
    );
  }

  /* ── Audio player ───────────────────────────────────────── */

  if (mediaKind === "audio") {
    return (
      <div ref={containerRef} className="w-full">
        <div className="rounded-2xl bg-slate-900 p-6 shadow-xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue-600/20">
              <Headphones className="h-6 w-6 text-brand-blue-400" />
            </div>
            <div>
              {moduleTitle && (
                <p className="text-xs font-medium uppercase tracking-wider text-white/50">{moduleTitle}</p>
              )}
              <h3 className="text-lg font-bold text-white">{lessonTitle}</h3>
              <p className="text-xs text-white/40">
                {lessonNumber && totalLessons ? `Lesson ${lessonNumber} of ${totalLessons}` : "Audio Lesson"}
                {durationMinutes ? ` · ${durationMinutes} min` : ""}
              </p>
            </div>
          </div>

          {/* Error */}
          {hasError && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
              <p className="text-sm text-red-300">Audio failed to load.</p>
              <p className="mt-1 text-xs text-red-300/50 break-all">{videoUrl}</p>
              <button type="button" onClick={() => { setHasError(false); audioRef.current?.load(); }}
                className="mt-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20">Retry</button>
            </div>
          )}

          {/* Hidden audio element */}
          <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" className="hidden">
            <source src={videoUrl} type={mimeForUrl(videoUrl)} />
          </audio>

          {/* Controls */}
          <div className="space-y-3">
            {ProgressBar}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => skip(-10)} className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Back 10 seconds">
                  <SkipBack className="h-4 w-4" />
                </button>
                <button type="button" onClick={ended ? restart : togglePlay}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue-600 text-white hover:bg-brand-blue-500"
                  aria-label={ended ? "Replay" : isPlaying ? "Pause" : "Play"}>
                  {ended ? <RotateCcw className="h-4 w-4" /> : isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
                </button>
                <button type="button" onClick={() => skip(10)} className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Forward 10 seconds">
                  <SkipForward className="h-4 w-4" />
                </button>
                <button type="button" onClick={toggleMute} className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white" aria-label={muted ? "Unmute" : "Mute"}>
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              </div>
              <span className="text-xs tabular-nums text-white/50">
                {fmt(currentTime)} / {duration > 0 ? fmt(duration) : "--:--"}
              </span>
            </div>
          </div>

          {ended && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-brand-green-600/20 px-3 py-2 text-sm text-brand-green-400">
              <span className="text-lg">&#10003;</span> Audio lesson complete
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Video player ───────────────────────────────────────── */

  return (
    <div ref={containerRef} className="w-full" onMouseMove={resetControlsTimer}>
      <div className="relative overflow-hidden rounded-2xl bg-black shadow-2xl">
        <div className="relative aspect-video">
          <video
            ref={videoRef}
            data-lesson-video
            preload="metadata"
            playsInline
            crossOrigin="anonymous"
            className="absolute inset-0 h-full w-full object-contain bg-black"
            onClick={togglePlay}
          >
            <source src={videoUrl} type={mimeForUrl(videoUrl) || "video/mp4"} />
            {captionUrl && (
              <track kind="captions" src={captionUrl} srcLang="en" label="English" default />
            )}
          </video>

          {/* Buffering — subtle spinner, NO opaque overlay */}
          {isLoading && hasStarted && !ended && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
              <p className="mt-3 text-xs text-white/60 sm:text-sm">Buffering...</p>
            </div>
          )}

          {/* Error state — shows the URL for fast debugging */}
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
              <div className="mb-4 rounded-full bg-brand-red-500/20 p-4">
                <svg className="h-8 w-8 text-brand-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-sm text-white/70">Video could not be loaded</p>
              <p className="mt-1 max-w-md text-center text-xs text-white/30 break-all px-4">{videoUrl}</p>
              <button type="button" onClick={() => { setHasError(false); videoRef.current?.load(); }}
                className="mt-3 rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">Retry</button>
            </div>
          )}

          {/* Pre-start — semi-transparent so first frame shows through */}
          {!hasStarted && !hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer" onClick={play}>
              <div className="absolute inset-0 bg-black/55" />
              {/* Top bar */}
              <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 z-10">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 backdrop-blur-sm sm:h-8 sm:w-8">
                    <BookOpen className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" />
                  </div>
                  <div>
                    {moduleTitle && (
                      <p className="text-[10px] font-medium uppercase tracking-wider text-white/50 sm:text-xs">{moduleTitle}</p>
                    )}
                    <p className="text-xs font-medium text-white/70 sm:text-sm">
                      {lessonNumber && totalLessons ? `Lesson ${lessonNumber} of ${totalLessons}` : "Lesson"}
                    </p>
                  </div>
                </div>
                {durationMinutes && (
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/60 backdrop-blur-sm sm:text-xs">
                    {durationMinutes} min
                  </span>
                )}
              </div>
              {/* Center */}
              <div className="relative z-10 flex flex-col items-center">
                <h2 className="mb-3 max-w-lg text-center text-xl font-bold text-white sm:text-3xl md:text-4xl px-4">{lessonTitle}</h2>
                {moduleTitle && <p className="mb-8 text-sm text-white/50 sm:text-base">{moduleTitle}</p>}
                <button type="button" onClick={(e) => { e.stopPropagation(); play(); }}
                  className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue-600 text-white shadow-lg shadow-brand-blue-600/30 transition hover:scale-105 hover:bg-brand-blue-500 hover:shadow-xl sm:h-20 sm:w-20"
                  aria-label="Play video">
                  <Play className="ml-1 h-7 w-7 sm:h-8 sm:w-8" />
                </button>
                <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-white/40 sm:text-sm">
                  <Volume2 className="h-3.5 w-3.5" /> Make sure your volume is on
                </p>
              </div>
            </div>
          )}

          {/* End card */}
          {ended && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
              <div className="mb-4 text-5xl text-brand-green-400">&#10003;</div>
              <h2 className="mb-2 text-2xl font-bold text-white sm:text-3xl">Lesson Complete</h2>
              <p className="mb-6 text-sm text-white/50">{lessonTitle}</p>
              <button type="button" onClick={(e) => { e.stopPropagation(); restart(); }}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20">
                <RotateCcw className="h-4 w-4" /> Replay
              </button>
            </div>
          )}

          {/* Controls overlay */}
          {hasStarted && !ended && (
            <div
              className={`absolute bottom-0 left-0 right-0 bg-black/60 px-3 pb-2 pt-4 transition-opacity duration-300 sm:px-5 sm:pb-3 ${
                showControls ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2">{ProgressBar}</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 sm:gap-3">
                  <button type="button" onClick={ended ? restart : togglePlay} className="rounded-full p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white" aria-label={isPlaying ? "Pause" : "Play"}>
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
                  </button>
                  <button type="button" onClick={() => skip(-10)} className="hidden rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white sm:block" aria-label="Back 10 seconds">
                    <SkipBack className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => skip(10)} className="hidden rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white sm:block" aria-label="Forward 10 seconds">
                    <SkipForward className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={toggleMute} className="rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white" aria-label={muted ? "Unmute" : "Mute"}>
                    {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <span className="ml-1 text-xs tabular-nums text-white/50">
                    {fmt(currentTime)} / {duration > 0 ? fmt(duration) : "--:--"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {lessonNumber && totalLessons && (
                    <span className="mr-2 hidden text-xs text-white/40 sm:inline">Lesson {lessonNumber}/{totalLessons}</span>
                  )}
                  <button type="button" onClick={toggleFullscreen} className="rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white" aria-label="Fullscreen">
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
