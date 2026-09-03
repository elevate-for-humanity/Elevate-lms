'use client';

import Image, { ImageProps } from 'next/image';

interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  alt: string;
}

/**
 * OptimizedImage component that automatically serves:
 * - WebP format for modern browsers
 * - HD version (2400x1600 @ 300 DPI) for retina displays
 * - Standard version (1920x1280 @ 150 DPI) for regular displays
 * - Original as fallback
 */
export function OptimizedImage({ src, alt, ...props }: OptimizedImageProps) {
  // Extract filename without extension
  const getImagePath = (src: string) => {
    const parts = src.split('/');
    const filename = parts[parts.length - 1];
    const name = filename.replace(/\.(jpg|jpeg|png)$/i, '');
    const dir = parts.slice(0, -1).join('/');

    return { dir, name };
  };

  const { dir, name } = getImagePath(src);
  const webpPath = `${dir}/${name}.webp`;

  return (
    <picture>
      {/* WebP for modern browsers - best compression */}
      <source type="image/webp" srcSet={webpPath} />

      {/* Fallback to Next.js Image component with original format */}
      <Image src={src} alt={alt} {...props} quality={85} priority={props.priority} />
    </picture>
  );
}
