import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { importScormPackage, getScormRegistration } from '@/lib/scormCloud';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  await requireAdmin();

  try {
    const { courseId, fileUrl } = await request.json();
    if (!courseId || !fileUrl) {
      return NextResponse.json({ error: 'courseId and fileUrl are required' }, { status: 400 });
    }

    const result = await importScormPackage(courseId, fileUrl);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    logger.error('SCORM import failed', error as Error);
    return NextResponse.json({ error: 'SCORM import failed' }, { status: 500 });
  }
}

async function _GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  await requireAdmin();

  try {
    const registrationId = request.nextUrl.searchParams.get('registrationId');
    if (!registrationId) {
      return NextResponse.json({ error: 'registrationId is required' }, { status: 400 });
    }

    const result = await getScormRegistration(registrationId);
    return NextResponse.json({ data: result });
  } catch (error) {
    logger.error('SCORM registration fetch failed', error as Error);
    return NextResponse.json({ error: 'Failed to fetch registration' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/admin/scorm', _GET);
export const POST = withApiAudit('/api/admin/scorm', _POST);
