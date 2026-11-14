import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { auditCourseTemplate } from '@/lib/course-builder/audit';
import { runPersistedCourseProcurementHealthCheckWithClient } from '@/lib/course-builder/persisted-publish-service';
import { requireAdminClient } from '@/lib/supabase/admin';
import type { ProgramBuilderTemplate } from '@/lib/course-builder/schema';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const courseId = req.nextUrl.searchParams.get('courseId')?.trim();
  if (!courseId) return NextResponse.json({ ok: false, error: 'courseId is required' }, { status: 400 });

  try {
    const result = await runPersistedCourseProcurementHealthCheckWithClient(
      await requireAdminClient(),
      courseId,
    );
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    logger.error('[course-builder/audit] persisted audit failed', error);
    return NextResponse.json({ ok: false, error: 'Unable to audit persisted course' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = (await req.json()) as ProgramBuilderTemplate;
    const audit = auditCourseTemplate(body);
    return NextResponse.json({ ok: true, audit });
  } catch (error) {
    logger.error('[course-builder/audit]', error);
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 });
  }
}
