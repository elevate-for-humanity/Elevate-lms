import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  SUPABASE_SAFE_VIDEO_BYTES,
  shouldUploadCourseMediaToR2,
  resolveCourseVideoStorageBackend,
} from '@/lib/video/upload-lesson-media';

describe('upload-lesson-media routing', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    delete process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    delete process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    delete process.env.CLOUDFLARE_R2_PUBLIC_URL;
    delete process.env.COURSE_VIDEO_STORAGE_BACKEND;
    delete process.env.COURSE_VIDEO_R2_MIN_BYTES;
  });

  afterEach(() => {
    process.env = env;
  });

  it('defaults backend to auto', () => {
    expect(resolveCourseVideoStorageBackend()).toBe('auto');
  });

  it('compresses Supabase-bound video before the production request ceiling', () => {
    expect(SUPABASE_SAFE_VIDEO_BYTES).toBe(45 * 1024 * 1024);
  });

  it('auto keeps small video on supabase path when R2 unset', () => {
    const buf = Buffer.alloc(6 * 1024 * 1024);
    expect(shouldUploadCourseMediaToR2(buf, 'video/mp4')).toBe(false);
  });

  it('does not send course media to a private-only R2 endpoint', () => {
    process.env.CLOUDFLARE_ACCOUNT_ID = 'acct';
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = 'key';
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = 'secret';
    const buf = Buffer.alloc(6 * 1024 * 1024);
    expect(shouldUploadCourseMediaToR2(buf, 'video/mp4')).toBe(false);
  });

  it('auto sends large mp4 to R2 when configured for public delivery', () => {
    process.env.CLOUDFLARE_ACCOUNT_ID = 'acct';
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = 'key';
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = 'secret';
    process.env.CLOUDFLARE_R2_PUBLIC_URL = 'https://media.example.com';
    const buf = Buffer.alloc(6 * 1024 * 1024);
    expect(shouldUploadCourseMediaToR2(buf, 'video/mp4')).toBe(true);
  });

  it('never routes mp3 to R2 in auto mode', () => {
    process.env.CLOUDFLARE_ACCOUNT_ID = 'acct';
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = 'key';
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = 'secret';
    const buf = Buffer.alloc(10 * 1024 * 1024);
    expect(shouldUploadCourseMediaToR2(buf, 'audio/mpeg')).toBe(false);
  });

  it('force supabase backend', () => {
    process.env.COURSE_VIDEO_STORAGE_BACKEND = 'supabase';
    process.env.CLOUDFLARE_ACCOUNT_ID = 'acct';
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = 'key';
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = 'secret';
    const buf = Buffer.alloc(20 * 1024 * 1024);
    expect(shouldUploadCourseMediaToR2(buf, 'video/mp4')).toBe(false);
  });
});
