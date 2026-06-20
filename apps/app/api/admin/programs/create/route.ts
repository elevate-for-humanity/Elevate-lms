export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/programs/create
 *
 * Canonical program creation endpoint.
 * Accepts a ProgramCreateInput payload and runs the full pipeline:
 *   programs → courses → course_modules → course_lessons
 *   → module_completion_rules → publish_course() (when publish:true)
 *
 * This is the only route that should create new LMS programs.
 * Seed scripts and manual SQL inserts are not the production path.
 *
 * Auth: admin, super_admin, or staff only.
 * Rate limit: strict (3 req / 5 min) — program creation is a heavyweight write.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { createAndPublishProgram } from '@/lib/programs/create-and-publish-program';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError, safeError } from '@/lib/api/safe-error';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const result = await createAndPublishProgram(body);
    return NextResponse.json({ ok: true, result }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      const isClientError =
        error.message.includes('is required') ||
        error.message.includes('duplicate') ||
        error.message.includes('missing') ||
        error.message.includes('requires passingScore') ||
        error.message.includes('PUBLISH_BLOCKED');
      if (isClientError) return safeError(error.message, 400);
    }
    return safeInternalError(error, 'Program creation failed');
  }
}
