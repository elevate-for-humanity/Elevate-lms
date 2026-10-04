/**
 * Legacy Cloudflare R2 compatibility facade.
 *
 * New code should import from '@/lib/storage/elevate-media-storage'. The underlying
 * implementation is Elevate-owned and supports Backblaze B2, Wasabi,
 * AWS S3, Supabase S3, Cloudflare R2, and custom S3-compatible endpoints.
 */

import {
  deleteFromElevateMedia,
  getContentType,
  getElevateMediaPublicUrl,
  getSignedElevateMediaUrl,
  isElevateMediaStorageConfigured,
  isElevateMediaPublicDeliveryConfigured,
  listElevateMediaKeys,
  uploadFromUrlToElevateMedia,
  uploadToElevateMedia,
  type ElevateMediaUploadResult,
} from '@/lib/storage/elevate-media-storage';

export type UploadResult = ElevateMediaUploadResult;

export const isR2Configured = isElevateMediaStorageConfigured;
export const isR2PublicDeliveryConfigured = isElevateMediaPublicDeliveryConfigured;

export const uploadToR2 = uploadToElevateMedia;
export const uploadFromUrlToR2 = uploadFromUrlToElevateMedia;
export const deleteFromR2 = deleteFromElevateMedia;
export const getSignedR2Url = getSignedElevateMediaUrl;
export const listR2Files = listElevateMediaKeys;

export function getR2PublicUrl(key: string): string {
  const url = getElevateMediaPublicUrl(key);
  if (!url) {
    throw new Error(
      'Elevate Media Storage public delivery is not configured. Set OBJECT_STORAGE_PUBLIC_URL.',
    );
  }
  return url;
}

export { getContentType };
