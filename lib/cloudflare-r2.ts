/**
 * Legacy Cloudflare R2 compatibility facade.
 *
 * New code should import from '@/lib/storage/object-storage'. The underlying
 * implementation is provider-neutral and supports Backblaze B2, Wasabi,
 * AWS S3, Supabase S3, Cloudflare R2, and custom S3-compatible endpoints.
 */

import {
  deleteFromObjectStorage,
  getContentType,
  getObjectStoragePublicUrl,
  getSignedObjectUrl,
  isObjectStorageConfigured,
  isObjectStoragePublicDeliveryConfigured,
  listObjectStorageKeys,
  uploadFromUrlToObjectStorage,
  uploadToObjectStorage,
  type ObjectUploadResult,
} from '@/lib/storage/object-storage';

export type UploadResult = ObjectUploadResult;

export const isR2Configured = isObjectStorageConfigured;
export const isR2PublicDeliveryConfigured = isObjectStoragePublicDeliveryConfigured;

export const uploadToR2 = uploadToObjectStorage;
export const uploadFromUrlToR2 = uploadFromUrlToObjectStorage;
export const deleteFromR2 = deleteFromObjectStorage;
export const getSignedR2Url = getSignedObjectUrl;
export const listR2Files = listObjectStorageKeys;

export function getR2PublicUrl(key: string): string {
  const url = getObjectStoragePublicUrl(key);
  if (!url) {
    throw new Error(
      'Object storage public delivery is not configured. Set OBJECT_STORAGE_PUBLIC_URL.',
    );
  }
  return url;
}

export { getContentType };
