import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeDbError, safeError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ScormPackageRow = {
  id: string;
  title?: string | null;
  course_id?: string | null;
  status?: string | null;
  active?: boolean | null;
  created_at?: string | null;
  launch_url?: string | null;
};

function normalizeScormPackage(row: ScormPackageRow) {
  return {
    id: row.id,
    title: row.title ?? null,
    course_id: row.course_id ?? null,
    status: row.status ?? (row.active === false ? 'inactive' : 'active'),
    created_at: row.created_at ?? null,
    launch_url: row.launch_url ?? null,
  };
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();

  const { data, error } = await db
    .from('scorm_packages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    logger.warn('[course-builder/scorm-link] SCORM package feed unavailable', {
      code: error.code,
      details: error.details,
      message: error.message,
    });
    return NextResponse.json({
      packages: [],
      warning: 'SCORM package feed unavailable',
    });
  }

  return NextResponse.json({
    packages: ((data ?? []) as ScormPackageRow[]).map(normalizeScormPackage),
  });
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const courseId = String(body?.courseId ?? '').trim();
  const scormPackageId = String(body?.scormPackageId ?? '').trim();

  if (!courseId || !scormPackageId) {
    return safeError('courseId and scormPackageId are required', 400);
  }

  const db = await requireAdminClient();

  const { data, error } = await db
    .from('scorm_packages')
    .update({
      course_id: courseId,
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', scormPackageId)
    .select('id, title, course_id, status, launch_url')
    .maybeSingle();

  if (error) return safeDbError(error, 'Failed to link SCORM package');
  if (!data) return safeError('SCORM package not found', 404);

  await db.from('audit_logs').insert({
    user_id: auth.id,
    action: 'course_builder.scorm.linked',
    resource_type: 'scorm_packages',
    resource_id: scormPackageId,
    metadata: {
      courseId,
      scormPackageId,
      launchUrl: data.launch_url,
    },
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, package: data });
}