'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Play, Pause, Volume2, VolumeX, RotateCcw,
  ChevronRight, ArrowLeft, Maximize2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DemoChoice {
  label: string;
  description?: string;
  nextScene: string;
  variant?: 'primary' | 'secondary';
}

export interface DemoScene {
  id: string;
  title: string;
  description: string;
  videoSrc: string;
  poster: string;
  choices: DemoChoice[];
  /** Optional CTA shown after all choices — e.g. "Start Trial" */
  exitCta?: { label: string; href: string };
}

interface InteractiveDemoPlayerProps {
  scenes: DemoScene[];
  startSceneId: string;
  portalLabel: string;
  trialHref?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function InteractiveDemoPlayer({
  scenes,
  startSceneId,
  portalLabel,
  trialHref = '/store/trial',
}: InteractiveDemoPlayerProps) {
  const sceneMap = Object.fromEntries(scenes.map(s => [s.id, s]));

  const [currentId, setCurrentId]   = useState(startSceneId);
  const [history, setHistory]       = useState<string[]>([]);
  const [playing, setPlaying]       = useState(false);
  const [muted, setMuted]           = useState(true);
  const [ended, setEnded]           = useState(false);
  const [loaded, setLoaded]         = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const scene = sceneMap[currentId];

  // Reset state when scene changes
  useEffect(() => {
    setPlaying(false);
    setEnded(false);
    setLoaded(false);
    setShowChoices(false);
    const v = videoRef.current;
    if (v) {
      v.load();
      v.play().then(() => setPlaying(true)).catch(() => {});
    }
  }, [currentId]);

  const goToScene = useCallback((id: string) => {
    setHistory(h => [...h, currentId]);
    setCurrentId(id);
  }, [currentId]);

  const goBack = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setCurrentId(prev);
  };

  const restart = () => {
    setHistory([]);
    setCurrentId(startSceneId);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().then(() => setPlaying(true)).catch(() => {}); }
    else { v.pause(); setPlaying(false); }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const fullscreen = () => videoRef.current?.requestFullscreen?.();

  if (!scene) return null;

  return (
    <div className="w-full max-w-4xl mx-auto">

      {/* Scene label + back */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          {history.length > 0 && (
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          )}
          {history.length > 0 && <span className="text-slate-300">·</span>}
          <span className="font-semibold text-slate-700">{portalLabel}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span>{scene.title}</span>
        </div>
        <button
          onClick={restart}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition"
        >
          <RotateCcw className="w-3 h-3" /> Restart
        </button>
      </div>

      {/* Video frame */}
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-2xl group">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          preload="auto"
          poster={scene.poster}
          onLoadedData={() => setLoaded(true)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); setEnded(true); setShowChoices(true); }}
        >
          <source src={scene.videoSrc} type="video/mp4" />
        </video>

        {/* Loading spinner */}
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-700 border-t-brand-red-500" />
          </div>
        )}

        {/* Click-to-play overlay (before video starts) */}
        {loaded && !playing && !ended && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
            onClick={togglePlay}
          >
            <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
              <Play className="w-9 h-9 text-brand-red-600 ml-1" />
            </div>
          </div>
        )}

        {/* Choice overlay — shown when video ends */}
        {showChoices && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 p-6">
            <p className="text-white font-bold text-lg mb-1 text-center">{scene.title}</p>
            <p className="text-slate-300 text-sm mb-6 text-center max-w-sm">{scene.description}</p>
            <div className="flex flex-wrap gap-3 justify-center w-full max-w-lg">
              {scene.choices.map((choice) => (
                <button
                  key={choice.nextScene}
                  onClick={() => goToScene(choice.nextScene)}
                  className={`flex flex-col items-start px-5 py-3 rounded-xl font-semibold text-sm transition min-w-[160px] max-w-[220px] text-left ${
                    choice.variant === 'secondary'
                      ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                      : 'bg-brand-red-600 hover:bg-brand-red-700 text-white'
                  }`}
                >
                  <span>{choice.label}</span>
                  {choice.description && (
                    <span className="text-xs opacity-75 font-normal mt-0.5">{choice.description}</span>
                  )}
                </button>
              ))}
            </div>
            {scene.exitCta && (
              <Link
                href={scene.exitCta.href}
                className="mt-5 text-xs text-slate-400 hover:text-white underline underline-offset-2 transition"
              >
                {scene.exitCta.label}
              </Link>
            )}
          </div>
        )}

        {/* Controls bar — visible on hover while playing */}
        {loaded && !showChoices && (
          <div className="absolute bottom-0 inset-x-0 p-3 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={togglePlay} className="p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition" aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
            </button>
            <div className="flex gap-2">
              <button onClick={toggleMute} className="p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition" aria-label={muted ? 'Unmute' : 'Mute'}>
                {muted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
              </button>
              <button onClick={fullscreen} className="p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition" aria-label="Fullscreen">
                <Maximize2 className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Below-video: scene description + skip choices */}
      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900 text-sm">{scene.title}</p>
          <p className="text-slate-500 text-xs mt-0.5">{scene.description}</p>
        </div>
        {/* Allow skipping ahead without watching */}
        {!showChoices && scene.choices.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {scene.choices.map(choice => (
              <button
                key={choice.nextScene}
                onClick={() => goToScene(choice.nextScene)}
                className="text-xs text-slate-500 hover:text-brand-red-600 border border-slate-200 hover:border-brand-red-300 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
              >
                {choice.label} <ChevronRight className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Progress dots */}
      {history.length > 0 && (
        <div className="flex items-center gap-1.5 mt-4">
          {[...history, currentId].map((id, i) => (
            <span
              key={`${id}-${i}`}
              className={`rounded-full transition-all ${
                i === history.length
                  ? 'w-4 h-2 bg-brand-red-600'
                  : 'w-2 h-2 bg-slate-300'
              }`}
            />
          ))}
        </div>
      )}

      {/* Trial CTA */}
      <div className="mt-6 bg-slate-900 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-white font-bold text-sm">Ready to run this for your organization?</p>
          <p className="text-slate-400 text-xs mt-0.5">14-day free trial. No credit card. Full platform access.</p>
        </div>
        <Link
          href={trialHref}
          className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition whitespace-nowrap"
        >
          Start Free Trial
        </Link>
      </div>
    </div>
  );
}
