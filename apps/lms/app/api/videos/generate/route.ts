import { logger } from '@/lib/logger';
/**
 * POST /api/videos/generate
 *
 * Video rendering is an Admin-owned production capability. The learner LMS
 * keeps this legacy endpoint only as a compatibility bridge so old clients do
 * not pull Remotion/Rspack/TTS native tooling into the learner build graph.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let lessonId: string;
  try {
    const body = await request.json();
    lessonId = body.lesson_id;
    if (!lessonId) return safeError('lesson_id is required', 400);
  } catch {
    return safeError('Invalid JSON body', 400);
  }

  const adminBase = (
    process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.elevateforhumanity.org'
  ).replace(/\/$/, '');
  logger.warn('[VideoGenerate] Legacy LMS generation endpoint redirected to Admin-owned renderer', {
    lessonId,
  });

  return NextResponse.json(
    {
      success: false,
      code: 'ADMIN_VIDEO_RENDER_REQUIRED',
      message: 'Video generation is managed from Admin Dev Studio.',
      admin_url: `${adminBase}/studio/courses`,
      lesson_id: lessonId,
    },
    {
      status: 409,
      headers: {
        Deprecation: 'true',
        Sunset: 'Wed, 30 Sep 2026 23:59:59 GMT',
        Link: `<${adminBase}/studio/courses>; rel="alternate"`,
      },
    },
  );
}
