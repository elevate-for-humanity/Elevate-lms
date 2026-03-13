'use client';

/**
 * ScrollVideo — plays when ≥30% visible, pauses when scrolled away.
 * Attempts to unmute on play; shows "Tap to unmute" if browser blocks it.
 */

import { useHeroVideo } from '@/hooks/useHeroVideo';

interface ScrollVideoProps {
  src: string;
  poster?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Fraction of the element that must be visible before playing (default 0.3) */
  threshold?: number;
  loop?: boolean;
}

export function ScrollVideo({
  src,
  poster,
  className,
  style,
  threshold = 0.3,
  loop = true,
}: ScrollVideoProps) {
  const { videoRef } = useHeroVideo({ threshold });

  return (
    <div className="relative">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        loop={loop}
        muted
        playsInline
        className={className}
        style={style}
      />    </div>
  );
}
