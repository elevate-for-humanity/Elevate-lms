/**
 * Where durable media lives vs ephemeral container disk.
 * Admin Northflank pods must not grow public/ or keep generated videos locally.
 */

export const MEDIA_STORAGE_POLICY = {
  /** Lesson/course MP4 — R2 when ≥5MB + CLOUDFLARE_R2_* set; MP3/slides → Supabase `course-videos` */
  courseVideo: {
    bucket: 'course-videos',
    upload: 'lib/video/upload-lesson-media.ts',
    r2Prefix: 'course-videos/',
    env: 'COURSE_VIDEO_STORAGE_BACKEND=auto|supabase|r2',
    temp: 'os.tmpdir() only during render; deleted after upload',
  },
  /** Dev Studio uploads — Supabase `documents`; optional R2 when R2_* set */
  devStudioDocs: {
    primary: 'supabase:documents',
    optional: 'cloudflare-r2 (R2_ENDPOINT + R2_BUCKET)',
    route: 'apps/admin/app/api/devstudio/upload/route.ts',
  },
  /** Digital store downloads — Cloudflare R2 via lib/storage/file-storage.ts */
  digitalProducts: {
    backend: 'R2 (R2_ACCESS_KEY / R2_SECRET_KEY / R2_BUCKET)',
    fallback: 'public/downloads/* when R2 unset',
  },
  /** WIOA PIRL exports — Supabase `wioa-exports` after temp build */
  wioaExports: {
    bucket: 'wioa-exports',
    temp: 'os.tmpdir()/pirl-{jobId}',
  },
  /** Legacy server/video-storage local disk — not used by Northflank admin routes */
  legacyLocalVideo: {
    module: 'server/video-storage.ts',
    note: 'STORAGE_TYPE=local only for dev CLI; production uses Supabase/R2/Stream',
  },
} as const;

export type MediaStorageKind = keyof typeof MEDIA_STORAGE_POLICY;
