'use client';

import { useRef, useEffect, useState } from 'react';

interface ProgramHeroBannerProps {
  videoSrc: string;
  voiceoverSrc?: string;
}

/**
 * Video hero banner. Video autoplays muted on load.
 * Voiceover plays automatically when the hero scrolls into view
 * after the page has finished loading. No mute/unmute button.
 */
export default function ProgramHeroBanner({ videoSrc, voiceoverSrc }: ProgramHeroBannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceoverRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasPlayedVoiceover = useRef(false);
  const [pageLoaded, setPageLoaded] = useState(false);

  // Wait for page to finish loading before enabling voiceover
  useEffect(() => {
    if (document.readyState === 'complete') {
      setPageLoaded(true);
    } else {
      const onLoad = () => setPageLoaded(true);
      window.addEventListener('load', onLoad);
      return () => window.removeEventListener('load', onLoad);
    }
  }, []);

  // Video: autoplay muted, pause when scrolled away
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (!video) return;

        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Voiceover: play once when hero scrolls into view after page load
  useEffect(() => {
    if (!pageLoaded || !voiceoverSrc) return;

    const container = containerRef.current;
    const vo = voiceoverRef.current;
    if (!container || !vo) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasPlayedVoiceover.current) {
          hasPlayedVoiceover.current = true;
          vo.play().catch(() => {
            // Browser blocked autoplay — no fallback button
          });
        }

        // Pause voiceover if user scrolls away
        if (!entry.isIntersecting && !vo.paused) {
          vo.pause();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [pageLoaded, voiceoverSrc]);

  return (
    <div ref={containerRef} className="relative w-full h-[50vh] min-h-[320px] max-h-[500px] overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        src={videoSrc}
        muted
        loop
        playsInline
        preload="metadata"
      />

      {voiceoverSrc && (
        <audio ref={voiceoverRef} src={voiceoverSrc} preload="auto" />
      )}
    </div>
  );
}
