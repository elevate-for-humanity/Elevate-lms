import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/lms/practical-requirements?lesson_id=
 * Returns the practical_requirements row for a lesson (public read for enrolled learners).
 */
export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get('lesson_id');
  if (!lessonId) return safeError('lesson_id required', 400);

  const db = createAdminClient();
  const { data, error } = await db
    .from('practical_requirements')
    .select('practical_type, required_hours, required_attempts, requires_evaluator_approval, requires_skill_signoff, allowed_submission_modes, instructions, rubric_json, safety_guidance, materials_needed')
    .eq('lesson_id', lessonId)
    .maybeSingle();

  if (error) return safeDbError(error, 'Failed to fetch practical requirements');
  return NextResponse.json({ requirement: data ?? null });
}
