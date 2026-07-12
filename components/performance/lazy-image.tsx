'use client';

/**
 * LazyImage — client-safe lazy loading image component.
 * 
 * NOTE: This component does NOT call resolveSiteImagePath() because it uses 'fs'
 * which is server-only. Pass pre-resolved paths from Server Components when possible.
 * For direct usage, provide full URLs (not local paths that need resolution).
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
  // Client-safe: just use the src directly
  // If you need server-side path resolution, resolve in the parent Server Component
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' },
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder/skeleton while loading */}
      {!isLoaded && <div className="absolute inset-0 bg-slate-200 animate-pulse" />}

      {isInView && (
        <Image
          src={error ? fallback : src}
          alt={alt}
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          {...props}
        />
      )}
    </div>
  );
}

// Preload critical images
export function preloadImage(src: string) {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  }
}

// Image optimization utilities
export const imageLoader = ({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) => {
  // Use Next.js image optimization
  if (src.startsWith('/')) {
    return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
  }
  return src;
};
