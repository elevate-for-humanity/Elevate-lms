'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';

interface StoreProductVideoProps {
  /** Path to the video file, relative to /public */
  src: string;
  /** Poster image shown before play */
  poster: string;
  /** Alt text for the poster image */
  alt: string;
  /** Optional label shown in the play overlay */
  label?: string;
  className?: string;
}

/**
 * Inline video player for store product demo videos.
 * Click-to-play, mute toggle, fullscreen. No autoplay.
 */
export default function StoreProductVideo({
  src,
  poster,
  alt,
  label,
  className = '',
}: StoreProductVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  const start = () => {
    setStarted(true);
    // play() called in onCanPlay once video mounts
  };

  const togglePlay = () => {
    if (!started) { start(); return; }
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().then(() => setPlaying(true)).catch(() => {}); }
    else { v.pause(); setPlaying(false); }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const fullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    videoRef.current?.requestFullscreen?.();
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden shadow-xl border border-slate-200 aspect-video group cursor-pointer bg-slate-900 ${className}`}
      onClick={togglePlay}
    >
      {/* Poster — shown before play */}
      {!started && (
        <>
          <Image
            src={poster}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            quality={85}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 hover:bg-black/50 transition-colors">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform mb-3">
              <Play className="w-9 h-9 text-brand-red-600 ml-1" />
            </div>
            {label && (
              <p className="text-white font-semibold text-sm drop-shadow-lg px-4 text-center">
                {label}
              </p>
            )}
          </div>
        </>
      )}

      {/* Video */}
      {started && (
        <>
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-contain bg-black"
            playsInline
            muted
            onCanPlay={() => {
              videoRef.current?.play().then(() => setPlaying(true)).catch(() => {});
            }}
            onEnded={() => setPlaying(false)}
            onPause={() => setPlaying(false)}
            onPlay={() => setPlaying(true)}
          >
            <source src={src} type="video/mp4" />
          </video>

          {/* Controls bar */}
          <div className="absolute bottom-0 inset-x-0 p-3 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing
                ? <Pause className="w-4 h-4 text-white" />
                : <Play className="w-4 h-4 text-white" />
              }
            </button>
            <div className="flex gap-2">
              <button
                onClick={toggleMute}
                className="p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted
                  ? <VolumeX className="w-4 h-4 text-white" />
                  : <Volume2 className="w-4 h-4 text-white" />
                }
              </button>
              <button
                onClick={fullscreen}
                className="p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
                aria-label="Fullscreen"
              >
                <Maximize2 className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
