'use client';

import Image from 'next/image';
import { BLUR_PLACEHOLDERS } from '@/lib/images/blur-placeholder';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

/**
 * OptimizedImage - canonical Next.js image wrapper with a real blur placeholder.
 *
 * Do not hide the image with opacity while it loads. Next owns the transition
 * from the blur placeholder to the decoded image, which avoids blank frames in
 * Chromium/Edge and prevents a second client-side loading state.
 */
export function OptimizedImage({
  src,
  alt,
  className,
  fill,
  priority,
  sizes,
  width,
  height,
  style,
  ...props
}: OptimizedImageProps) {
  const getBlurType = () => {
    if (src.includes('partner') || src.includes('logo')) return 'partner';
    if (src.includes('hero') || src.includes('Hero')) return 'hero';
    if (src.includes('course') || src.includes('Course')) return 'course';
    return 'default';
  };

  const blurType = getBlurType();
  const blurDataURL = BLUR_PLACEHOLDERS[blurType] || BLUR_PLACEHOLDERS.default;

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      fill={fill}
      priority={priority}
      sizes={sizes}
      width={width}
      height={height}
      style={style}
      placeholder="blur"
      blurDataURL={blurDataURL}
      {...props}
    />
  );
}
