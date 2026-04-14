import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { auditCourseTemplate } from '@/lib/course-builder/audit';
import type { ProgramBuilderTemplate } from '@/lib/course-builder/schema';
import { runCoursePublishPipeline } from '@/lib/course-builder/pipeline';
import { adaptProgramTemplateForPublish } from '@/lib/course-builder/publish-adapter';
import { getServiceDb } from '@/lib/course-builder/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = (await req.json()) as ProgramBuilderTemplate;

    // Hard gate — audit must pass before any DB writes
    const audit = auditCourseTemplate(body);
    if (!audit.ok) {
      return NextResponse.json({ ok: false, error: 'Audit failed', audit }, { status: 400 });
    }

    const adapted = adaptProgramTemplateForPublish(body);
    const db = getServiceDb();

    const result = await runCoursePublishPipeline({
      template: adapted as any,
      db,
      mode: 'missing-only',
    });

    return NextResponse.json({ ok: result.success, audit, result });
  } catch (error) {
    console.error('[course-builder/publish]', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to publish course' },
      { status: 500 },
    );
  }
}
