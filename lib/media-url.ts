/**
 * Media URL Helper
 *
 * Returns R2 CDN URLs when configured, falls back to local paths.
 * Use this for all video and large image references.
 */

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_URL || process.env.CLOUDFLARE_R2_PUBLIC_URL;

/**
 * Get the URL for a video file
 * Falls back to local /videos/ path if R2 not configured
 */
export function getVideoUrl(filename: string): string {
  // Remove leading slash if present
  const cleanName = filename.replace(/^\/?(videos\/)?/, '');

  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/videos/${cleanName}`;
  }

  return `/videos/${cleanName}`;
}

/**
 * Get the URL for an image file (only for large images migrated to R2)
 * Falls back to local /images/ path if R2 not configured
 */
export function getImageUrl(filename: string): string {
  const cleanName = filename.replace(/^\/?(images\/)?/, '');

  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/images/${cleanName}`;
  }

  return `/images/${cleanName}`;
}

/**
 * Check if R2 is configured
 */
export function isR2Enabled(): boolean {
  return !!R2_PUBLIC_URL;
}

/**
 * Get base R2 URL
 */
export function getR2BaseUrl(): string | null {
  return R2_PUBLIC_URL || null;
}
