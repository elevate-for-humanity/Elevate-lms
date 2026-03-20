'use client';

/**
 * LazyVideo — thin wrapper around CanonicalVideo for ambient/background use.
 * All invariants (muted, playsInline, preload="metadata", poster, visibility-gated)
 * are enforced by CanonicalVideo. Props that would violate those invariants
 * (autoPlay, muted, preload, playsInline) are intentionally not forwarded.
 *
 * For interactive video with controls, use components/video/VideoPlayer instead.
 */

import CanonicalVideo from '@/components/video/CanonicalVideo';

interface LazyVideoProps {
  src: string;
  poster?: string;
  className?: string;
  // Legacy props accepted but ignored — invariants are enforced by CanonicalVideo
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  controls?: boolean;
}

export default function LazyVideo({ src, poster = '/images/og-default.jpg', className = '' }: LazyVideoProps) {
  return (
    <CanonicalVideo
      src={src}
      poster={poster}
      className={className}
    />
  );
}
