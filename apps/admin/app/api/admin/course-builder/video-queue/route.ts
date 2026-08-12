import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { queueCourseLessonVideos } from '@/lib/course-builder/video-queue';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  courseId: z.string().uuid(),
  onlyMissing: z.boolean().default(true),
  force: z.boolean().default(false),
  limit: z.number().int().positive().max(250).optional(),
});

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return safeError('Invalid video queue request', 400);

  try {
    const result = await queueCourseLessonVideos({
      courseId: parsed.data.courseId,
      onlyMissing: parsed.data.onlyMissing,
      force: parsed.data.force,
      limit: parsed.data.limit,
    });

    await logAdminAudit({
      action: AdminAction.BULK_CONTENT_GENERATED,
      actorId: auth.id,
      entityType: 'courses',
      entityId: parsed.data.courseId,
      metadata: { operation: 'course.video_queue', ...result },
      req: request,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return safeInternalError(error, 'Failed to queue lesson videos');
  }
}
