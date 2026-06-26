'use client';

import Image from 'next/image';
import { useState } from 'react';
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
 * OptimizedImage - wraps Next.js Image with automatic blur placeholder
 * Replaces need for individual blurDataURL on every image
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
  const [isLoading, setIsLoading] = useState(true);

  // Determine blur type based on path
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
      style={{
        ...style,
        transition: 'opacity 0.3s ease-in-out',
        opacity: isLoading ? 0 : 1,
      }}
      
      blurDataURL={blurDataURL}
      onLoad={() => setIsLoading(false)}
      {...props}
    />
  );
}
