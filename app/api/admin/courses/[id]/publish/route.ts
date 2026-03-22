import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { runAndPersistAudit } from '@/lib/services/course-publish-auditor';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/courses/[id]/publish
 *
 * Runs the full publish auditor, then publishes the course only if
 * no fatal or blocking issues exist.
 *
 * Returns 422 with the full defect list if blocked.
 * Returns 200 with the updated course on success.
 *
 * Requires admin/super_admin/staff role.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  const { user } = auth;

  const courseId = params.id;
  if (!courseId) return safeError('Course ID required', 400);

  // Run auditor — this is the single gate
  const audit = await runAndPersistAudit(courseId, user.id);

  if (!audit.publishable) {
    return NextResponse.json({
      error:    'Course publish blocked — resolve all fatal and blocking issues first.',
      publishable: false,
      issues:   audit.issues,
      summary: {
        fatal:    audit.issues.filter(i => i.severity === 'fatal').length,
        blocking: audit.issues.filter(i => i.severity === 'blocking').length,
        warning:  audit.issues.filter(i => i.severity === 'warning').length,
      },
    }, { status: 422 });
  }

  // All checks passed — publish
  const db = createAdminClient();
  const { data: course, error: publishErr } = await db
    .from('courses')
    .update({
      status:       'published',
      published_at: new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    })
    .eq('id', courseId)
    .select('id, title, slug, status, published_at')
    .single();

  if (publishErr) return safeDbError(publishErr, 'Failed to publish course');

  return NextResponse.json({
    publishable: true,
    course,
    warnings: audit.issues.filter(i => i.severity === 'warning'),
  });
}
