export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { importScormPackage, getScormRegistration } from '@/lib/scormCloud';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

/**
 * POST /api/admin/scorm — Import a SCORM package via SCORM Cloud
 */
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

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

/**
 * GET /api/admin/scorm?registrationId=xxx — Get SCORM registration status
 */
export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

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
