import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, _context: RouteContext) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  // The former implementation only relabeled the task; it never restored files.
  // Do not acknowledge a rollback until a verified restore capability exists.
  return NextResponse.json({
    error: 'Automatic task rollback is unavailable. Restore a reviewed Git revision and redeploy. Task state has not been changed.',
    code: 'TASK_ROLLBACK_UNAVAILABLE',
  }, { status: 501 });
}
