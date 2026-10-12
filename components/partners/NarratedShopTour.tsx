'use client';

import { useRef } from 'react';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';

/** The tour and its shop-specific script share one play/pause control. */
export default function NarratedShopTour({ src, script, shopName, onPlaybackChange, showScript = true }: {
  src: string;
  script: string;
  shopName: string;
  showScript?: boolean;
  onPlaybackChange?: (playing: boolean) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { play, pause, resume, stop, isPaused, isLoading, isPlaying, error } = useNaturalVoice();

  return <div className={`${showScript ? '' : 'h-full'} w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-950`}>
    <div className="flex aspect-[4/3] items-center justify-center">
      <video ref={videoRef} src={src} controls muted playsInline preload="metadata" loop={isPlaying || isLoading}
        data-narrated-tour aria-label={`${shopName} narrated tour`}
        className="h-full w-full object-contain"
        onPlay={() => {
          onPlaybackChange?.(true);
          if (isPaused) { void resume(); return; }
          void play(script, { style: 'instructor', rate: 1, onEnded: () => videoRef.current?.pause() }).then((started) => {
            if (started && videoRef.current?.paused) pause();
          });
        }}
        onPause={() => {
          onPlaybackChange?.(false);
          if (isLoading) stop(); else pause();
        }}
        onEnded={() => { stop(); onPlaybackChange?.(false); }}
        onVolumeChange={(event) => {
          // The written tour is the voice track; avoid mixing source-video sound.
          event.currentTarget.muted = true;
        }} />
    </div>
    {showScript ? <div className="bg-white p-4">
      <p role="status" className="text-sm font-semibold text-slate-700">{isLoading ? "Preparing tour narration…" : isPlaying ? `Narrating ${shopName}. The video repeats until the script finishes.` : isPaused ? "Tour narration paused. Play the video to continue." : `Play the tour to hear about ${shopName}.`}</p>
      {error ? <p role="status" className="mt-2 text-sm text-red-700">Tour audio is unavailable. You can read the full script below.</p> : null}
      <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3" open>
        <summary className="cursor-pointer font-bold text-blue-900">{shopName} tour script</summary>
        <p className="mt-3 text-sm leading-6 text-slate-700">{script}</p>
      </details>
    </div> : null}
  </div>;
}
