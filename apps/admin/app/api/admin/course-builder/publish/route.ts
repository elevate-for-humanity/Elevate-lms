import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { auditCourseTemplate } from '@/lib/course-builder/audit';
import type { ProgramBuilderTemplate } from '@/lib/course-builder/schema';
import { adaptProgramTemplateToBlueprint } from '@/lib/course-builder/publish-adapter';
import { courseFactory } from '@/lib/course-factory';
import { runGovernmentProcurementGate } from '@/lib/course-factory/procurement-gate';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Canonical course publication boundary.
 *
 * Publication is intentionally stricter than draft generation. Every course
 * must pass both the regulatory audit and the enterprise/government procurement
 * readiness gate before Course Factory is allowed to persist a publishable build.
 */
export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = (await req.json()) as ProgramBuilderTemplate;
    const audit = auditCourseTemplate(body);
    const procurement = runGovernmentProcurementGate(body);

    if (!audit.ok || !procurement.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Publication blocked by course governance gate',
          audit,
          procurement,
        },
        { status: 400 },
      );
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
      { ok: result.ok, audit, procurement, result },
      { status: result.ok ? 200 : 422 },
    );
  } catch (error) {
    logger.error('[course-builder/publish]', error);
    return NextResponse.json({ ok: false, error: 'Failed to publish course' }, { status: 500 });
  }
}
