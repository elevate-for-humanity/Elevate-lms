'use client';

/**
 * LazyImage — client-safe image component with one deliberate lazy boundary.
 *
 * The IntersectionObserver is the lazy boundary. Once the component is mounted,
 * the underlying Next Image loads eagerly so Chromium/Edge does not apply a
 * second deferred-load layer to the same resource.
 */

import Image, { ImageProps } from 'next/image';
import { useState, useEffect, useRef } from 'react';

const DEFAULT_FALLBACK = '/images/pages/prog-hero-main-2.webp';

interface LazyImageProps extends Omit<ImageProps, 'onLoad'> {
  fallback?: string;
}

export function LazyImage({
  src,
  alt,
  fallback = DEFAULT_FALLBACK,
  className = '',
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(Boolean(props.priority || props.loading === 'eager'));
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isInView || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '160px' },
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [isInView]);

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {!isLoaded && <div className="absolute inset-0 bg-slate-200 animate-pulse" aria-hidden="true" />}

      {isInView && (
        <Image
          src={error ? fallback : src}
          alt={alt}
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          {...props}
          loading="eager"
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}

// Preload only exact, non-Next-optimized image URLs and never duplicate a tag.
export function preloadImage(src: string) {
  if (typeof window === 'undefined' || !src) return;
  const escaped = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(src) : src.replace(/"/g, '\\"');
  if (document.head.querySelector(`link[rel="preload"][as="image"][href="${escaped}"]`)) return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  link.dataset.elevateImagePreload = 'true';
  document.head.appendChild(link);
}

export const imageLoader = ({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) => {
  if (src.startsWith('/')) {
    return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
  }
  return src;
};
