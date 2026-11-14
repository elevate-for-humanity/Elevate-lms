/**
 * GET /api/admin/runtime-footprint
 * Admin-only snapshot: what runs at idle vs on-demand, storage backends configured.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { MEDIA_STORAGE_POLICY } from '@/lib/media/storage-policy';
import {
  getElevateMediaRuntimeSummary,
  isElevateMediaStorageConfigured,
} from '@/lib/storage/elevate-media-storage';
import {
  resolveCourseVideoStorageBackend,
  isAnyElevateMediaStorageConfigured,
} from '@/lib/video/upload-lesson-media';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function envSet(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  return NextResponse.json({
    idle: {
      remotionBundleAtStartup: false,
      inProcessCronTimers: false,
      cronTrigger: 'GitHub Actions cron-scheduler.yml → HTTP /api/cron/*',
      devStudioAutofixAtStartup: false,
      devcontainerMode: process.env.DEVSTUDIO_DEVCONTAINER_MODE ?? 'auto',
    },
    storage: {
      policy: MEDIA_STORAGE_POLICY,
      supabaseConfigured: envSet('NEXT_PUBLIC_SUPABASE_URL') && envSet('SUPABASE_SERVICE_ROLE_KEY'),
      elevateMediaConfigured: isElevateMediaStorageConfigured(),
      elevateMedia: getElevateMediaRuntimeSummary(),
      courseVideoBackend: resolveCourseVideoStorageBackend(),
      elevateMediaVideoMinBytes: Number(
        process.env.ELEVATE_MEDIA_VIDEO_MIN_BYTES ||
          process.env.COURSE_VIDEO_R2_MIN_BYTES ||
          5_242_880,
      ),
      largeMp4UsesElevateMediaWhenConfigured: isAnyElevateMediaStorageConfigured(),
      remotionReleaseAfterJob: process.env.REMOTION_RELEASE_BUNDLE_AFTER_RENDER !== 'false',
    },
    notes: [
      'Generated lesson videos use Supabase for small assets and configured S3-compatible Elevate Media Storage for large MP4s.',
      'Backblaze B2, Wasabi, AWS S3, Supabase S3, Cloudflare R2, and custom S3 endpoints share the same storage adapter.',
      'Container disk is temp-only; nothing in this response starts background work.',
    ],
  });
}
