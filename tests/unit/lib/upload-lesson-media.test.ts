import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('completed MP4 disk upload',()=>{
 it('uploads an MP4 above the old request ceiling in resumable chunks without changing its bytes',async()=>{
  const directory=await mkdtemp(path.join(tmpdir(),'lesson-upload-test-'));
  const file=path.join(directory,'lesson.mp4');
  const buffer=Buffer.alloc(46*1024*1024,7);
  const previous={...process.env};
  process.env.COURSE_VIDEO_STORAGE_BACKEND='supabase';
  process.env.NEXT_PUBLIC_SUPABASE_URL='https://test-project.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY='test-only';
  let offset=0;const chunks:Uint8Array[]=[];
  vi.stubGlobal('fetch',vi.fn(async(url:string,options:RequestInit)=>{
   if(options.method==='POST'){
    expect(url).toContain('test-project.storage.supabase.co/storage/v1/upload/resumable');
    expect((options.headers as Record<string,string>)['Upload-Length']).toBe(String(buffer.length));
    return new Response(null,{status:201,headers:{location:'/storage/v1/upload/resumable/test', 'upload-offset':'0'}});
   }
   expect(options.method).toBe('PATCH');
   expect((options.headers as Record<string,string>)['Upload-Offset']).toBe(String(offset));
   const chunk=options.body as Uint8Array;chunks.push(chunk);offset+=chunk.length;
   return new Response(null,{status:204,headers:{'upload-offset':String(offset)}});
  }));
  try{
   await writeFile(file,buffer);
   const url=await uploadLessonFileFromDisk(file,'barber-test','mp4');
   expect(url).toContain('/object/public/course-videos/generated-lessons/lesson-barber-test-');
   expect(chunks.length).toBe(8);
   expect(Buffer.concat(chunks).equals(buffer)).toBe(true);
   await expect(readFile(file)).rejects.toThrow();
  }finally{process.env=previous;vi.unstubAllGlobals();await rm(directory,{recursive:true,force:true});}
 });
 it('keeps the rendered MP4 when the upload session fails',async()=>{
  const directory=await mkdtemp(path.join(tmpdir(),'lesson-upload-test-'));const file=path.join(directory,'lesson.mp4');
  const buffer=Buffer.alloc(7*1024*1024,3);const previous={...process.env};
  process.env.COURSE_VIDEO_STORAGE_BACKEND='supabase';process.env.NEXT_PUBLIC_SUPABASE_URL='https://test-project.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test-only';
  vi.stubGlobal('fetch',vi.fn(async()=>new Response('storage unavailable',{status:503})));
  try{await writeFile(file,buffer);await expect(uploadLessonFileFromDisk(file,'barber-test','mp4')).rejects.toThrow(/session failed/);expect((await readFile(file)).equals(buffer)).toBe(true);}
  finally{process.env=previous;vi.unstubAllGlobals();await rm(directory,{recursive:true,force:true});}
 });
});
