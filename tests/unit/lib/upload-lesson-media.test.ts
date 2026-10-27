import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const storageMocks = vi.hoisted(() => ({ uploadFile: vi.fn(), uploadBuffer: vi.fn() }));
vi.mock('@/lib/storage/elevate-media-storage', async (original) => ({
  ...await original<typeof import('@/lib/storage/elevate-media-storage')>(),
  uploadFileToElevateMedia: storageMocks.uploadFile,
  uploadToElevateMedia: storageMocks.uploadBuffer,
}));
import {
  SUPABASE_SAFE_VIDEO_BYTES,
  uploadLessonFileFromDisk,
  resolveCourseVideoStorageBackend,
  shouldUploadCourseMediaToElevateMedia,
} from '@/lib/video/upload-lesson-media';

describe('upload-lesson-media routing', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    for (const key of [
      'ELEVATE_MEDIA_PROVIDER',
      'ELEVATE_MEDIA_ENDPOINT',
      'ELEVATE_MEDIA_REGION',
      'ELEVATE_MEDIA_ACCESS_KEY_ID',
      'ELEVATE_MEDIA_SECRET_ACCESS_KEY',
      'ELEVATE_MEDIA_BUCKET',
      'ELEVATE_MEDIA_PUBLIC_URL',
      'NEXT_PUBLIC_ELEVATE_MEDIA_URL',
      'S3_ENDPOINT',
      'S3_REGION',
      'S3_ACCESS_KEY_ID',
      'S3_SECRET_ACCESS_KEY',
      'S3_BUCKET',
      'S3_PUBLIC_URL',
      'CLOUDFLARE_ACCOUNT_ID',
      'CLOUDFLARE_R2_ACCESS_KEY_ID',
      'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
      'CLOUDFLARE_R2_BUCKET_NAME',
      'CLOUDFLARE_R2_PUBLIC_URL',
      'COURSE_VIDEO_STORAGE_BACKEND',
      'COURSE_VIDEO_OBJECT_MIN_BYTES',
      'COURSE_VIDEO_R2_MIN_BYTES',
    ]) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    process.env = env;
  });

  function configureB2(publicDelivery = true) {
    process.env.ELEVATE_MEDIA_PROVIDER = 'backblaze-b2';
    process.env.ELEVATE_MEDIA_ENDPOINT = 'https://s3.us-east-005.backblazeb2.com';
    process.env.ELEVATE_MEDIA_REGION = 'us-east-005';
    process.env.ELEVATE_MEDIA_ACCESS_KEY_ID = 'key';
    process.env.ELEVATE_MEDIA_SECRET_ACCESS_KEY = 'secret';
    process.env.ELEVATE_MEDIA_BUCKET = 'elevate-media';
    if (publicDelivery) {
      process.env.ELEVATE_MEDIA_PUBLIC_URL = 'https://media.example.com';
    }
  }

  it('defaults backend to auto', () => {
    expect(resolveCourseVideoStorageBackend()).toBe('auto');
  });

  it('rejects misspelled explicit storage backend instead of silently routing to Supabase', () => {
    process.env.COURSE_VIDEO_STORAGE_BACKEND = 'elevate-medai';
    expect(() => resolveCourseVideoStorageBackend()).toThrow('COURSE_VIDEO_STORAGE_BACKEND_INVALID');
  });

  it('maps legacy r2 backend selection to the Elevate Media backend', () => {
    process.env.COURSE_VIDEO_STORAGE_BACKEND = 'r2';
    expect(resolveCourseVideoStorageBackend()).toBe('elevate-media');
  });

  it('compresses Supabase-bound video before the production request ceiling', () => {
    expect(SUPABASE_SAFE_VIDEO_BYTES).toBe(45 * 1024 * 1024);
  });

  it('rejects video when external storage is unset', () => {
    const buf = Buffer.alloc(6 * 1024 * 1024);
    expect(() => shouldUploadCourseMediaToElevateMedia(buf, 'video/mp4')).toThrow('COURSE_OBJECT_STORAGE_DELIVERY_NOT_CONFIGURED');
  });

  it('supports private Backblaze storage without a public URL', () => {
    configureB2(false);
    const buf = Buffer.alloc(6 * 1024 * 1024);
    expect(shouldUploadCourseMediaToElevateMedia(buf, 'video/mp4')).toBe(true);
  });

  it('permits explicitly selected private B2 while keeping Supabase fallback disabled', () => {
    configureB2(false);
    process.env.COURSE_VIDEO_STORAGE_BACKEND = 'elevate-media';
    expect(shouldUploadCourseMediaToElevateMedia(Buffer.alloc(6 * 1024 * 1024), 'video/mp4'))
      .toBe(true);
  });

  it('routes private Backblaze B2 video without a public delivery URL', () => {
    configureB2(false);
    expect(shouldUploadCourseMediaToElevateMedia(Buffer.alloc(6 * 1024 * 1024), 'video/mp4'))
      .toBe(true);
  });

  it('fails closed if selected Backblaze credentials are missing', () => {
    configureB2(false);
    delete process.env.ELEVATE_MEDIA_SECRET_ACCESS_KEY;
    expect(() => shouldUploadCourseMediaToElevateMedia(Buffer.alloc(6 * 1024 * 1024), 'video/mp4'))
      .toThrow('COURSE_OBJECT_STORAGE_DELIVERY_NOT_CONFIGURED');
  });

  it('auto sends large mp4 to Backblaze B2 when configured for public delivery', () => {
    configureB2(true);
    const buf = Buffer.alloc(6 * 1024 * 1024);
    expect(shouldUploadCourseMediaToElevateMedia(buf, 'video/mp4')).toBe(true);
  });

  it('routes small MP4s to external storage too', () => {
    configureB2(true);
    const buf = Buffer.alloc(1 * 1024 * 1024);
    expect(shouldUploadCourseMediaToElevateMedia(buf, 'video/mp4')).toBe(true);
  });

  it('never routes mp3 to Elevate Media Storage in auto mode', () => {
    configureB2(true);
    const buf = Buffer.alloc(10 * 1024 * 1024);
    expect(shouldUploadCourseMediaToElevateMedia(buf, 'audio/mpeg')).toBe(false);
  });

  it('rejects Supabase as a video backend even when explicitly selected', () => {
    configureB2(true);
    process.env.COURSE_VIDEO_STORAGE_BACKEND = 'supabase';
    const buf = Buffer.alloc(20 * 1024 * 1024);
    expect(() => shouldUploadCourseMediaToElevateMedia(buf, 'video/mp4')).toThrow('COURSE_VIDEO_EXTERNAL_STORAGE_REQUIRED');
  });

  it('force Elevate Media backend routes video even below the automatic size threshold', () => {
    configureB2(true);
    process.env.COURSE_VIDEO_STORAGE_BACKEND = 'elevate-media';
    const buf = Buffer.alloc(1 * 1024 * 1024);
    expect(shouldUploadCourseMediaToElevateMedia(buf, 'video/mp4')).toBe(true);
  });

  it('keeps legacy Cloudflare R2 environment variables working', () => {
    process.env.CLOUDFLARE_ACCOUNT_ID = 'acct';
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = 'key';
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = 'secret';
    process.env.CLOUDFLARE_R2_BUCKET_NAME = 'elevate-media';
    process.env.CLOUDFLARE_R2_PUBLIC_URL = 'https://legacy-media.example.com';
    const buf = Buffer.alloc(6 * 1024 * 1024);
    expect(shouldUploadCourseMediaToElevateMedia(buf, 'video/mp4')).toBe(true);
  });
});

describe('completed MP4 external upload', () => {
  const previous = process.env;
  beforeEach(() => {
    process.env = { ...previous, COURSE_VIDEO_STORAGE_BACKEND: 'auto',
      ELEVATE_MEDIA_PROVIDER: 'backblaze-b2',
      ELEVATE_MEDIA_ENDPOINT: 'https://s3.us-east-005.backblazeb2.com',
      ELEVATE_MEDIA_ACCESS_KEY_ID: 'fixture-key', ELEVATE_MEDIA_SECRET_ACCESS_KEY: 'fixture-secret',
      ELEVATE_MEDIA_BUCKET: 'fixture-media' };
    delete process.env.ULTIMATE_OWNER_PREVIEW_JOB_ID;
    storageMocks.uploadFile.mockReset();
    storageMocks.uploadBuffer.mockReset();
    vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected Supabase upload'); }));
  });
  afterEach(() => { process.env = previous; vi.unstubAllGlobals(); });
  it('uploads completed bytes externally and removes the temporary file only on success', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'external-lesson-upload-'));
    const file = path.join(directory, 'lesson.mp4');
    const bytes = Buffer.alloc(46 * 1024 * 1024, 7);
    try {
      await writeFile(file, bytes);
      storageMocks.uploadFile.mockImplementation(async (savedFile: string, key: string, mime: string) => {
        expect(savedFile).toBe(file);
        expect((await readFile(savedFile)).equals(bytes)).toBe(true);
        expect(mime).toBe('video/mp4');
        return { success: true, key, url: 'https://external-media.example/lesson.mp4' };
      });
      expect(await uploadLessonFileFromDisk(file, 'lesson-test', 'mp4'))
        .toBe('https://external-media.example/lesson.mp4');
      expect(storageMocks.uploadFile).toHaveBeenCalledOnce();
      expect(fetch).not.toHaveBeenCalled();
      await expect(readFile(file)).rejects.toThrow();
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
  it('retains completed render bytes and never sends them to Supabase after external failure', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'external-lesson-upload-'));
    const file = path.join(directory, 'lesson.mp4'), bytes = Buffer.from('completed film');
    try {
      await writeFile(file, bytes);
      storageMocks.uploadFile.mockResolvedValue({ success: false, error: 'external unavailable' });
      await expect(uploadLessonFileFromDisk(file, 'lesson-test', 'mp4')).rejects.toThrow('COURSE_OBJECT_STORAGE_UPLOAD_FAILED');
      expect((await readFile(file)).equals(bytes)).toBe(true);
      expect(fetch).not.toHaveBeenCalled();
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
  it('rejects the former forced Supabase path before writing or deleting render bytes', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'external-lesson-upload-'));
    const file = path.join(directory, 'lesson.mp4'), bytes = Buffer.from('keep this film');
    try {
      await writeFile(file, bytes);
      await expect(uploadLessonFileFromDisk(file, 'lesson-test', 'mp4', { forceSupabase: true }))
        .rejects.toThrow('COURSE_VIDEO_EXTERNAL_STORAGE_REQUIRED');
      expect((await readFile(file)).equals(bytes)).toBe(true);
      expect(storageMocks.uploadFile).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
});
