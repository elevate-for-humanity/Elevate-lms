/**
 * Slide preview images — Supabase course-videos/slide-cache + os.tmpdir for canvas reads.
 * Never writes under public/videos/slide-image-cache.
 */

import crypto from 'crypto';
import { createWriteStream } from 'fs';
import { mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import os from 'os';
import path from 'path';
import { pipeline } from 'stream/promises';
import { lessonMediaPublicUrl, uploadCourseVideosObject } from './upload-lesson-media';

function slideCacheStoragePath(cacheKey: string): string {
  return `slide-cache/${cacheKey}.jpg`;
}

function slideCacheTempPath(cacheKey: string): string {
  return path.join(os.tmpdir(), 'elevate-slide-cache', `${cacheKey}.jpg`);
}

async function downloadToTemp(url: string, dest: string): Promise<void> {
  await mkdir(path.dirname(dest), { recursive: true });
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Failed to download slide image (${res.status})`);
  await pipeline(res.body as unknown as NodeJS.ReadableStream, createWriteStream(dest));
}

/**
 * Returns a local path suitable for canvas loadImage, or null if no image could be fetched.
 */
export async function getSlideImageLocalPath(prompt: string | undefined): Promise<string | null> {
  if (!prompt?.trim()) return null;

  const cacheKey = crypto.createHash('md5').update(prompt).digest('hex');
  const storagePath = slideCacheStoragePath(cacheKey);
  const publicUrl = lessonMediaPublicUrl(storagePath);
  const tmpPath = slideCacheTempPath(cacheKey);

  try {
    const head = await fetch(publicUrl, { method: 'HEAD' });
    if (head.ok) {
      await downloadToTemp(publicUrl, tmpPath);
      return tmpPath;
    }
  } catch {
    /* fetch fresh */
  }

  const buffer = await fetchSlideImageBytes(prompt);
  if (!buffer) return null;

  await mkdir(path.dirname(tmpPath), { recursive: true });
  await uploadCourseVideosObject(buffer, storagePath, 'image/jpeg', { forceSupabase: true });
  const { writeFile } = await import('fs/promises');
  await writeFile(tmpPath, buffer);

  return tmpPath;
}

async function fetchSlideImageBytes(prompt: string): Promise<Buffer | null> {
  const pexelsKey = process.env.PEXELS_API_KEY;
  if (pexelsKey) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(prompt)}&per_page=1&orientation=landscape`,
        { headers: { Authorization: pexelsKey } },
      );
      if (res.ok) {
        const data = (await res.json()) as { photos: { src: { large: string } }[] };
        const url = data.photos?.[0]?.src?.large;
        if (url) {
          const img = await fetch(url);
          if (img.ok) return Buffer.from(await img.arrayBuffer());
        }
      }
    } catch {
      /* fall through */
    }
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: `Photorealistic professional training photo: ${prompt}. Clean, well-lit, no text overlays.`,
          n: 1,
          size: '1792x1024',
          quality: 'standard',
          style: 'natural',
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { data: { url: string }[] };
        const url = data.data?.[0]?.url;
        if (url) {
          const img = await fetch(url);
          if (img.ok) return Buffer.from(await img.arrayBuffer());
        }
      }
    } catch {
      /* fall through */
    }
  }

  return null;
}

/** Remove temp slide file after render (Supabase copy remains for reuse). */
export async function cleanupSlideImageTemp(localPath: string | null): Promise<void> {
  if (!localPath) return;
  if (!localPath.startsWith(os.tmpdir())) return;
  if (!existsSync(localPath)) return;
  await unlink(localPath).catch(() => {});
}
