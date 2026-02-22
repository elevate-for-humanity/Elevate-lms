'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface PageAvatarProps {
  videoSrc: string;
  title?: string;
  position?: 'default' | 'inline';
}

export default function PageAvatar({ videoSrc, title, position = 'default' }: PageAvatarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (!entry.isIntersecting || hasPlayed) return;
        const video = videoRef.current;
        if (!video) return;

        // Try unmuted first — works if user already clicked/scrolled on the page
        video.muted = false;
        video.play().catch(() => {
          // Browser blocked unmuted autoplay — fall back to muted, then
          // unmute on the next user interaction anywhere on the page
          video.muted = true;
          video.play().catch(() => {});
          const unmute = () => {
            if (videoRef.current) videoRef.current.muted = false;
            document.removeEventListener('click', unmute);
            document.removeEventListener('scroll', unmute);
            document.removeEventListener('touchstart', unmute);
          };
          document.addEventListener('click', unmute, { once: true });
          document.addEventListener('scroll', unmute, { once: true });
          document.addEventListener('touchstart', unmute, { once: true });
        });
        setHasPlayed(true);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Auto-play when visible, pause when not. Unmute on visibility since user scrolled.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isVisible) {
      video.play().then(() => {
        setIsPlaying(true);
        // Unmute automatically — the scroll that triggered visibility is a user gesture
        if (video.muted && !hasInteracted) {
          video.muted = false;
          setIsMuted(false);
          setHasInteracted(true);
        }
      }).catch(() => {});
    } else if (!video.paused) {
      video.pause();
      setIsPlaying(false);
    }
  }, [isVisible, hasInteracted]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const unmute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    setIsMuted(false);
    setHasInteracted(true);
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    setHasInteracted(true);
  }, []);

  if (position === 'inline') {
    return (
      <div ref={containerRef} className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-900">
        <video ref={videoRef} className="w-full h-full object-cover" src={videoSrc} playsInline preload="metadata" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full rounded-2xl overflow-hidden shadow-xl bg-slate-900 relative aspect-video">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src={videoSrc}
        playsInline
        preload="auto"
      />
      {title && (
        <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
          <span className="bg-black/70 text-white text-xs font-medium rounded px-2 py-1">{title}</span>
        </div>
      )}
    </div>
  );
}
