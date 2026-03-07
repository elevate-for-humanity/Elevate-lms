'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, RotateCcw, Zap, CheckCircle } from 'lucide-react';
import LessonPlayer from '@/components/lms/LessonPlayer';
import { HVAC_LESSON_UUID } from '@/lib/courses/hvac-uuids';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const STORAGE_AUDIO_BASE = SUPABASE_URL
  ? `${SUPABASE_URL}/storage/v1/object/public/lesson-audio/hvac`
  : '';

interface Props {
  lessonDefId: string;
  brollVideoUrl: string;
  lessonTitle: string;
  onProgress?: (percent: number) => void;
  onComplete?: () => void;
}

/* ── Animated waveform bars ─────────────────────────────────── */
function Waveform({ playing, color }: { playing: boolean; color: string }) {
  const heights = [35, 60, 45, 80, 55, 95, 65, 50, 85, 60, 40, 70, 55, 90, 50, 65, 40, 75, 60, 45];
  return (
    <div className="flex items-center gap-[2px] h-10" aria-hidden>
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full"
          style={{
            height: `${h}%`,
            backgroundColor: color,
            opacity: playing ? 0.9 : 0.25,
            animation: playing
              ? `hvac-bar ${0.5 + (i % 7) * 0.1}s ease-in-out ${(i % 4) * 0.08}s infinite alternate`
              : 'none',
            transition: 'opacity 0.4s',
          }}
        />
      ))}
      <style>{`
        @keyframes hvac-bar {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

/* ── Audio card ─────────────────────────────────────────────── */
function HvacAudioCard({
  audioUrl,
  lessonTitle,
  lessonDefId,
  onProgress,
  onComplete,
}: {
  audioUrl: string;
  lessonTitle: string;
  lessonDefId: string;
  onProgress?: (percent: number) => void;
  onComplete?: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ended, setEnded] = useState(false);

  // Pick accent color by module number so each module feels distinct
  const moduleNum = parseInt(lessonDefId.split('-')[1] ?? '1', 10);
  const ACCENTS = [
    { bg: '#2563eb', light: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' }, // blue
    { bg: '#dc2626', light: '#fef2f2', border: '#fecaca', text: '#b91c1c' }, // red
    { bg: '#f97316', light: '#fff7ed', border: '#fed7aa', text: '#c2410c' }, // orange
    { bg: '#16a34a', light: '#f0fdf4', border: '#bbf7d0', text: '#15803d' }, // green
    { bg: '#7c3aed', light: '#f5f3ff', border: '#ddd6fe', text: '#6d28d9' }, // purple
    { bg: '#0891b2', light: '#ecfeff', border: '#a5f3fc', text: '#0e7490' }, // cyan
  ];
  const accent = ACCENTS[(moduleNum - 1) % ACCENTS.length];

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  }
  function togglePlay() {
    const a = audioRef.current;
    if (!a) return;
    isPlaying ? a.pause() : a.play();
  }
  function skip(secs: number) {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(a.duration || 0, a.currentTime + secs));
  }
  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const a = audioRef.current;
    if (!a?.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * a.duration;
  }
  function restart() {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = 0;
    a.play();
    setEnded(false);
  }

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const handlers: [string, () => void][] = [
      ['play',           () => setIsPlaying(true)],
      ['pause',          () => setIsPlaying(false)],
      ['loadedmetadata', () => setDuration(a.duration)],
      ['timeupdate',     () => {
        setCurrentTime(a.currentTime);
        if (a.duration > 0) onProgress?.(Math.round((a.currentTime / a.duration) * 100));
      }],
      ['ended', () => { setIsPlaying(false); setEnded(true); onComplete?.(); }],
    ];
    handlers.forEach(([ev, fn]) => a.addEventListener(ev, fn));
    return () => handlers.forEach(([ev, fn]) => a.removeEventListener(ev, fn));
  }, [onProgress, onComplete]);

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="w-full rounded-2xl overflow-hidden shadow-lg border-2"
      style={{ borderColor: accent.border, backgroundColor: accent.light }}
    >
      {/* Top accent bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: accent.bg }} />

      <div className="p-5 sm:p-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex-1 min-w-0">
            {/* Module badge */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full text-white"
                style={{ backgroundColor: accent.bg }}
              >
                <Zap className="w-3 h-3" />
                HVAC · Module {moduleNum}
              </span>
              {duration > 0 && (
                <span className="text-xs font-medium text-slate-500">
                  {Math.ceil(duration / 60)} min
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
              {lessonTitle}
            </h3>
          </div>

          {/* Waveform */}
          <div className="flex-shrink-0 pt-1">
            <Waveform playing={isPlaying} color={accent.bg} />
          </div>
        </div>

        {/* Big play button + skip controls */}
        <div className="flex items-center gap-3 mb-5">
          <button
            type="button"
            onClick={() => skip(-10)}
            className="rounded-full p-2.5 hover:bg-white/80 transition text-slate-500 hover:text-slate-800"
            aria-label="Back 10 seconds"
          >
            <SkipBack className="h-5 w-5" />
          </button>

          {/* Main play button */}
          <button
            type="button"
            onClick={ended ? restart : togglePlay}
            className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg hover:scale-105 active:scale-95 transition-transform"
            style={{ backgroundColor: accent.bg }}
            aria-label={ended ? 'Replay' : isPlaying ? 'Pause' : 'Play'}
          >
            {ended
              ? <RotateCcw className="h-6 w-6" />
              : isPlaying
                ? <Pause className="h-6 w-6" />
                : <Play className="ml-0.5 h-6 w-6" />}
          </button>

          <button
            type="button"
            onClick={() => skip(10)}
            className="rounded-full p-2.5 hover:bg-white/80 transition text-slate-500 hover:text-slate-800"
            aria-label="Forward 10 seconds"
          >
            <SkipForward className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              const a = audioRef.current;
              if (!a) return;
              a.muted = !a.muted;
              setMuted(!muted);
            }}
            className="ml-auto rounded-full p-2.5 hover:bg-white/80 transition text-slate-500 hover:text-slate-800"
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>

        {/* Progress bar */}
        <div
          className="h-2.5 w-full cursor-pointer rounded-full bg-white shadow-inner"
          onClick={seek}
          role="slider"
          aria-label="Seek"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: accent.bg }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs tabular-nums font-medium" style={{ color: accent.text }}>{fmt(currentTime)}</span>
          <span className="text-xs tabular-nums text-slate-400">{duration > 0 ? fmt(duration) : '--:--'}</span>
        </div>

        {/* Completion banner */}
        {ended && (
          <div
            className="mt-4 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-bold"
            style={{ backgroundColor: accent.bg + '18', color: accent.text, border: `1.5px solid ${accent.border}` }}
          >
            <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: accent.bg }} />
            Lesson complete — great work!
          </div>
        )}
      </div>

      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" className="hidden">
        <source src={audioUrl} type="audio/mpeg" />
      </audio>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export default function HvacLessonVideo({
  lessonDefId,
  brollVideoUrl,
  lessonTitle,
  onProgress,
  onComplete,
}: Props) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  useEffect(() => {
    const uuid = HVAC_LESSON_UUID[lessonDefId];
    if (!uuid) { setMediaUrl(brollVideoUrl); return; }

    const videoPath    = `/generated/videos/lesson-${uuid}.mp4`;
    const storageAudio = STORAGE_AUDIO_BASE ? `${STORAGE_AUDIO_BASE}/lesson-${uuid}.mp3` : '';
    const localAudio   = `/generated/lessons/lesson-${uuid}.mp3`;

    async function resolve() {
      try {
        const r = await fetch(videoPath, { method: 'HEAD' });
        if (r.ok) { setMediaUrl(videoPath); return; }
      } catch { /* skip */ }

      if (storageAudio) {
        try {
          const r = await fetch(storageAudio, { method: 'HEAD' });
          if (r.ok) { setMediaUrl(storageAudio); return; }
        } catch { /* skip */ }
      }

      try {
        const r = await fetch(localAudio, { method: 'HEAD' });
        if (r.ok) { setMediaUrl(localAudio); return; }
      } catch { /* skip */ }

      setMediaUrl(brollVideoUrl);
    }

    resolve();
  }, [lessonDefId, brollVideoUrl]);

  if (!mediaUrl) return null;

  if (mediaUrl.endsWith('.mp3')) {
    return (
      <HvacAudioCard
        audioUrl={mediaUrl}
        lessonTitle={lessonTitle}
        lessonDefId={lessonDefId}
        onProgress={onProgress}
        onComplete={onComplete}
      />
    );
  }

  return (
    <LessonPlayer
      videoUrl={mediaUrl}
      lessonTitle={lessonTitle}
      onProgress={onProgress}
      onComplete={onComplete}
    />
  );
}
