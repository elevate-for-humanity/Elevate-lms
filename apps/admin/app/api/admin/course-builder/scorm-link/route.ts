import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
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

/** Read-only SCORM discovery remains a capability feed, not orchestration. */
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
    return NextResponse.json({ packages: [], warning: 'SCORM package feed unavailable' });
  }

  return NextResponse.json({ packages: ((data ?? []) as ScormPackageRow[]).map(normalizeScormPackage) });
}

/** RETIRED mutation: linking is owned by root action=link-scorm. */
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  return NextResponse.json({
    error: 'COURSE_BUILDER_ROOT_REQUIRED',
    canonicalEndpoint: '/api/admin/course-builder',
    action: 'link-scorm',
  }, { status: 410 });
}
