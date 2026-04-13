/**
 * POST /api/admin/course-builder/compile
 *
 * Runs the full curriculum compiler against a CourseTemplate.
 * Expands module rules, injects quizzes/labs/exam, assigns durations,
 * attaches competencies, validates, and persists to DB.
 *
 * Body: { template: CourseTemplate, mode?: 'missing-only' | 'replace', dryRun?: boolean }
 * Returns: { success, plan, pipelineResult, errors }
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';
import { getAdminClient } from '@/lib/supabase/admin';
import { compileBlueprintToCourse } from '@/lib/course-builder/compiler';
import type { CourseTemplate } from '@/lib/course-builder/schema';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rl = await applyRateLimit(request, 'strict');
  if (rl) return rl;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let body: { template: CourseTemplate; mode?: 'missing-only' | 'replace'; dryRun?: boolean };
  try {
    body = await request.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }

  if (!body.template) return safeError('template is required', 400);

  const db = await getAdminClient();

  try {
    const result = await compileBlueprintToCourse({
      template: body.template,
      db,
      mode: body.mode ?? 'missing-only',
      dryRun: body.dryRun ?? false,
    });

    return NextResponse.json(result, { status: result.success ? 200 : 422 });
  } catch (err) {
    return safeInternalError(err, 'Compiler failed');
  }
}
