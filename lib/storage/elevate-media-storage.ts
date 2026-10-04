/**
 * Elevate Media Storage
 *
 * Elevate-owned storage boundary for Course Builder media.
 * Backblaze B2 is the production primary. Supabase remains the metadata/control
 * plane and the safe media fallback. Alternate S3-compatible providers are
 * migration/failover targets, not the architectural identity of this module.
 */

import { logger } from '@/lib/logger';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export type ElevateMediaProvider =
  | 'backblaze-b2'
  | 'wasabi'
  | 'aws-s3'
  | 'supabase-s3'
  | 'cloudflare-r2'
  | 'custom-s3';

export interface ElevateMediaStorageConfig {
  provider: ElevateMediaProvider;
  endpoint?: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
  forcePathStyle: boolean;
}

export interface ElevateMediaUploadResult {
  success: boolean;
  key?: string;
  url?: string;
  error?: string;
}

function clean(value?: string): string {
  return value?.trim() ?? '';
}

function bool(value?: string): boolean | undefined {
  const normalized = clean(value).toLowerCase();
  if (!normalized) return undefined;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return undefined;
}

function inferProvider(endpoint: string): ElevateMediaProvider {
  const explicit = clean(process.env.ELEVATE_MEDIA_PROVIDER).toLowerCase();
  if (explicit === 'b2' || explicit === 'backblaze' || explicit === 'backblaze-b2') {
    return 'backblaze-b2';
  }
  if (explicit === 'wasabi') return 'wasabi';
  if (explicit === 'aws' || explicit === 's3' || explicit === 'aws-s3') return 'aws-s3';
  if (explicit === 'supabase' || explicit === 'supabase-s3') return 'supabase-s3';
  if (explicit === 'r2' || explicit === 'cloudflare' || explicit === 'cloudflare-r2') {
    return 'cloudflare-r2';
  }
  if (explicit === 'custom' || explicit === 'custom-s3') return 'custom-s3';

  const host = endpoint.toLowerCase();
  if (host.includes('backblazeb2.com')) return 'backblaze-b2';
  if (host.includes('wasabisys.com')) return 'wasabi';
  if (host.includes('storage.supabase.co')) return 'supabase-s3';
  if (host.includes('r2.cloudflarestorage.com')) return 'cloudflare-r2';
  if (host.includes('amazonaws.com')) return 'aws-s3';
  return endpoint ? 'custom-s3' : 'aws-s3';
}

function deriveLegacyR2Endpoint(): string {
  const accountId = clean(process.env.CLOUDFLARE_ACCOUNT_ID);
  return accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '';
}

function regionFromEndpoint(endpoint: string, provider: ElevateMediaProvider): string {
  try {
    const host = new URL(endpoint).hostname;
    if (provider === 'backblaze-b2') {
      const match = host.match(/^s3\.([^.]+)\.backblazeb2\.com$/i);
      if (match?.[1]) return match[1];
    }
    if (provider === 'wasabi') {
      const match = host.match(/^s3\.([^.]+)\.wasabisys\.com$/i);
      if (match?.[1]) return match[1];
    }
  } catch {
    // Validation below will report malformed endpoints when the client is used.
  }
  return provider === 'cloudflare-r2' ? 'auto' : 'us-east-1';
}

export function getElevateMediaStorageConfig(): ElevateMediaStorageConfig {
  const endpoint = clean(
    process.env.ELEVATE_MEDIA_ENDPOINT ||
      process.env.S3_ENDPOINT ||
      process.env.R2_ENDPOINT ||
      process.env.CLOUDFLARE_R2_ENDPOINT ||
      deriveLegacyR2Endpoint(),
  ).replace(/\/$/, '');

  const provider = inferProvider(endpoint);
  const region =
    clean(
      process.env.ELEVATE_MEDIA_REGION ||
        process.env.S3_REGION ||
        process.env.R2_REGION ||
        process.env.AWS_REGION,
    ) || regionFromEndpoint(endpoint, provider);

  const accessKeyId = clean(
    process.env.ELEVATE_MEDIA_ACCESS_KEY_ID ||
      process.env.S3_ACCESS_KEY_ID ||
      process.env.R2_ACCESS_KEY ||
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
      process.env.AWS_ACCESS_KEY_ID,
  );
  const secretAccessKey = clean(
    process.env.ELEVATE_MEDIA_SECRET_ACCESS_KEY ||
      process.env.S3_SECRET_ACCESS_KEY ||
      process.env.R2_SECRET_KEY ||
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
      process.env.AWS_SECRET_ACCESS_KEY,
  );
  const bucket = clean(
    process.env.ELEVATE_MEDIA_BUCKET ||
      process.env.S3_BUCKET ||
      process.env.R2_BUCKET ||
      process.env.CLOUDFLARE_R2_BUCKET_NAME ||
      process.env.CLOUDFLARE_R2_BUCKET ||
      process.env.AWS_S3_BUCKET,
  );
  const publicUrl = clean(
    process.env.ELEVATE_MEDIA_PUBLIC_URL ||
      process.env.NEXT_PUBLIC_ELEVATE_MEDIA_URL ||
      process.env.S3_PUBLIC_URL ||
      process.env.CLOUDFLARE_R2_PUBLIC_URL ||
      process.env.NEXT_PUBLIC_R2_URL,
  ).replace(/\/$/, '');

  const configuredForcePathStyle = bool(
    process.env.ELEVATE_MEDIA_FORCE_PATH_STYLE || process.env.S3_FORCE_PATH_STYLE,
  );
  const forcePathStyle =
    configuredForcePathStyle ?? (provider === 'supabase-s3');

  return {
    provider,
    endpoint: endpoint || undefined,
    region,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicUrl,
    forcePathStyle,
  };
}

export function isElevateMediaStorageConfigured(): boolean {
  const config = getElevateMediaStorageConfig();
  const endpointReady = Boolean(config.endpoint) || config.provider === 'aws-s3';
  return Boolean(
    endpointReady &&
      config.accessKeyId &&
      config.secretAccessKey &&
      config.bucket,
  );
}

export function isElevateMediaPublicDeliveryConfigured(): boolean {
  return Boolean(getElevateMediaStorageConfig().publicUrl);
}

let cachedClient: S3Client | null = null;
let cachedFingerprint = '';

export function getElevateMediaStorageClient(): S3Client {
  const config = getElevateMediaStorageConfig();
  if (!isElevateMediaStorageConfigured()) {
    throw new Error(
      'Elevate Media Storage is not configured. Set ELEVATE_MEDIA_ENDPOINT, ELEVATE_MEDIA_ACCESS_KEY_ID, ELEVATE_MEDIA_SECRET_ACCESS_KEY, and ELEVATE_MEDIA_BUCKET (or compatible S3/R2/AWS fallback variables).',
    );
  }

  const fingerprint = JSON.stringify({
    provider: config.provider,
    endpoint: config.endpoint,
    region: config.region,
    accessKeyId: config.accessKeyId,
    forcePathStyle: config.forcePathStyle,
  });

  if (!cachedClient || cachedFingerprint !== fingerprint) {
    cachedClient = new S3Client({
      ...(config.endpoint ? { endpoint: config.endpoint } : {}),
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle,
    });
    cachedFingerprint = fingerprint;
  }

  return cachedClient;
}

export function getElevateMediaPublicUrl(key: string): string | null {
  const base = getElevateMediaStorageConfig().publicUrl;
  if (!base) return null;
  return `${base}/${key.replace(/^\/+/, '')}`;
}

export async function uploadToElevateMedia(
  body: Buffer | Uint8Array,
  key: string,
  contentType: string,
): Promise<ElevateMediaUploadResult> {
  try {
    const config = getElevateMediaStorageConfig();
    const client = getElevateMediaStorageClient();
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    return {
      success: true,
      key,
      url: getElevateMediaPublicUrl(key) ?? undefined,
    };
  } catch (error) {
    logger.error('Elevate Media Storage upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

export async function uploadFromUrlToElevateMedia(
  sourceUrl: string,
  key: string,
): Promise<ElevateMediaUploadResult> {
  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) throw new Error(`Failed to fetch source: HTTP ${response.status}`);
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    return uploadToElevateMedia(Buffer.from(await response.arrayBuffer()), key, contentType);
  } catch (error) {
    logger.error('Elevate Media Storage upload-from-url error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

export async function deleteFromElevateMedia(key: string): Promise<boolean> {
  try {
    const config = getElevateMediaStorageConfig();
    await getElevateMediaStorageClient().send(
      new DeleteObjectCommand({ Bucket: config.bucket, Key: key }),
    );
    return true;
  } catch (error) {
    logger.error('Elevate Media Storage delete error:', error);
    return false;
  }
}

export async function getSignedElevateMediaUrl(
  key: string,
  expiresIn = 3600,
  options?: { contentDisposition?: string; contentType?: string },
): Promise<string | null> {
  try {
    const config = getElevateMediaStorageConfig();
    return await getSignedUrl(
      getElevateMediaStorageClient(),
      new GetObjectCommand({
        Bucket: config.bucket,
        Key: key,
        ...(options?.contentDisposition
          ? { ResponseContentDisposition: options.contentDisposition }
          : {}),
        ...(options?.contentType
          ? { ResponseContentType: options.contentType }
          : {}),
      }),
      { expiresIn },
    );
  } catch (error) {
    logger.error('Elevate Media Storage signed URL error:', error);
    return null;
  }
}

export async function listElevateMediaKeys(prefix?: string): Promise<string[]> {
  try {
    const config = getElevateMediaStorageConfig();
    const response = await getElevateMediaStorageClient().send(
      new ListObjectsV2Command({
        Bucket: config.bucket,
        Prefix: prefix,
      }),
    );
    return response.Contents?.map((item) => item.Key).filter((key): key is string => Boolean(key)) ?? [];
  } catch (error) {
    logger.error('Elevate Media Storage list error:', error);
    return [];
  }
}

export function getElevateMediaRuntimeSummary() {
  const config = getElevateMediaStorageConfig();
  return {
    provider: config.provider,
    endpointHost: config.endpoint ? (() => {
      try {
        return new URL(config.endpoint).hostname;
      } catch {
        return 'invalid';
      }
    })() : 'aws-default',
    region: config.region,
    bucketConfigured: Boolean(config.bucket),
    credentialsConfigured: Boolean(config.accessKeyId && config.secretAccessKey),
    publicDeliveryConfigured: Boolean(config.publicUrl),
    forcePathStyle: config.forcePathStyle,
  };
}

export function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const types: Record<string, string> = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    avif: 'image/avif',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    json: 'application/json',
    vtt: 'text/vtt',
    srt: 'application/x-subrip',
  };
  return types[ext || ''] || 'application/octet-stream';
}
