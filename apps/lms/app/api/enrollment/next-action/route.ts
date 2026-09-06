import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getNextRequiredAction } from '@/lib/enrollment/gate';
import { resolveLatestEnrollment } from '@/lib/enrollment/resolver';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function actionCode(label: string, progress: number): string {
  if (label === 'Complete Orientation') return 'ORIENTATION';
  if (label === 'Submit Required Documents') return 'DOCUMENTS';
  if (label === 'Go to Your Dashboard') return 'OPEN_DASHBOARD';
  if (label === 'Begin Your Program') return progress > 0 ? 'CONTINUE_LEARNING' : 'START_COURSE_1';
  return 'EXPLORE_PROGRAMS';
}

async function _GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await createClient();
  const enrollment = await resolveLatestEnrollment({ client: db, userId: user.id });
  if (!enrollment) {
    return NextResponse.json({
      action: 'EXPLORE_PROGRAMS',
      route: '/programs',
      cta: 'Explore programs',
      description: 'Choose the workforce program that matches your goal.',
      why: 'No active enrollment is connected to your learner account.',
      estimated_minutes: 5,
    });
  }

  const next = getNextRequiredAction({
    status: enrollment.status,
    orientation_completed_at: enrollment.orientationCompletedAt,
    documents_submitted_at: enrollment.documentsSubmittedAt,
    program_slug: enrollment.programSlug ?? undefined,
    course_id: enrollment.courseId,
  });
  const code = actionCode(next.label, enrollment.progress);
  const continuing = code === 'CONTINUE_LEARNING';
  return NextResponse.json({
    action: code,
    route: next.href,
    cta: continuing ? 'Continue learning' : next.label,
    description: continuing
      ? `Resume ${enrollment.programTitle ?? 'your program'} at ${Math.round(enrollment.progress)}% complete.`
      : next.description,
    why: continuing
      ? 'This is the next open activity in your active program.'
      : 'This required step unlocks the next part of your learner journey.',
    program_name: enrollment.programTitle,
    progress_percentage: enrollment.progress,
    estimated_minutes: continuing ? 30 : code === 'DOCUMENTS' ? 10 : 15,
  });
}

export const GET = withApiAudit('/api/enrollment/next-action', _GET);
