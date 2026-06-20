/**
 * GET  /api/admin/course-builder/program-map
 *   Returns all registered program → course mappings.
 *
 * POST /api/admin/course-builder/program-map
 *   Registers or updates a program → course mapping.
 *   Body: { program_slug: string; course_id: string }
 *
 * DELETE /api/admin/course-builder/program-map
 *   Removes a mapping. Body: { program_slug: string }
 *
 * This replaces the hardcoded PROGRAM_COURSE_MAP in lib/course-builder/schema.ts.
 * New programs can be registered here without a code deploy.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import {
  listProgramCourseMappings,
  registerProgramCourse,
  unregisterProgramCourse,
} from '@/lib/course-builder/program-resolver';

export const dynamic = 'force-dynamic';

// ── GET — list all mappings ───────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const rl = await applyRateLimit(request, 'api');
  if (rl) return rl;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const mappings = await listProgramCourseMappings(db);
  return NextResponse.json({ ok: true, mappings });
}

// ── POST — register or update a mapping ──────────────────────────────────────

const registerSchema = z.object({
  program_slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'must be lowercase kebab-case'),
  course_id: z.string().uuid('must be a valid UUID'),
});

export async function POST(request: NextRequest) {
  const rl = await applyRateLimit(request, 'strict');
  if (rl) return rl;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let body: z.infer<typeof registerSchema>;
  try {
    body = registerSchema.parse(await request.json());
  } catch (err) {
    return safeError('Invalid body — program_slug (kebab-case) and course_id (UUID) required', 400);
  }

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  // Verify the course_id actually exists before registering.
  const { data: course, error: courseErr } = await db
    .from('courses')
    .select('id, title, status')
    .eq('id', body.course_id)
    .maybeSingle();

  if (courseErr) return safeInternalError(courseErr, 'Failed to verify course');
  if (!course) return safeError(`course_id '${body.course_id}' not found in courses table`, 404);

  const result = await registerProgramCourse(db, body.program_slug, body.course_id);
  if (!result.ok) return safeError(result.error ?? 'Failed to register mapping', 500);

  return NextResponse.json({
    ok: true,
    mapping: { program_slug: body.program_slug, course_id: body.course_id },
    course: { title: course.title, status: course.status },
  });
}

// ── DELETE — remove a mapping ─────────────────────────────────────────────────

const deleteSchema = z.object({
  program_slug: z.string().min(1),
});

export async function DELETE(request: NextRequest) {
  const rl = await applyRateLimit(request, 'strict');
  if (rl) return rl;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let body: z.infer<typeof deleteSchema>;
  try {
    body = deleteSchema.parse(await request.json());
  } catch {
    return safeError('program_slug required', 400);
  }

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const result = await unregisterProgramCourse(db, body.program_slug);
  if (!result.ok) return safeError(result.error ?? 'Failed to remove mapping', 500);

  return NextResponse.json({ ok: true, removed: body.program_slug });
}
