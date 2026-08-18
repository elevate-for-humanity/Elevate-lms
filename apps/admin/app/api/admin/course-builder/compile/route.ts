/** Canonical curriculum compiler endpoint for the unified Course Builder. */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';
import { compileBlueprintToCourse } from '@/lib/course-builder/compiler';
import type { CourseTemplate } from '@/lib/course-builder/schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const rl = await applyRateLimit(request, 'strict');
  if (rl) return rl;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  let body: {
    template: CourseTemplate;
    mode?: 'missing-only' | 'replace' | 'refresh';
    dryRun?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }
  if (!body.template) return safeError('template is required', 400);
  try {
    const db = await requireAdminClient();
    const result = await compileBlueprintToCourse({
      template: body.template,
      db,
      mode: body.mode ?? 'refresh',
      dryRun: body.dryRun ?? false,
    });
    return NextResponse.json(result, { status: result.success ? 200 : 422 });
  } catch (err) {
    return safeInternalError(err, 'Compiler failed');
  }
}
