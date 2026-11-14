import { NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { reviewLessonVideoCandidate } from '@/lib/video/review';

export async function POST(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const { jobId } = await params;
    const body = await request.json() as { decision?: string; notes?: string };
    if (body.decision !== 'approve' && body.decision !== 'reject') return NextResponse.json({ error: 'Decision must be approve or reject' }, { status: 400 });
    return NextResponse.json(await reviewLessonVideoCandidate({ jobId, reviewerId: auth.id, decision: body.decision, notes: body.notes }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Review failed' }, { status: 409 });
  }
}
