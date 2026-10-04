import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  SUPABASE_SAFE_VIDEO_BYTES,
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

  it('maps legacy r2 backend selection to the Elevate Media backend', () => {
    process.env.COURSE_VIDEO_STORAGE_BACKEND = 'r2';
    expect(resolveCourseVideoStorageBackend()).toBe('elevate-media');
  });

  it('compresses Supabase-bound video before the production request ceiling', () => {
    expect(SUPABASE_SAFE_VIDEO_BYTES).toBe(45 * 1024 * 1024);
  });

  it('auto keeps large video on Supabase when Elevate Media Storage is unset', () => {
    const buf = Buffer.alloc(6 * 1024 * 1024);
    expect(shouldUploadCourseMediaToElevateMedia(buf, 'video/mp4')).toBe(false);
  });

  it('does not send course media to Elevate Media Storage without a browser delivery URL', () => {
    configureB2(false);
    const buf = Buffer.alloc(6 * 1024 * 1024);
    expect(shouldUploadCourseMediaToElevateMedia(buf, 'video/mp4')).toBe(false);
  });

  it('auto sends large mp4 to Backblaze B2 when configured for public delivery', () => {
    configureB2(true);
    const buf = Buffer.alloc(6 * 1024 * 1024);
    expect(shouldUploadCourseMediaToElevateMedia(buf, 'video/mp4')).toBe(true);
  });

  it('auto keeps small mp4 on Supabase even when B2 is available', () => {
    configureB2(true);
    const buf = Buffer.alloc(1 * 1024 * 1024);
    expect(shouldUploadCourseMediaToElevateMedia(buf, 'video/mp4')).toBe(false);
  });

  it('never routes mp3 to Elevate Media Storage in auto mode', () => {
    configureB2(true);
    const buf = Buffer.alloc(10 * 1024 * 1024);
    expect(shouldUploadCourseMediaToElevateMedia(buf, 'audio/mpeg')).toBe(false);
  });

  it('force supabase backend overrides configured Elevate Media Storage', () => {
    configureB2(true);
    process.env.COURSE_VIDEO_STORAGE_BACKEND = 'supabase';
    const buf = Buffer.alloc(20 * 1024 * 1024);
    expect(shouldUploadCourseMediaToElevateMedia(buf, 'video/mp4')).toBe(false);
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
