import { logger } from '@/lib/logger';
import {
  getSignedElevateMediaUrl,
  isElevateMediaStorageConfigured,
  uploadToElevateMedia,
} from '@/lib/storage/elevate-media-storage';

/**
 * File Storage Service
 *
 * Handles secure file storage and signed URL generation for digital downloads.
 * Uses the shared S3-compatible object-storage layer (Backblaze B2, Wasabi,
 * AWS S3, Supabase S3, Cloudflare R2, or a custom S3 endpoint).
 */

export function isStorageConfigured(): boolean {
  return isElevateMediaStorageConfigured();
}

export const PRODUCT_FILES: Record<
  string,
  { path: string; filename: string; contentType: string; publicPath: string }
> = {
  'capital-readiness-guide': {
    path: 'guides/capital-readiness-guide-v1.pdf',
    publicPath: '/downloads/guides/capital-readiness-guide-v1.pdf',
    filename: 'The-Elevate-Capital-Readiness-Guide.pdf',
    contentType: 'application/pdf',
  },
  'capital-readiness-workbook': {
    path: 'workbooks/capital-readiness-workbook-v1.pdf',
    publicPath: '/downloads/guides/capital-readiness-workbook-v1.pdf',
    filename: 'Capital-Readiness-Workbook.pdf',
    contentType: 'application/pdf',
  },
  'tax-toolkit': {
    path: 'guides/tax-business-toolkit-v1.pdf',
    publicPath: '/downloads/guides/tax-business-toolkit-v1.pdf',
    filename: 'Start-a-Tax-Business-Toolkit.pdf',
    contentType: 'application/pdf',
  },
  'grant-guide': {
    path: 'guides/grant-readiness-guide-v1.pdf',
    publicPath: '/downloads/guides/grant-readiness-guide-v1.pdf',
    filename: 'Grant-Readiness-Guide.pdf',
    contentType: 'application/pdf',
  },
};

export function getPublicFallbackUrl(productId: string, baseUrl: string): string | null {
  const fileInfo = PRODUCT_FILES[productId];
  if (!fileInfo?.publicPath) return null;
  return `${baseUrl}${fileInfo.publicPath}`;
}

export async function generateSignedDownloadUrl(
  productId: string,
  expiresInSeconds: number = 3600,
): Promise<string | null> {
  const fileInfo = PRODUCT_FILES[productId];
  if (!fileInfo) {
    logger.error(`No file mapping for product: ${productId}`);
    return null;
  }

  if (!isStorageConfigured()) {
    logger.error('Elevate Media Storage not configured');
    return null;
  }

  return getSignedElevateMediaUrl(fileInfo.path, expiresInSeconds, {
    contentDisposition: `attachment; filename="${fileInfo.filename}"`,
    contentType: fileInfo.contentType,
  });
}

export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<boolean> {
  if (!isStorageConfigured()) {
    throw new Error('Elevate Media Storage not configured');
  }

  const result = await uploadToElevateMedia(body, key, contentType);
  if (!result.success) {
    logger.error('Error uploading file:', result.error);
    return false;
  }
  return true;
}

export function getProductFileInfo(productId: string) {
  return PRODUCT_FILES[productId] || null;
}
