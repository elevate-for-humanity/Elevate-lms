/**
 * Upload generated lesson audio/video to durable storage.
 * - Small assets (MP3, slide JPEG) → Supabase `course-videos`
 * - Large MP4 → configured Elevate Media Storage when available
 *
 * Production Elevate Media Storage can be Backblaze B2, Wasabi, AWS S3, Supabase S3,
 * Cloudflare R2, or another S3-compatible endpoint. Container disk remains
 * ephemeral and is used only while rendering.
 */

import { execFile } from 'child_process';
import { mkdtemp, readFile, rm, stat, unlink, writeFile } from 'fs/promises';
import { promisify } from 'util';
import os from 'os';
import path from 'path';
import {
  uploadToElevateMedia,
  getSignedElevateMediaUrl,
  uploadFileToElevateMedia,
  isElevateMediaStorageConfigured,
  isElevateMediaPublicDeliveryConfigured,
} from '../storage/elevate-media-storage';
import { ownerPreviewMediaDelivery } from './owner-preview-media-delivery.mjs';
import { logger } from '../logger';
import { uploadSupabaseResumable, uploadSupabaseResumableFile } from './supabase-resumable-upload.mjs';
import { videoEncoderArgs } from './ffmpeg-runtime';

const SUPABASE_BUCKET = 'course-videos';
const ELEVATE_MEDIA_KEY_PREFIX = 'course-videos';

export type CourseVideoStorageBackend = 'auto' | 'supabase' | 'elevate-media';

const DEFAULT_ELEVATE_MEDIA_MIN_BYTES = 5 * 1024 * 1024; // 5 MB
const SUPABASE_TUS_CHUNK_BYTES = 6 * 1024 * 1024;
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
  if (raw === 'supabase' || raw === 'auto') return raw;
  // Legacy "r2" and provider-oriented values map to the Elevate Media backend.
  if (raw === 'elevate-media' || raw === 'object' || raw === 's3' || raw === 'b2' || raw === 'r2') return 'elevate-media';
  return 'auto';
}

export function isAnyElevateMediaStorageConfigured(): boolean {
  return isElevateMediaStorageConfigured();
}

/** @deprecated Compatibility alias for older admin diagnostics. */
export const isAnyR2Configured = isAnyElevateMediaStorageConfigured;

/** Whether this buffer should upload to Elevate Media Storage instead of Supabase. */
export function shouldUploadCourseMediaToElevateMedia(
  buffer: Pick<Buffer, 'length'>,
  contentType: string,
): boolean {
  const backend = resolveCourseVideoStorageBackend();
  if (backend === 'supabase') return false;
  if (!isElevateMediaStorageConfigured() || !isElevateMediaPublicDeliveryConfigured()) {
    if (backend === 'elevate-media') throw new Error('COURSE_OBJECT_STORAGE_DELIVERY_NOT_CONFIGURED');
    return false;
  }

  if (backend === 'elevate-media') return true;

  // auto: large video files → Elevate Media Storage; audio/images stay on Supabase
  if (!contentType.startsWith('video/')) return false;
  const minBytes = Number(
    process.env.ELEVATE_MEDIA_VIDEO_MIN_BYTES ||
      process.env.COURSE_VIDEO_OBJECT_MIN_BYTES ||
      process.env.COURSE_VIDEO_R2_MIN_BYTES ||
      DEFAULT_ELEVATE_MEDIA_MIN_BYTES,
  );
  return buffer.length >= minBytes;
}

/** @deprecated Compatibility alias. */
export const shouldUploadCourseMediaToObjectStorage = shouldUploadCourseMediaToElevateMedia;
/** @deprecated Compatibility alias. */
export const shouldUploadCourseMediaToR2 = shouldUploadCourseMediaToElevateMedia;

export function lessonMediaStoragePath(lessonId: string, ext: 'mp3' | 'mp4'): string {
  // Generated audio and video are immutable candidates. Reusing the same public object key
  // across retries can make the quality gate or learner CDN read the previous
  // render after an upsert, producing false duration/transcript failures and
  // potentially serving stale narration or media after approval.
  const version = `-${Date.now().toString(36)}-${crypto.randomUUID()}`;
  return `generated-lessons/lesson-${lessonId}${version}.${ext}`;
}

export function lessonMediaPublicUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  if (!base) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  return `${base}/storage/v1/object/public/${SUPABASE_BUCKET}/${storagePath}`;
}

function elevateMediaKeyForStoragePath(storagePath: string): string {
  return `${ELEVATE_MEDIA_KEY_PREFIX}/${storagePath}`;
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

/** Chunked upload with bounded retries and server-confirmed recovery offsets. */
async function uploadCourseVideosToSupabaseResumable(
  buffer: Buffer,
  storagePath: string,
  contentType: string,
): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error('Supabase storage credentials are not configured');
  try {
    await uploadSupabaseResumable({
      buffer,
      endpoint: `${storageDirectUrl(supabaseUrl)}/storage/v1/upload/resumable`,
      headers: {Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, 'x-upsert': 'true'},
      metadata: [
        `bucketName ${tusMetadata(SUPABASE_BUCKET)}`,
        `objectName ${tusMetadata(storagePath)}`,
        `contentType ${tusMetadata(contentType)}`,
        `cacheControl ${tusMetadata('31536000')}`,
      ].join(','),
    });
  } catch (error) {
    throw new Error(`Resumable upload session failed (${storagePath}, ${buffer.length} bytes): ${error instanceof Error ? error.message : String(error)}`, {cause: error});
  }
  logger.info('[upload-lesson-media] resumable Supabase upload complete', {storagePath, bytes: buffer.length});
  return lessonMediaPublicUrl(storagePath);
}

async function uploadCourseVideosToElevateMedia(
  buffer: Buffer,
  storagePath: string,
  contentType: string,
): Promise<string> {
  const key = elevateMediaKeyForStoragePath(storagePath);
  const result = await ownerPreviewMediaDelivery(await uploadToElevateMedia(buffer, key, contentType), {target: process.env.ULTIMATE_OWNER_PREVIEW_JOB_ID, sign: getSignedElevateMediaUrl});
  if (!result.success || !result.url) {
    throw new Error(result.error ?? `Elevate Media Storage upload failed for ${key}`);
  }
  logger.info('[upload-lesson-media] uploaded to Elevate Media Storage', {
    key,
    bytes: buffer.length,
    // Signed read URLs are bearer credentials; never log them.
  });
  return result.url;
}

export async function uploadCourseVideosObject(
  buffer: Buffer,
  storagePath: string,
  contentType: string,
  options?: { forceSupabase?: boolean },
): Promise<string> {
  if (!options?.forceSupabase && shouldUploadCourseMediaToElevateMedia(buffer, contentType)) {
    try {
      return await uploadCourseVideosToElevateMedia(buffer, storagePath, contentType);
    } catch (err) {
      // The ordinary request ceiling does not apply to the TUS route below.
      // Keep the completed bytes and let Storage enforce its actual object
      // limit instead of rejecting a valid film before a chunked upload.
      if (resolveCourseVideoStorageBackend() === 'elevate-media') throw new Error('COURSE_OBJECT_STORAGE_UPLOAD_FAILED', { cause: err });
      logger.warn('[upload-lesson-media] Elevate Media Storage upload failed, falling back to Supabase', { err });
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
  options?: {forceSupabase?:boolean},
): Promise<string> {
  const storagePath = lessonMediaStoragePath(lessonId, ext);
  const contentType = ext === 'mp3' ? 'audio/mpeg' : 'video/mp4';
  return uploadCourseVideosObject(buffer, storagePath, contentType, options);
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
  options?: {forceSupabase?:boolean},
): Promise<string> {
  // Large MP4s use the resumable route in uploadCourseVideosObject. The
  // single-request ceiling is not an object-size limit and must not trigger
  // an unnecessary lossy transcode or reject a valid completed lesson.
  const {size} = await stat(filePath);
  const storagePath = lessonMediaStoragePath(lessonId, ext);
  const contentType = ext === 'mp3' ? 'audio/mpeg' : 'video/mp4';
  let url: string | undefined;
  // Selection only needs the byte count; large source files remain on disk.
  if (!options?.forceSupabase && shouldUploadCourseMediaToElevateMedia({length: size}, contentType)) {
    const result = await ownerPreviewMediaDelivery(await uploadFileToElevateMedia(filePath, elevateMediaKeyForStoragePath(storagePath), contentType), {target: process.env.ULTIMATE_OWNER_PREVIEW_JOB_ID, sign: getSignedElevateMediaUrl});
    if (result.success && result.url) url = result.url;
    else if (resolveCourseVideoStorageBackend() === 'elevate-media') throw new Error('COURSE_OBJECT_STORAGE_UPLOAD_FAILED');
    else logger.warn('[upload-lesson-media] object upload failed; retrying through Supabase');
  }
  if (!url && ext === 'mp4' && size > SUPABASE_TUS_CHUNK_BYTES) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!base || !key) throw new Error('Supabase storage credentials are not configured');
    await uploadSupabaseResumableFile({
      filePath,
      endpoint: `${storageDirectUrl(base)}/storage/v1/upload/resumable`,
      headers: {Authorization: `Bearer ${key}`, apikey: key, 'x-upsert': 'true'},
      metadata: [
        `bucketName ${tusMetadata(SUPABASE_BUCKET)}`,
        `objectName ${tusMetadata(storagePath)}`,
        `contentType ${tusMetadata(contentType)}`,
        `cacheControl ${tusMetadata('31536000')}`,
      ].join(','),
    });
    url = lessonMediaPublicUrl(storagePath);
  }
  if (!url) url = await uploadCourseVideosObject(await readFile(filePath), storagePath, contentType, options);
  logger.info('[upload-lesson-media] lesson upload saved', {lessonId, ext, bytes: size});
  await unlink(filePath).catch((err) => {
    logger.debug('[upload-lesson-media] temp file cleanup', {filePath, err});
  });
  return url;
}
