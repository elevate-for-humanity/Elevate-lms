import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { auditCourseTemplate } from '@/lib/course-builder/audit';
import type { ProgramBuilderTemplate } from '@/lib/course-builder/schema';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

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
