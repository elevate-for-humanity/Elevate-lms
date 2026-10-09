import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { UltimateJobQueue } from '@/lib/ultimate-course-builder/worker/job-queue';
import { dispatchGoogleDeployment } from '@/lib/gcp/dispatch-production-workflow';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'strict');
  if (limited) return limited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  const body = await req.json().catch(() => null);
  if (typeof body?.buildId !== 'string' || !/^[a-f0-9-]{36}$/i.test(body.buildId))
    return NextResponse.json({ error: 'A valid buildId is required' }, { status: 400 });
  try {
    const db = await requireAdminClient();
    const { data: build, error } = await db.from('ultimate_course_builds')
      .select('id,status').eq('id', body.buildId).single();
    if (error || !build) return NextResponse.json({ error: 'Ultimate build not found' }, { status: 404 });
    if (['built', 'published'].includes(build.status))
      return NextResponse.json({ error: 'This build has finished. Use the verified release action.' }, { status: 409 });
    // Enqueue is idempotent: keep the same checkpoints and any existing lease.
    const job = await new UltimateJobQueue(db as any).enqueue(build.id, { requestedBy: auth.id });
    if (!job) return NextResponse.json({ error: 'No runnable build job was saved' }, { status: 409 });
    const dispatch = await dispatchGoogleDeployment('course-builder');
    return NextResponse.json({
      ok: true, queued: true, dispatched: true, buildId: build.id, jobId: job.id,
      executionVerified: false, actionsUrl: dispatch.actionsUrl,
    }, { status: 202 });
  } catch (error) {
    return safeInternalError(error, 'Build could not be started on Google. Refresh to check the saved job.');
  }
}
