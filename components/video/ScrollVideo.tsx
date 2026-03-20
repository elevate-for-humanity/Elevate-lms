'use client';

/**
 * ScrollVideo — ambient video that plays when visible, pauses when scrolled away.
 * Thin wrapper around CanonicalVideo with a configurable visibility threshold.
 */

import CanonicalVideo from './CanonicalVideo';

interface ScrollVideoProps {
  src: string;
  poster?: string;
  className?: string;
  style?: React.CSSProperties;
  threshold?: number;
  loop?: boolean;
}

export function ScrollVideo({
  src,
  poster = '/images/og-default.jpg',
  className,
  threshold = 0.3,
}: ScrollVideoProps) {
  return (
    <div className="relative">
      <CanonicalVideo
        src={src}
        poster={poster}
        className={className}
        threshold={threshold}
      />
    </div>
  );
}
