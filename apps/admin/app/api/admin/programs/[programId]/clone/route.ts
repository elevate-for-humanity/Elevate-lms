/**
 * Deep-clone a program into a new draft.
 *
 * Program-owned records are cloned here. Any canonical LMS course package attached
 * to the source program is cloned only through Course Builder's clone service.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { cloneCanonicalCourse } from '@/lib/course-builder/clone-service';
import { resolveCourseIdFromDb } from '@/lib/course-builder/program-resolver';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function stripRow(row: Record<string, any>, keys: string[]) {
  const copy = { ...row };
  for (const key of keys) delete copy[key];
  return copy;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { programId } = await params;
  const body = await request.json().catch(() => ({}));
  const db = await requireAdminClient();

  const { data: source, error: sourceError } = await db
    .from('programs')
    .select('*')
    .eq('id', programId)
    .maybeSingle();
  if (sourceError) return safeInternalError(sourceError, 'Failed to load source program');
  if (!source) return safeError('Program not found', 404);

  const newTitle = typeof body.title === 'string' && body.title.trim()
    ? body.title.trim()
    : `${source.title} (Copy)`;
  const baseSlug = typeof body.slug === 'string' && body.slug.trim()
    ? body.slug.trim()
    : `${source.slug}-copy`;

  let newSlug = baseSlug;
  for (let attempt = 1; ; attempt += 1) {
    const { data: existing, error } = await db
      .from('programs')
      .select('id')
      .eq('slug', newSlug)
      .maybeSingle();
    if (error) return safeInternalError(error, 'Failed to resolve program slug');
    if (!existing) break;
    newSlug = `${baseSlug}-${attempt + 1}`;
  }

  const now = new Date().toISOString();
  const programRest = stripRow(source as Record<string, any>, [
    'id', 'created_at', 'updated_at', 'slug', 'title', 'status', 'published',
  ]);
  const { data: newProgram, error: programError } = await db
    .from('programs')
    .insert({
      ...programRest,
      title: newTitle,
      slug: newSlug,
      status: 'draft',
      published: false,
      is_active: false,
      created_at: now,
      updated_at: now,
    })
    .select('id,slug,title')
    .single();
  if (programError || !newProgram) {
    return safeInternalError(programError ?? new Error('Program clone was not created'), 'Failed to create program clone');
  }

  const warnings: string[] = [];
  const copySimpleRows = async (table: string, orderColumn?: string) => {
    const dynamicDb = db as any;
    let query = dynamicDb.from(table).select('*').eq('program_id', programId);
    if (orderColumn) query = query.order(orderColumn);
    const { data, error } = await query;
    if (error) {
      warnings.push(`${table}: load failed`);
      logger.error('[program-clone] related row load failed', undefined, { table, programId, error: error.message });
      return;
    }
    if (!data?.length) return;
    const rows = data.map((row: Record<string, any>) => ({
      ...stripRow(row, ['id', 'program_id', 'created_at', 'updated_at']),
      program_id: newProgram.id,
      created_at: row.created_at ? now : undefined,
      updated_at: row.updated_at ? now : undefined,
    }));
    for (const row of rows) {
      if (row.created_at === undefined) delete row.created_at;
      if (row.updated_at === undefined) delete row.updated_at;
    }
    const { error: insertError } = await dynamicDb.from(table).insert(rows);
    if (insertError) {
      warnings.push(`${table}: insert failed`);
      logger.error('[program-clone] related row insert failed', undefined, { table, programId, error: insertError.message });
    }
  };

  await copySimpleRows('program_outcomes', 'outcome_order');
  await copySimpleRows('program_credentials', 'sort_order');
  await copySimpleRows('program_ctas', 'sort_order');
  await copySimpleRows('program_tracks', 'sort_order');

  const { data: modules, error: moduleLoadError } = await db
    .from('program_modules')
    .select('*, program_lessons(*)')
    .eq('program_id', programId)
    .order('sort_order');
  if (moduleLoadError) {
    warnings.push('program_modules: load failed');
  } else {
    for (const module of modules ?? []) {
      const lessons = Array.isArray((module as any).program_lessons) ? (module as any).program_lessons : [];
      const moduleRow = stripRow(module as Record<string, any>, [
        'id', 'program_id', 'program_lessons', 'created_at', 'updated_at',
      ]);
      const { data: newModule, error: moduleError } = await db
        .from('program_modules')
        .insert({ ...moduleRow, program_id: newProgram.id })
        .select('id')
        .single();
      if (moduleError || !newModule) {
        warnings.push(`program module '${module.title}': insert failed`);
        continue;
      }
      if (lessons.length) {
        const lessonRows = lessons.map((lesson: Record<string, any>) => ({
          ...stripRow(lesson, ['id', 'module_id', 'created_at', 'updated_at']),
          module_id: newModule.id,
        }));
        const { error: lessonError } = await db.from('program_lessons').insert(lessonRows);
        if (lessonError) warnings.push(`program lessons in '${module.title}': insert failed`);
      }
    }
  }

  try {
    const sourceCourseId = await resolveCourseIdFromDb(db, source.slug);
    if (sourceCourseId) {
      await cloneCanonicalCourse({
        courseId: sourceCourseId,
        title: newTitle,
        slug: newSlug,
        programId: newProgram.id,
        programSlug: newSlug,
      });
    }
  } catch (error) {
    warnings.push('canonical course package: clone failed');
    logger.error('[program-clone] canonical course clone failed', error, { programId, newProgramId: newProgram.id });
  }

  return NextResponse.json({
    ok: warnings.length === 0,
    program: newProgram,
    ...(warnings.length ? { warnings } : {}),
  }, { status: warnings.length ? 207 : 200 });
}
