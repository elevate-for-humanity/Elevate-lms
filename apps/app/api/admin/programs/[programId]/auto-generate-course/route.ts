import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { autoGenerateCourseForProgram } from '@/lib/course-builder/program-auto-course';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { programId } = await params;
  if (!programId) return safeError('programId is required', 400);

  const body = await request.json().catch(() => ({}));
  const mode = body?.mode === 'replace' ? 'replace' : 'missing-only';
  const videoMode = body?.videoMode === 'off' ? 'off' : 'queue';
  const videoQueueLimit =
    typeof body?.videoQueueLimit === 'number' ? Number(body.videoQueueLimit) : null;

  try {
    const result = await autoGenerateCourseForProgram({
      programId,
      mode,
      videoMode,
      videoQueueLimit,
    });

    if (!result.ok && result.status === 'not_found') {
      return safeError(result.error, 404);
    }

    if (!result.ok && result.status === 'no_blueprint') {
      return NextResponse.json({ ok: false, ...result }, { status: 422 });
    }

    if (!result.ok) {
      return NextResponse.json({ ok: false, ...result }, { status: 422 });
    }

    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (error) {
    return safeInternalError(error, 'Auto course generation failed');
  }
}
