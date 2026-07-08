/**
 * Upload generated lesson audio/video to durable storage.
 * - Small assets (MP3, slide JPEG) → Supabase `course-videos`
 * - Large MP4 (when R2 configured) → Cloudflare R2 under `course-videos/` prefix
 *
 * Avoids writing under public/generated/ on ephemeral containers.
 */

import { readFile, unlink } from 'fs/promises';
import os from 'os';
import path from 'path';
import { uploadToR2, isR2Configured } from '@/lib/cloudflare-r2';
import { isStorageConfigured } from '@/lib/storage/file-storage';
import { logger } from '@/lib/logger';

const SUPABASE_BUCKET = 'course-videos';
const R2_KEY_PREFIX = 'course-videos';

export type CourseVideoStorageBackend = 'auto' | 'supabase' | 'r2';

const DEFAULT_R2_MIN_BYTES = 5 * 1024 * 1024; // 5 MB

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
  return uploadCourseVideosToSupabase(buffer, storagePath, contentType);
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
  const buf = await readFile(filePath);
  const url = await uploadLessonMediaBuffer(buf, lessonId, ext);
  await unlink(filePath).catch((err) => {
    logger.debug('[upload-lesson-media] temp file cleanup', { filePath, err });
  });
  return url;
}
