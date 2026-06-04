/**
 * Upload generated lesson audio/video to Supabase Storage (course-videos bucket).
 * Avoids writing under public/generated/ on ephemeral containers.
 */

import { readFile, unlink } from 'fs/promises';
import os from 'os';
import path from 'path';
import { logger } from '@/lib/logger';

const BUCKET = 'course-videos';

export function lessonMediaStoragePath(lessonId: string, ext: 'mp3' | 'mp4'): string {
  return `generated-lessons/lesson-${lessonId}.${ext}`;
}

export function lessonMediaPublicUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  if (!base) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  return `${base}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

export async function uploadCourseVideosObject(
  buffer: Buffer,
  storagePath: string,
  contentType: string,
): Promise<string> {
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supaUrl || !svc) {
    throw new Error('Supabase storage credentials are not configured');
  }

  const res = await fetch(`${supaUrl}/storage/v1/object/${BUCKET}/${storagePath}`, {
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
