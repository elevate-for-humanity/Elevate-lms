'use client';

import { useEffect, useState } from 'react';
import type { ImgHTMLAttributes } from 'react';

export const ADMIN_LOGO_FALLBACK = '/images/logo.png';

type ProfileImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
  fallbackSrc?: string;
};

/**
 * Resilient image renderer for every role dashboard.
 * Broken, expired, or browser-incompatible profile URLs fall back to the
 * canonical Elevate Admin logo instead of leaving an empty image frame.
 */
export function ProfileImage({
  src,
  fallbackSrc = ADMIN_LOGO_FALLBACK,
  alt = '',
  onError,
  ...props
}: ProfileImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState(src || fallbackSrc);

  useEffect(() => {
    setResolvedSrc(src || fallbackSrc);
  }, [fallbackSrc, src]);

  return (
    <img
      {...props}
      src={resolvedSrc}
      alt={alt}
      onError={(event) => {
        onError?.(event);
        if (resolvedSrc !== fallbackSrc) setResolvedSrc(fallbackSrc);
      }}
    />
  );
}
