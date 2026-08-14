/**
 * GET /api/admin/runtime-footprint
 * Admin-only snapshot: what runs at idle vs on-demand, storage backends configured.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { MEDIA_STORAGE_POLICY } from '@/lib/media/storage-policy';
import { isR2Configured } from '@/lib/cloudflare-r2';
import { isStorageConfigured } from '@/lib/storage/file-storage';
import {
  resolveCourseVideoStorageBackend,
  isAnyR2Configured,
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
      r2CloudflareModule: isR2Configured(),
      r2FileStorageModule: isStorageConfigured(),
      courseVideoBackend: resolveCourseVideoStorageBackend(),
      courseVideoR2MinBytes: Number(process.env.COURSE_VIDEO_R2_MIN_BYTES || 5_242_880),
      largeMp4UsesR2WhenConfigured: isAnyR2Configured(),
      remotionReleaseAfterJob: process.env.REMOTION_RELEASE_BUNDLE_AFTER_RENDER !== 'false',
    },
    notes: [
      'Generated lesson videos upload to Supabase course-videos; container disk is temp-only.',
      'Cloudflare R2 is for digital downloads (and optional Dev Studio R2 path), not required for course videos.',
      'Nothing in this response starts background work — diagnostic only.',
    ],
  });
}
