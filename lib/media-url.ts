/**
 * Media URL Helper
 *
 * Returns the configured public object-storage URL when available, with legacy
 * R2 variables retained as fallbacks.
 */

const OBJECT_STORAGE_PUBLIC_URL = (
  process.env.NEXT_PUBLIC_OBJECT_STORAGE_URL ||
  process.env.NEXT_PUBLIC_R2_URL ||
  process.env.CLOUDFLARE_R2_PUBLIC_URL ||
  ''
).replace(/\/$/, '');

export function getVideoUrl(filename: string): string {
  const cleanName = filename.replace(/^\/?(videos\/)?/, '');
  if (OBJECT_STORAGE_PUBLIC_URL) {
    return `${OBJECT_STORAGE_PUBLIC_URL}/videos/${cleanName}`;
  }
  return `/videos/${cleanName}`;
}

export function getImageUrl(filename: string): string {
  const cleanName = filename.replace(/^\/?(images\/)?/, '');
  if (OBJECT_STORAGE_PUBLIC_URL) {
    return `${OBJECT_STORAGE_PUBLIC_URL}/images/${cleanName}`;
  }
  return `/images/${cleanName}`;
}

export function isObjectStorageEnabled(): boolean {
  return Boolean(OBJECT_STORAGE_PUBLIC_URL);
}

export function getObjectStorageBaseUrl(): string | null {
  return OBJECT_STORAGE_PUBLIC_URL || null;
}

/** @deprecated Use isObjectStorageEnabled. */
export const isR2Enabled = isObjectStorageEnabled;

/** @deprecated Use getObjectStorageBaseUrl. */
export const getR2BaseUrl = getObjectStorageBaseUrl;
