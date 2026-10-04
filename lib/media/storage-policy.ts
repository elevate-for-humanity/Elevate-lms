/**
 * Durable media storage policy.
 *
 * Supabase remains the system of record for auth/database/permissions and small
 * course assets. Large generated video is routed to the configured
 * S3-compatible object store so storage vendors can be changed without
 * rewriting Course Builder.
 */

export const MEDIA_STORAGE_POLICY = {
  courseVideo: {
    supabaseBucket: 'course-videos',
    objectPrefix: 'course-videos/',
    upload: 'lib/video/upload-lesson-media.ts',
    backend: 'COURSE_VIDEO_STORAGE_BACKEND=auto|supabase|object',
    provider: 'OBJECT_STORAGE_PROVIDER=backblaze-b2|wasabi|aws-s3|supabase-s3|cloudflare-r2|custom-s3',
    temp: 'os.tmpdir() only during render; deleted after upload',
  },
  devStudioDocs: {
    primary: 'supabase:documents',
    optional: 'S3-compatible object storage',
    route: 'apps/admin/app/api/admin/dev-studio/upload/route.ts',
  },
  digitalProducts: {
    backend: 'shared S3-compatible object storage',
    fallback: 'public/downloads/* when object storage is unset',
  },
  wioaExports: {
    bucket: 'wioa-exports',
    temp: 'os.tmpdir()/pirl-{jobId}',
  },
  legacyLocalVideo: {
    module: 'server/video-storage.ts',
    note: 'local disk is development-only; production media must use durable storage',
  },
} as const;

export type MediaStorageKind = keyof typeof MEDIA_STORAGE_POLICY;
