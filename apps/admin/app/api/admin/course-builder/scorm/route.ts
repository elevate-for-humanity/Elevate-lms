import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LinkSchema = z.object({
  courseId: z.string().uuid(),
  scormPackageId: z.string().uuid(),
});

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    const courseId = request.nextUrl.searchParams.get('courseId');
    let query = db
      .from('scorm_packages')
      .select('id,title,description,course_id,active,created_at,updated_at,launch_url,package_url,scorm_version,version')
      .order('created_at', { ascending: false })
      .limit(100);
    if (courseId) query = query.eq('course_id', courseId);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ ok: true, packages: data ?? [] });
  } catch (error) {
    return safeInternalError(error, 'Failed to load SCORM packages');
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const parsed = LinkSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return safeError('courseId and scormPackageId are required', 400);

  try {
    const db = await requireAdminClient();
    const [{ data: course, error: courseError }, { data: pkg, error: packageError }] = await Promise.all([
      db.from('courses').select('id,title').eq('id', parsed.data.courseId).maybeSingle(),
      db.from('scorm_packages').select('id,title,course_id,active,launch_url').eq('id', parsed.data.scormPackageId).maybeSingle(),
    ]);
    if (courseError) throw courseError;
    if (packageError) throw packageError;
    if (!course) return safeError('Course not found', 404);
    if (!pkg) return safeError('SCORM package not found', 404);

    const { data, error } = await db
      .from('scorm_packages')
      .update({ course_id: parsed.data.courseId, active: true, updated_at: new Date().toISOString() })
      .eq('id', parsed.data.scormPackageId)
      .select('id,title,course_id,active,launch_url,package_url,scorm_version,version')
      .maybeSingle();
    if (error) throw error;

    await logAdminAudit({
      action: AdminAction.COURSE_DEFINITIONS_SYNCED,
      actorId: auth.id,
      entityType: 'scorm_packages',
      entityId: parsed.data.scormPackageId,
      metadata: {
        operation: 'scorm.package_linked',
        courseId: parsed.data.courseId,
        previousCourseId: pkg.course_id ?? null,
      },
      req: request,
    });

    return NextResponse.json({ ok: true, package: data });
  } catch (error) {
    return safeInternalError(error, 'Failed to link SCORM package');
  }
}
