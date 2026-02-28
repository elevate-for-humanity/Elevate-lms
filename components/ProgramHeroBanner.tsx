'use client';

import { useRef, useEffect } from 'react';

interface ProgramHeroBannerProps {
  videoSrc: string;
  voiceoverSrc?: string;
}

export default function ProgramHeroBanner({ videoSrc, voiceoverSrc }: ProgramHeroBannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceoverRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasPlayedVoiceover = useRef(false);

  // Play video + voiceover on scroll into view, pause when scrolled away.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        const vo = voiceoverRef.current;
        if (!video) return;

        if (entry.isIntersecting) {
          video.play().catch(() => {});
          if (vo && !hasPlayedVoiceover.current) {
            hasPlayedVoiceover.current = true;
            vo.play().catch(() => {});
          }
        } else {
          video.pause();
          if (vo && !vo.paused) {
            vo.pause();
          }
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[50vh] min-h-[320px] max-h-[500px] overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        src={videoSrc}
        muted
        playsInline
        preload="metadata"
      />

      {voiceoverSrc && (
        <audio ref={voiceoverRef} src={voiceoverSrc} preload="none" />
      )}
    </div>
  );
}
