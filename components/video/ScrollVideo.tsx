'use client';

/**
 * ScrollVideo — plays when ≥30% visible, pauses when scrolled away.
 * Drop-in replacement for <video autoPlay> in hero banners.
 */

import { useEffect, useRef } from 'react';

interface ScrollVideoProps {
  src: string;
  poster?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Fraction of the element that must be visible before playing (default 0.3) */
  threshold?: number;
  loop?: boolean;
  muted?: boolean;
}

export function ScrollVideo({
  src,
  poster,
  className,
  style,
  threshold = 0.3,
  loop = true,
  muted = true,
}: ScrollVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {
            // Autoplay blocked — browser requires muted for autoplay
          });
        } else {
          el.pause();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      loop={loop}
      muted={muted}
      playsInline
      className={className}
      style={style}
    />
  );
}
