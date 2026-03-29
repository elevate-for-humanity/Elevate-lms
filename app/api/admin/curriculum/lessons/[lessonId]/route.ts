/**
 * PATCH /api/admin/curriculum/lessons/[lessonId]
 *
 * Updates a curriculum_lessons row. Uses the service-role client so the write
 * is not blocked by the authenticated-only RLS policy on curriculum_lessons.
 * Auth is enforced here — admin/super_admin/staff only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { safeInternalError, safeError, safeDbError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Fields an admin is allowed to patch on a curriculum_lessons row.
const ALLOWED_FIELDS = [
  'lesson_title',
  'step_type',
  'passing_score',
  'module_order',
  'lesson_order',
  'duration_minutes',
  'status',
  'script_text',
  'video_file',
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];

async function _PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  // Auth check — user client (cookie-based)
  const userClient = await createClient();
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return safeError('Unauthorized', 401);

  const { data: profile } = await userClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    return safeError('Forbidden', 403);
  }

  const { lessonId } = await params;
  if (!lessonId) return safeError('lessonId required', 400);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return safeError('Invalid JSON body', 400);
  }

  // Whitelist — only allow known safe fields
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of ALLOWED_FIELDS) {
    if (field in body) patch[field] = body[field as AllowedField];
  }

  if (Object.keys(patch).length === 1) {
    // Only updated_at — nothing to do
    return NextResponse.json({ lesson: null, message: 'No updatable fields provided' });
  }

  // Write via service-role client — bypasses RLS (auth enforced above)
  const db = createAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  try {
    const { data, error } = await db
      .from('curriculum_lessons')
      .update(patch)
      .eq('id', lessonId)
      .select('id, lesson_slug, lesson_title, step_type, passing_score, module_order, lesson_order, duration_minutes, status')
      .single();

    if (error) return safeDbError(error, 'Failed to update lesson');
    return NextResponse.json({ lesson: data });
  } catch (err) {
    return safeInternalError(err, 'Failed to update curriculum lesson');
  }
}

export const PATCH = withApiAudit(
  '/api/admin/curriculum/lessons/[lessonId]',
  (req, ctx) => _PATCH(req, ctx as { params: Promise<{ lessonId: string }> }),
);
