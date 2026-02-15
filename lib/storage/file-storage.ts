import { logger } from '@/lib/logger';
/**
 * File Storage Service
 * 
 * Handles secure file storage and signed URL generation for digital downloads.
 * Supports Cloudflare R2 (S3-compatible) and AWS S3.
 */

import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Storage configuration
const STORAGE_CONFIG = {
  // Use R2 if configured, otherwise fall back to S3
  endpoint: process.env.R2_ENDPOINT || undefined,
  region: process.env.AWS_REGION || 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  bucket: process.env.R2_BUCKET || process.env.AWS_S3_BUCKET || 'elevate-media',
};

// Initialize S3 client (works with R2 and S3)
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    if (!STORAGE_CONFIG.credentials.accessKeyId || !STORAGE_CONFIG.credentials.secretAccessKey) {
      throw new Error('Storage credentials not configured. Set R2_ACCESS_KEY/R2_SECRET_KEY or AWS credentials.');
    }

    s3Client = new S3Client({
      endpoint: STORAGE_CONFIG.endpoint,
      region: STORAGE_CONFIG.region,
      credentials: STORAGE_CONFIG.credentials,
      forcePathStyle: !!STORAGE_CONFIG.endpoint, // Required for R2
    });
  }
  return s3Client;
}

/**
 * Check if storage is configured
 */
export function isStorageConfigured(): boolean {
  return !!(
    STORAGE_CONFIG.credentials.accessKeyId &&
    STORAGE_CONFIG.credentials.secretAccessKey &&
    STORAGE_CONFIG.bucket
  );
}

/**
 * Product file paths mapping
 * Maps product IDs to their file paths in storage
 */
export const PRODUCT_FILES: Record<string, { path: string; filename: string; contentType: string; publicPath: string }> = {
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

/**
 * Get public fallback URL for a product
 * Used when R2/S3 is not configured
 */
export function getPublicFallbackUrl(productId: string, baseUrl: string): string | null {
  const fileInfo = PRODUCT_FILES[productId];
  if (!fileInfo?.publicPath) return null;
  return `${baseUrl}${fileInfo.publicPath}`;
}

/**
 * Generate a signed download URL for a product
 * URL expires after the specified duration (default: 1 hour)
 */
export async function generateSignedDownloadUrl(
  productId: string,
  expiresInSeconds: number = 3600
): Promise<string | null> {
  const fileInfo = PRODUCT_FILES[productId];
  if (!fileInfo) {
    logger.error(`No file mapping for product: ${productId}`);
    return null;
  }

  if (!isStorageConfigured()) {
    logger.error('Storage not configured');
    return null;
  }

  try {
    const client = getS3Client();
    const command = new GetObjectCommand({
      Bucket: STORAGE_CONFIG.bucket,
      Key: fileInfo.path,
      ResponseContentDisposition: `attachment; filename="${fileInfo.filename}"`,
      ResponseContentType: fileInfo.contentType,
    });

    const signedUrl = await getSignedUrl(client, command, {
      expiresIn: expiresInSeconds,
    });

    return signedUrl;
  } catch (error) {
    logger.error('Error generating signed URL:', error);
    return null;
  }
}

/**
 * Upload a file to storage
 * Used for admin uploads of new product files
 */
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<boolean> {
  if (!isStorageConfigured()) {
    throw new Error('Storage not configured');
  }

  try {
    const client = getS3Client();
    const command = new PutObjectCommand({
      Bucket: STORAGE_CONFIG.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await client.send(command);
    return true;
  } catch (error) {
    logger.error('Error uploading file:', error);
    return false;
  }
}

/**
 * Get file info for a product
 */
export function getProductFileInfo(productId: string) {
  return PRODUCT_FILES[productId] || null;
}
