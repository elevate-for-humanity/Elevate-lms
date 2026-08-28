/**
 * Upload generated lesson audio/video to durable storage.
 * - Small assets (MP3, slide JPEG) → Supabase `course-videos`
 * - Large MP4 (when R2 configured) → Cloudflare R2 under `course-videos/` prefix
 *
 * Avoids writing under public/generated/ on ephemeral containers.
 */

import { execFile } from 'child_process';
import { mkdtemp, readFile, rm, stat, unlink, writeFile } from 'fs/promises';
import { promisify } from 'util';
import os from 'os';
import path from 'path';
import { uploadToR2, isR2Configured } from '@/lib/cloudflare-r2';
import { isStorageConfigured } from '@/lib/storage/file-storage';
import { logger } from '@/lib/logger';
import { videoEncoderArgs } from './ffmpeg-runtime';

const SUPABASE_BUCKET = 'course-videos';
const R2_KEY_PREFIX = 'course-videos';

export type CourseVideoStorageBackend = 'auto' | 'supabase' | 'r2';

const DEFAULT_R2_MIN_BYTES = 5 * 1024 * 1024; // 5 MB
const SUPABASE_TUS_CHUNK_BYTES = 6 * 1024 * 1024;
const SUPABASE_TUS_RETRY_DELAYS_MS = [0, 3_000, 5_000, 10_000, 20_000] as const;
// Keep standard uploads below the production project's effective request
// ceiling. The bucket metadata permits larger objects, but the Storage API
// rejects large single-request MP4 uploads with 413 before that bucket limit.
export const SUPABASE_SAFE_VIDEO_BYTES = 45 * 1024 * 1024;
const execFileAsync = promisify(execFile);

async function compressVideoBufferForSupabase(buffer: Buffer): Promise<Buffer> {
  if (buffer.length <= SUPABASE_SAFE_VIDEO_BYTES) return buffer;
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'elevate-video-upload-'));
  const sourcePath = path.join(tempDir, 'source.mp4');
  const outputPath = path.join(tempDir, 'upload.mp4');
  try {
    await writeFile(sourcePath, buffer);
    await execFileAsync(
      'ffmpeg',
      [
        '-y', '-i', sourcePath,
        '-vf', 'scale=min(1280\\,iw):-2',
        ...videoEncoderArgs(27),
        '-maxrate', '3M', '-bufsize', '6M',
        '-c:a', 'aac', '-b:a', '128k',
        '-movflags', '+faststart',
        outputPath,
      ],
      { timeout: 20 * 60 * 1000, maxBuffer: 2 * 1024 * 1024 },
    );
    const compressed = await readFile(outputPath);
    if (compressed.length > SUPABASE_SAFE_VIDEO_BYTES) {
      throw new Error(`Compressed video is still too large for Supabase (${compressed.length} bytes)`);
    }
    logger.info('[upload-lesson-media] compressed oversized video buffer', {
      sourceBytes: buffer.length,
      uploadBytes: compressed.length,
    });
    return compressed;
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

export function resolveCourseVideoStorageBackend(): CourseVideoStorageBackend {
  const raw = (process.env.COURSE_VIDEO_STORAGE_BACKEND ?? 'auto').toLowerCase().trim();
  if (raw === 'supabase' || raw === 'r2' || raw === 'auto') return raw;
  return 'auto';
}

export function isAnyR2Configured(): boolean {
  return isR2Configured() || isStorageConfigured();
}

/** Whether this buffer should upload to R2 (not Supabase). */
export function shouldUploadCourseMediaToR2(
  buffer: Buffer,
  contentType: string,
): boolean {
  const backend = resolveCourseVideoStorageBackend();
  if (backend === 'supabase') return false;
  if (!isR2Configured()) {
    if (backend === 'r2') {
      logger.warn('[upload-lesson-media] COURSE_VIDEO_STORAGE_BACKEND=r2 but Cloudflare R2 not configured');
    }
    return false;
  }

  if (backend === 'r2') return true;

  // auto: large video files → R2; audio/images stay on Supabase
  if (!contentType.startsWith('video/')) return false;
  const minBytes = Number(process.env.COURSE_VIDEO_R2_MIN_BYTES || DEFAULT_R2_MIN_BYTES);
  return buffer.length >= minBytes;
}

export function lessonMediaStoragePath(lessonId: string, ext: 'mp3' | 'mp4'): string {
  return `generated-lessons/lesson-${lessonId}.${ext}`;
}

export function lessonMediaPublicUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  if (!base) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  return `${base}/storage/v1/object/public/${SUPABASE_BUCKET}/${storagePath}`;
}

function r2KeyForStoragePath(storagePath: string): string {
  return `${R2_KEY_PREFIX}/${storagePath}`;
}

async function uploadCourseVideosToSupabase(
  buffer: Buffer,
  storagePath: string,
  contentType: string,
): Promise<string> {
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supaUrl || !svc) {
    throw new Error('Supabase storage credentials are not configured');
  }

  const res = await fetch(`${supaUrl}/storage/v1/object/${SUPABASE_BUCKET}/${storagePath}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${svc}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Storage upload failed (${storagePath}): ${text.slice(0, 200)}`);
  }

  return lessonMediaPublicUrl(storagePath);
}

function storageDirectUrl(supabaseUrl: string): string {
  const parsed = new URL(supabaseUrl);
  const projectRef = parsed.hostname.split('.')[0];
  if (!projectRef) throw new Error('Unable to resolve Supabase project reference');
  return `${parsed.protocol}//${projectRef}.storage.supabase.co`;
}

function tusMetadata(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64');
}

async function resumableOffset(uploadUrl: string, headers: Record<string, string>): Promise<number> {
  const response = await fetch(uploadUrl, {
    method: 'HEAD',
    headers: { ...headers, 'Tus-Resumable': '1.0.0' },
  });
  if (!response.ok) throw new Error(`Resumable upload offset check failed: HTTP ${response.status}`);
  const offset = Number(response.headers.get('upload-offset'));
  if (!Number.isFinite(offset) || offset < 0) throw new Error('Resumable upload returned an invalid offset');
  return offset;
}

/**
 * Supabase Storage's documented TUS path for server-side generated media.
 * Chunks are fixed at 6 MiB, retries resume from the server-confirmed offset,
 * and the direct Storage hostname avoids the API gateway's whole-body ceiling.
 */
async function uploadCourseVideosToSupabaseResumable(
  buffer: Buffer,
  storagePath: string,
  contentType: string,
): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error('Supabase storage credentials are not configured');

  const authHeaders = {
    Authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
    'x-upsert': 'true',
  };
  const createResponse = await fetch(`${storageDirectUrl(supabaseUrl)}/storage/v1/upload/resumable`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Tus-Resumable': '1.0.0',
      'Upload-Length': String(buffer.length),
      'Upload-Metadata': [
        `bucketName ${tusMetadata(SUPABASE_BUCKET)}`,
        `objectName ${tusMetadata(storagePath)}`,
        `contentType ${tusMetadata(contentType)}`,
        `cacheControl ${tusMetadata('31536000')}`,
      ].join(','),
    },
  });
  if (!createResponse.ok) {
    const detail = await createResponse.text();
    throw new Error(`Resumable upload session failed (${storagePath}): HTTP ${createResponse.status} ${detail.slice(0, 200)}`);
  }
  const location = createResponse.headers.get('location');
  if (!location) throw new Error(`Resumable upload session returned no location (${storagePath})`);
  const uploadUrl = new URL(location, storageDirectUrl(supabaseUrl)).toString();

  let offset = Number(createResponse.headers.get('upload-offset') ?? '0');
  while (offset < buffer.length) {
    const end = Math.min(offset + SUPABASE_TUS_CHUNK_BYTES, buffer.length);
    const chunk = buffer.subarray(offset, end);
    let uploaded = false;
    let lastError: unknown;
    for (const delayMs of SUPABASE_TUS_RETRY_DELAYS_MS) {
      if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
      try {
        const response = await fetch(uploadUrl, {
          method: 'PATCH',
          headers: {
            ...authHeaders,
            'Tus-Resumable': '1.0.0',
            'Upload-Offset': String(offset),
            'Content-Type': 'application/offset+octet-stream',
          },
          body: new Uint8Array(chunk),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 200)}`);
        const nextOffset = Number(response.headers.get('upload-offset'));
        if (!Number.isFinite(nextOffset) || nextOffset <= offset) {
          throw new Error('Resumable upload did not advance the server offset');
        }
        offset = nextOffset;
        uploaded = true;
        break;
      } catch (error) {
        lastError = error;
        try {
          offset = await resumableOffset(uploadUrl, authHeaders);
          if (offset >= end) {
            uploaded = true;
            break;
          }
        } catch (offsetError) {
          lastError = offsetError;
        }
      }
    }
    if (!uploaded) {
      throw new Error(`Resumable upload failed at byte ${offset}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
    }
  }

  logger.info('[upload-lesson-media] resumable Supabase upload complete', {
    storagePath,
    bytes: buffer.length,
  });
  return lessonMediaPublicUrl(storagePath);
}

async function uploadCourseVideosToR2(
  buffer: Buffer,
  storagePath: string,
  contentType: string,
): Promise<string> {
  const key = r2KeyForStoragePath(storagePath);
  const result = await uploadToR2(buffer, key, contentType);
  if (!result.success || !result.url) {
    throw new Error(result.error ?? `R2 upload failed for ${key}`);
  }
  logger.info('[upload-lesson-media] uploaded to R2', {
    key,
    bytes: buffer.length,
    url: result.url.slice(0, 80),
  });
  return result.url;
}

export async function uploadCourseVideosObject(
  buffer: Buffer,
  storagePath: string,
  contentType: string,
  options?: { forceSupabase?: boolean },
): Promise<string> {
  if (!options?.forceSupabase && shouldUploadCourseMediaToR2(buffer, contentType)) {
    try {
      return await uploadCourseVideosToR2(buffer, storagePath, contentType);
    } catch (err) {
      logger.warn('[upload-lesson-media] R2 upload failed, falling back to Supabase', { err });
    }
  }
  if (contentType.startsWith('video/') && buffer.length > SUPABASE_TUS_CHUNK_BYTES) {
    return uploadCourseVideosToSupabaseResumable(buffer, storagePath, contentType);
  }
  const uploadBuffer = contentType.startsWith('video/')
    ? await compressVideoBufferForSupabase(buffer)
    : buffer;
  return uploadCourseVideosToSupabase(uploadBuffer, storagePath, contentType);
}

export async function uploadLessonMediaBuffer(
  buffer: Buffer,
  lessonId: string,
  ext: 'mp3' | 'mp4',
): Promise<string> {
  const storagePath = lessonMediaStoragePath(lessonId, ext);
  const contentType = ext === 'mp3' ? 'audio/mpeg' : 'video/mp4';
  return uploadCourseVideosObject(buffer, storagePath, contentType);
}

/** Temp paths for Remotion/ffmpeg — always under os.tmpdir(), never public/. */
export function lessonRenderTempPaths(lessonId: string) {
  const dir = path.join(os.tmpdir(), `elevate-lesson-${lessonId}`);
  return {
    dir,
    audioPath: path.join(dir, `lesson-${lessonId}.mp3`),
    videoPath: path.join(dir, `lesson-${lessonId}.mp4`),
  };
}

export async function uploadLessonFileFromDisk(
  filePath: string,
  lessonId: string,
  ext: 'mp3' | 'mp4',
): Promise<string> {
  let uploadPath = filePath;
  let compressedPath: string | null = null;
  if (ext === 'mp4' && (await stat(filePath)).size > SUPABASE_SAFE_VIDEO_BYTES) {
    compressedPath = filePath.replace(/\.mp4$/i, '.upload.mp4');
    await execFileAsync(
      'ffmpeg',
      [
        '-y',
        '-i', filePath,
        '-vf', 'scale=min(1280\\,iw):-2',
        ...videoEncoderArgs(27),
        '-maxrate', '3M',
        '-bufsize', '6M',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        compressedPath,
      ],
      { timeout: 20 * 60 * 1000, maxBuffer: 2 * 1024 * 1024 },
    );
    uploadPath = compressedPath;
    const uploadBytes = (await stat(uploadPath)).size;
    if (uploadBytes > SUPABASE_SAFE_VIDEO_BYTES) {
      throw new Error(
        `Compressed lesson video is still too large for Supabase (${uploadBytes} bytes)`,
      );
    }
    logger.info('[upload-lesson-media] compressed oversized lesson video', {
      lessonId,
      sourceBytes: (await stat(filePath)).size,
      uploadBytes,
    });
  }
  const buf = await readFile(uploadPath);
  const url = await uploadLessonMediaBuffer(buf, lessonId, ext);
  await Promise.all(
    [filePath, compressedPath].filter(Boolean).map((target) => unlink(target as string)),
  ).catch((err) => {
    logger.debug('[upload-lesson-media] temp file cleanup', { filePath, err });
  });
  return url;
}
