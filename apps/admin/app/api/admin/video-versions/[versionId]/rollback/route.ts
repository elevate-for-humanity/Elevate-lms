import { NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { rollbackLessonVideoVersion } from '@/lib/video/review';

export async function POST(request: Request, { params }: { params: Promise<{ versionId: string }> }) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const { versionId } = await params;
    return NextResponse.json(await rollbackLessonVideoVersion({ versionId, reviewerId: auth.id }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Rollback failed' }, { status: 409 });
  }
}
