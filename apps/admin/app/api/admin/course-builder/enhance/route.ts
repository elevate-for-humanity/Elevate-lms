import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { loadAllBlueprints } from '@/lib/curriculum/load-blueprint';
import { courseFactory } from '@/lib/course-factory/factory';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const BodySchema = z.object({
  courseId: z.string().uuid(),
  contentSource: z.enum(['ai', 'blueprint']).default('ai'),
  queueVideos: z.boolean().default(false),
  mode: z.enum(['missing-only', 'replace']).default('missing-only'),
});

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return safeError('Invalid enhancement request', 400);

  try {
    const db = await requireAdminClient();
    const { data: course, error } = await db
      .from('courses')
      .select('id,title,slug,program_id,programs(slug)')
      .eq('id', parsed.data.courseId)
      .maybeSingle();
    if (error) throw error;
    if (!course) return safeError('Course not found', 404);
    if (!course.program_id) return safeError('Course must be linked to a program before blueprint enhancement.', 409);

    const programRelation = course.programs as { slug?: string } | Array<{ slug?: string }> | null;
    const programSlug = Array.isArray(programRelation) ? programRelation[0]?.slug : programRelation?.slug;
    if (!programSlug) return safeError('Linked program has no slug; cannot resolve a registered blueprint.', 409);

    const blueprints = await loadAllBlueprints();
    const blueprint = blueprints.find((candidate) => candidate.programSlug === programSlug);
    if (!blueprint) return safeError(`No registered blueprint exists for program '${programSlug}'.`, 404);

    const result = await courseFactory({
      courseId: course.id,
      programId: course.program_id,
      programSlug,
      blueprint,
      mode: parsed.data.mode,
      contentSource: parsed.data.contentSource,
      videoMode: parsed.data.queueVideos ? 'queue' : 'off',
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status === 'incomplete' ? 422 : 500 });
    }

    await logAdminAudit({
      action: AdminAction.BULK_CONTENT_GENERATED,
      actorId: auth.id,
      entityType: 'courses',
      entityId: course.id,
      metadata: {
        operation: 'course.enhance',
        blueprintId: blueprint.id,
        mode: parsed.data.mode,
        contentSource: parsed.data.contentSource,
        queueVideos: parsed.data.queueVideos,
        modules: result.moduleCount,
        lessonsWritten: result.lessonCount,
        lessonsSkipped: result.skippedCount,
      },
      req: request,
    });

    return NextResponse.json(result);
  } catch (error) {
    return safeInternalError(error, 'Course enhancement failed');
  }
}
