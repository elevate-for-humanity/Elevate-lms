import { logger } from '@/lib/logger';
/**
 * Cloudflare R2 Storage Client
 *
 * R2 is S3-compatible, so we use the AWS SDK.
 * Free egress makes it ideal for video/image CDN.
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function r2Config() {
  return {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID?.trim() ?? '',
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim() ?? '',
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim() ?? '',
    bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim() || 'elevate-media',
    publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL?.trim().replace(/\/$/, '') || '',
  };
}

// Check if R2 is configured
export const isR2Configured = () => {
  const config = r2Config();
  return Boolean(config.accountId && config.accessKeyId && config.secretAccessKey);
};

// Course media needs a stable browser-readable URL after upload. R2 API
// credentials alone only produce a private S3 endpoint, which returns HTTP 400
// when the media quality gate or learner player fetches it anonymously.
export const isR2PublicDeliveryConfigured = () => Boolean(r2Config().publicUrl);

// Create S3-compatible client for R2
const getR2Client = () => {
  if (!isR2Configured()) {
    throw new Error(
      'Cloudflare R2 is not configured. Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, and CLOUDFLARE_R2_SECRET_ACCESS_KEY',
    );
  }

  const config = r2Config();
  return new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
};

export interface UploadResult {
  success: boolean;
  key?: string;
  url?: string;
  error?: string;
}

/**
 * Upload a file to R2
 */
export async function uploadToR2(
  file: Buffer | Uint8Array,
  key: string,
  contentType: string,
): Promise<UploadResult> {
  try {
    const config = r2Config();
    const client = getR2Client();

    await client.send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000', // 1 year cache
      }),
    );

    const url = config.publicUrl
      ? `${config.publicUrl}/${key}`
      : `https://${config.bucketName}.${config.accountId}.r2.cloudflarestorage.com/${key}`;

    return { success: true, key, url };
  } catch (error) {
    logger.error('R2 upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Upload a file from URL to R2
 */
export async function uploadFromUrlToR2(sourceUrl: string, key: string): Promise<UploadResult> {
  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = Buffer.from(await response.arrayBuffer());

    return uploadToR2(buffer, key, contentType);
  } catch (error) {
    logger.error('R2 upload from URL error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Delete a file from R2
 */
export async function deleteFromR2(key: string): Promise<boolean> {
  try {
    const config = r2Config();
    const client = getR2Client();

    await client.send(
      new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      }),
    );

    return true;
  } catch (error) {
    logger.error('R2 delete error:', error);
    return false;
  }
}

/**
 * Get a signed URL for private file access
 */
export async function getSignedR2Url(key: string, expiresIn = 3600): Promise<string | null> {
  try {
    const config = r2Config();
    const client = getR2Client();

    const url = await getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      }),
      { expiresIn },
    );

    return url;
  } catch (error) {
    logger.error('R2 signed URL error:', error);
    return null;
  }
}

/**
 * List files in R2 bucket
 */
export async function listR2Files(prefix?: string): Promise<string[]> {
  try {
    const config = r2Config();
    const client = getR2Client();

    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: prefix,
      }),
    );

    return response.Contents?.map((obj) => obj.Key!).filter(Boolean) || [];
  } catch (error) {
    logger.error('R2 list error:', error);
    return [];
  }
}

/**
 * Get public URL for a file
 */
export function getR2PublicUrl(key: string): string {
  const config = r2Config();
  if (config.publicUrl) {
    return `${config.publicUrl}/${key}`;
  }
  return `https://${config.bucketName}.${config.accountId}.r2.cloudflarestorage.com/${key}`;
}

/**
 * Helper to determine content type from filename
 */
export function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const types: Record<string, string> = {
    // Video
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    avif: 'image/avif',
    svg: 'image/svg+xml',
    // Documents
    pdf: 'application/pdf',
    // Other
    json: 'application/json',
  };
  return types[ext || ''] || 'application/octet-stream';
}
