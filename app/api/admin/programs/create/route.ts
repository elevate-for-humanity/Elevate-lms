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
import { createClient } from '@/lib/supabase/server';
import { createAndPublishProgram } from '@/lib/programs/create-and-publish-program';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // createAndPublishProgram validates the payload and throws with a clear
    // message on any missing field, duplicate slug, or publish guard failure.
    const result = await createAndPublishProgram(body);

    return NextResponse.json({ ok: true, result }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      // Validation and publish guard errors are client errors (400), not server errors.
      const isClientError =
        error.message.includes('is required') ||
        error.message.includes('duplicate') ||
        error.message.includes('missing') ||
        error.message.includes('requires passingScore') ||
        error.message.includes('PUBLISH_BLOCKED');

      if (isClientError) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      }
    }
    return safeInternalError(error, 'Program creation failed');
  }
}
