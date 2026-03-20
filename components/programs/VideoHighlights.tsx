"use client";

import React from 'react';

import { useRef, useState } from "react";

type VideoHighlight = {
  id: string;
  title: string;
  description?: string;
  videoSrc?: string;
  poster?: string;
};

export default function VideoHighlights({
  items,
}: {
  items: VideoHighlight[];
}) {
  if (!items?.length) return null;

  return (
    <section className="mt-12">
      <h2 className="text-xl sm:text-2xl font-black text-zinc-900">
        Program highlights
      </h2>

      <div className="mt-6 grid md:grid-cols-2 gap-6">
        {items.map((v) => (
          <VideoCard key={v.id} {...v} />
        ))}
      </div>
    </section>
  );
}

function VideoCard({
  title,
  description,
  videoSrc,
  poster,
}: VideoHighlight) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  const play = async () => {
    if (!videoRef.current || !videoSrc) return;
    videoRef.current.muted = false;
    await videoRef.current.play().catch(() => {});
    setStarted(true);
  };

  const hasVideo = Boolean(videoSrc);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="relative w-full h-[220px] rounded-xl overflow-hidden border border-zinc-200 bg-zinc-900">
        {hasVideo ? (
          <>
            <video
              ref={videoRef}
              src={videoSrc}
              poster={poster}
              muted
              playsInline
              preload="none"
              controls={started}
              className="w-full h-full object-cover"
            />
            {!started && (
              <button
                onClick={play}
                className="absolute inset-0 m-auto h-12 w-48 rounded-full bg-white/95 font-extrabold border border-zinc-300 hover:bg-white transition z-10"
              >
                ▶ Play with Sound
              </button>
            )}
          </>
        ) : poster ? (
          // No video — show poster image only, no text on frame
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt={title} className="w-full h-full object-cover" />
        ) : (
          // No video, no poster — neutral placeholder
          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
            <span className="text-slate-400 text-sm">No preview available</span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="font-black text-zinc-900">{title}</div>
        {description && (
          <p className="mt-2 text-sm text-zinc-700">{description}</p>
        )}
      </div>
    </div>
  );
}
