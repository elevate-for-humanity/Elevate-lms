/**
 * Media Optimization Utilities
 * 
 * Image optimization has been moved to Netlify function: /.netlify/functions/image-optimize
 * This file provides URL helpers and client-side utilities that don't require Sharp.
 */

// =====================================================
// IMAGE URL UTILITIES
// =====================================================

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

/**
 * Get optimized image URL from Supabase Storage
 */
export function getOptimizedImageUrl(
  path: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
  } = {}
): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const bucket = 'images';

  const params = new URLSearchParams();
  if (options.width) params.append('width', options.width.toString());
  if (options.height) params.append('height', options.height.toString());
  if (options.quality) params.append('quality', options.quality.toString());

  const queryString = params.toString();
  const url = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;

  return queryString ? `${url}?${queryString}` : url;
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(
  path: string,
  widths: number[] = [320, 640, 768, 1024, 1280, 1920]
): string {
  return widths
    .map((width) => `${getOptimizedImageUrl(path, { width })} ${width}w`)
    .join(', ');
}

// =====================================================
// VIDEO UTILITIES
// =====================================================

export interface VideoOptimizationOptions {
  resolution?: '360p' | '480p' | '720p' | '1080p';
  bitrate?: string;
  codec?: 'h264' | 'h265' | 'vp9';
  format?: 'mp4' | 'webm';
}

/**
 * Get video optimization settings
 */
export function getVideoOptimizationSettings(
  resolution: '360p' | '480p' | '720p' | '1080p' = '720p'
): {
  width: number;
  height: number;
  bitrate: string;
} {
  const settings = {
    '360p': { width: 640, height: 360, bitrate: '800k' },
    '480p': { width: 854, height: 480, bitrate: '1200k' },
    '720p': { width: 1280, height: 720, bitrate: '2500k' },
    '1080p': { width: 1920, height: 1080, bitrate: '5000k' },
  };

  return settings[resolution];
}

/**
 * Get adaptive streaming manifest URL
 */
export function getAdaptiveStreamingUrl(videoId: string): {
  hls: string;
  dash: string;
} {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return {
    hls: `${supabaseUrl}/storage/v1/object/public/videos/${videoId}/master.m3u8`,
    dash: `${supabaseUrl}/storage/v1/object/public/videos/${videoId}/manifest.mpd`,
  };
}

// =====================================================
// CDN INTEGRATION
// =====================================================

/**
 * Get CDN URL for asset
 */
export function getCDNUrl(path: string, type: 'image' | 'video' = 'image'): string {
  const cdnDomain = process.env.NEXT_PUBLIC_CDN_DOMAIN;

  if (!cdnDomain) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const bucket = type === 'image' ? 'images' : 'videos';
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  }

  return `${cdnDomain}/${type}s/${path}`;
}

// =====================================================
// NEXT.JS IMAGE LOADER
// =====================================================

/**
 * Custom image loader for Next.js Image component
 */
export function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (src.startsWith('http')) {
    return src;
  }

  return getOptimizedImageUrl(src, { width, quality: quality || 75 });
}

// =====================================================
// PRELOAD HINTS
// =====================================================

/**
 * Generate preload link tags for critical images
 */
export function generatePreloadLinks(images: Array<{ src: string; type?: string }>): string {
  return images
    .map(
      (img) =>
        `<link rel="preload" as="image" href="${img.src}" ${
          img.type ? `type="${img.type}"` : ''
        }>`
    )
    .join('\n');
}

/**
 * Generate prefetch link tags for images
 */
export function generatePrefetchLinks(images: string[]): string {
  return images
    .map((src) => `<link rel="prefetch" as="image" href="${src}">`)
    .join('\n');
}

// =====================================================
// SERVER-SIDE IMAGE OPTIMIZATION
// =====================================================
// These functions require Sharp and have been moved to Netlify function.
// Call /.netlify/functions/image-optimize instead.

/**
 * Optimize image using Netlify function
 * @deprecated Use fetch('/.netlify/functions/image-optimize') directly
 */
export async function optimizeImage(
  buffer: Buffer,
  options: ImageOptimizationOptions = {}
): Promise<Buffer> {
  const base64 = buffer.toString('base64');
  
  const response = await fetch(`${process.env.URL || ''}/.netlify/functions/image-optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64, options }),
  });

  if (!response.ok) {
    throw new Error('Image optimization failed');
  }

  const optimizedBase64 = await response.text();
  return Buffer.from(optimizedBase64, 'base64');
}
