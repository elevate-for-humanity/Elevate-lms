import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { listProgramCourseMappings, registerProgramCourse, unregisterProgramCourse } from '@/lib/course-builder/program-resolver';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rl = await applyRateLimit(request, 'api'); if (rl) return rl;
  const auth = await apiRequireAdmin(request); if (auth.error) return auth.error;
  const db = await requireAdminClient();
  const mappings = await listProgramCourseMappings(db);
  return NextResponse.json({ ok: true, mappings });
}

const registerSchema = z.object({ program_slug: z.string().min(1).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/), course_id: z.string().uuid() });
export async function POST(request: NextRequest) {
  const rl = await applyRateLimit(request, 'strict'); if (rl) return rl;
  const auth = await apiRequireAdmin(request); if (auth.error) return auth.error;
  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return safeError('program_slug and course_id required', 400);
  const db = await requireAdminClient();
  const { data: course, error } = await db.from('courses').select('id,title,status').eq('id', parsed.data.course_id).maybeSingle();
  if (error) return safeInternalError(error, 'Failed to verify course');
  if (!course) return safeError('Course not found', 404);
  const result = await registerProgramCourse(db, parsed.data.program_slug, parsed.data.course_id);
  if (!result.ok) return safeError(result.error ?? 'Failed to register mapping', 500);
  return NextResponse.json({ ok: true, mapping: parsed.data, course: { title: course.title, status: course.status } });
}

const deleteSchema = z.object({ program_slug: z.string().min(1) });
export async function DELETE(request: NextRequest) {
  const rl = await applyRateLimit(request, 'strict'); if (rl) return rl;
  const auth = await apiRequireAdmin(request); if (auth.error) return auth.error;
  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return safeError('program_slug required', 400);
  const db = await requireAdminClient();
  const result = await unregisterProgramCourse(db, parsed.data.program_slug);
  if (!result.ok) return safeError(result.error ?? 'Failed to remove mapping', 500);
  return NextResponse.json({ ok: true, removed: parsed.data.program_slug });
}
