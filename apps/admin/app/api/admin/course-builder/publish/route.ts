import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { auditCourseTemplate } from '@/lib/course-builder/audit';
import type { ProgramBuilderTemplate } from '@/lib/course-builder/schema';
import { adaptProgramTemplateToBlueprint } from '@/lib/course-builder/publish-adapter';
import { courseFactory } from '@/lib/course-factory';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Compatibility publish endpoint for the Admin Program Builder.
 *
 * The request contract is intentionally preserved, but all validated course
 * creation/persistence now crosses the canonical lib/course-factory boundary.
 * Do not reintroduce an independent persistence pipeline here.
 */
export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = (await req.json()) as ProgramBuilderTemplate;
    const audit = auditCourseTemplate(body);
    if (!audit.ok) {
      return NextResponse.json({ ok: false, error: 'Audit failed', audit }, { status: 400 });
    }

    const blueprint = adaptProgramTemplateToBlueprint(body);
    const result = await courseFactory({
      programId: body.programId,
      programSlug: body.programId ? undefined : body.slug,
      blueprint,
      mode: 'refresh',
      contentSource: 'ai',
      videoMode: 'queue',
    });

    return NextResponse.json(
      { ok: result.ok, audit, result },
      { status: result.ok ? 200 : 422 },
    );
  } catch (error) {
    logger.error('[course-builder/publish]', error);
    return NextResponse.json({ ok: false, error: 'Failed to publish course' }, { status: 500 });
  }
}
