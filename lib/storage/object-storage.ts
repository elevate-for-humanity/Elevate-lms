import { logger } from '@/lib/logger';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export type ObjectStorageProvider =
  | 'backblaze-b2'
  | 'wasabi'
  | 'aws-s3'
  | 'supabase-s3'
  | 'cloudflare-r2'
  | 'custom-s3';

export interface ObjectStorageConfig {
  provider: ObjectStorageProvider;
  endpoint?: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
  forcePathStyle: boolean;
}

export interface ObjectUploadResult {
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

function inferProvider(endpoint: string): ObjectStorageProvider {
  const explicit = clean(process.env.OBJECT_STORAGE_PROVIDER).toLowerCase();
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

function regionFromEndpoint(endpoint: string, provider: ObjectStorageProvider): string {
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

export function getObjectStorageConfig(): ObjectStorageConfig {
  const endpoint = clean(
    process.env.OBJECT_STORAGE_ENDPOINT ||
      process.env.S3_ENDPOINT ||
      process.env.R2_ENDPOINT ||
      process.env.CLOUDFLARE_R2_ENDPOINT ||
      deriveLegacyR2Endpoint(),
  ).replace(/\/$/, '');

  const provider = inferProvider(endpoint);
  const region =
    clean(
      process.env.OBJECT_STORAGE_REGION ||
        process.env.S3_REGION ||
        process.env.R2_REGION ||
        process.env.AWS_REGION,
    ) || regionFromEndpoint(endpoint, provider);

  const accessKeyId = clean(
    process.env.OBJECT_STORAGE_ACCESS_KEY_ID ||
      process.env.S3_ACCESS_KEY_ID ||
      process.env.R2_ACCESS_KEY ||
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
      process.env.AWS_ACCESS_KEY_ID,
  );
  const secretAccessKey = clean(
    process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY ||
      process.env.S3_SECRET_ACCESS_KEY ||
      process.env.R2_SECRET_KEY ||
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
      process.env.AWS_SECRET_ACCESS_KEY,
  );
  const bucket = clean(
    process.env.OBJECT_STORAGE_BUCKET ||
      process.env.S3_BUCKET ||
      process.env.R2_BUCKET ||
      process.env.CLOUDFLARE_R2_BUCKET_NAME ||
      process.env.CLOUDFLARE_R2_BUCKET ||
      process.env.AWS_S3_BUCKET,
  );
  const publicUrl = clean(
    process.env.OBJECT_STORAGE_PUBLIC_URL ||
      process.env.NEXT_PUBLIC_OBJECT_STORAGE_URL ||
      process.env.S3_PUBLIC_URL ||
      process.env.CLOUDFLARE_R2_PUBLIC_URL ||
      process.env.NEXT_PUBLIC_R2_URL,
  ).replace(/\/$/, '');

  const configuredForcePathStyle = bool(
    process.env.OBJECT_STORAGE_FORCE_PATH_STYLE || process.env.S3_FORCE_PATH_STYLE,
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

export function isObjectStorageConfigured(): boolean {
  const config = getObjectStorageConfig();
  const endpointReady = Boolean(config.endpoint) || config.provider === 'aws-s3';
  return Boolean(
    endpointReady &&
      config.accessKeyId &&
      config.secretAccessKey &&
      config.bucket,
  );
}

export function isObjectStoragePublicDeliveryConfigured(): boolean {
  return Boolean(getObjectStorageConfig().publicUrl);
}

let cachedClient: S3Client | null = null;
let cachedFingerprint = '';

export function getObjectStorageClient(): S3Client {
  const config = getObjectStorageConfig();
  if (!isObjectStorageConfigured()) {
    throw new Error(
      'Object storage is not configured. Set OBJECT_STORAGE_ENDPOINT, OBJECT_STORAGE_ACCESS_KEY_ID, OBJECT_STORAGE_SECRET_ACCESS_KEY, and OBJECT_STORAGE_BUCKET (or compatible S3/R2/AWS fallback variables).',
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

export function getObjectStoragePublicUrl(key: string): string | null {
  const base = getObjectStorageConfig().publicUrl;
  if (!base) return null;
  return `${base}/${key.replace(/^\/+/, '')}`;
}

export async function uploadToObjectStorage(
  body: Buffer | Uint8Array,
  key: string,
  contentType: string,
): Promise<ObjectUploadResult> {
  try {
    const config = getObjectStorageConfig();
    const client = getObjectStorageClient();
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
      url: getObjectStoragePublicUrl(key) ?? undefined,
    };
  } catch (error) {
    logger.error('Object storage upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

export async function uploadFromUrlToObjectStorage(
  sourceUrl: string,
  key: string,
): Promise<ObjectUploadResult> {
  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) throw new Error(`Failed to fetch source: HTTP ${response.status}`);
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    return uploadToObjectStorage(Buffer.from(await response.arrayBuffer()), key, contentType);
  } catch (error) {
    logger.error('Object storage upload-from-url error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

export async function deleteFromObjectStorage(key: string): Promise<boolean> {
  try {
    const config = getObjectStorageConfig();
    await getObjectStorageClient().send(
      new DeleteObjectCommand({ Bucket: config.bucket, Key: key }),
    );
    return true;
  } catch (error) {
    logger.error('Object storage delete error:', error);
    return false;
  }
}

export async function getSignedObjectUrl(
  key: string,
  expiresIn = 3600,
  options?: { contentDisposition?: string; contentType?: string },
): Promise<string | null> {
  try {
    const config = getObjectStorageConfig();
    return await getSignedUrl(
      getObjectStorageClient(),
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
    logger.error('Object storage signed URL error:', error);
    return null;
  }
}

export async function listObjectStorageKeys(prefix?: string): Promise<string[]> {
  try {
    const config = getObjectStorageConfig();
    const response = await getObjectStorageClient().send(
      new ListObjectsV2Command({
        Bucket: config.bucket,
        Prefix: prefix,
      }),
    );
    return response.Contents?.map((item) => item.Key).filter((key): key is string => Boolean(key)) ?? [];
  } catch (error) {
    logger.error('Object storage list error:', error);
    return [];
  }
}

export function getObjectStorageRuntimeSummary() {
  const config = getObjectStorageConfig();
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
