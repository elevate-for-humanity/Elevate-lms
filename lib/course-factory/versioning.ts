import type { SupabaseClient } from '@/lib/supabase';

export type CourseSnapshot = {
  course: Record<string, any>;
  program: Record<string, any> | null;
  modules: Array<Record<string, any>>;
  lessons: Array<Record<string, any>>;
};

export type VersionSummary = {
  id: string;
  version: number;
  label: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  createdBy: string | null;
  hasSnapshot: boolean;
};

async function loadSnapshot(db: SupabaseClient, courseId: string): Promise<CourseSnapshot> {
  const [{ data: course, error: courseError }, { data: modules, error: moduleError }, { data: lessons, error: lessonError }] = await Promise.all([
    db.from('courses').select('*').eq('id', courseId).maybeSingle(),
    db.from('course_modules').select('*').eq('course_id', courseId).order('order_index'),
    db.from('course_lessons').select('*').eq('course_id', courseId).order('order_index'),
  ]);
  if (courseError) throw courseError;
  if (moduleError) throw moduleError;
  if (lessonError) throw lessonError;
  if (!course) throw new Error('Course not found');
  let program: Record<string, any> | null = null;
  if (course.program_id) {
    const { data, error } = await db.from('programs').select('id,is_apprenticeship,total_hours').eq('id', course.program_id).maybeSingle();
    if (error) throw error;
    program = data;
  }
  return { course, program, modules: modules ?? [], lessons: lessons ?? [] };
}

function readinessBlockers(snapshot: CourseSnapshot): string[] {
  const blockers: string[] = [];
  const { course, program, modules, lessons } = snapshot;
  if (!modules.length) blockers.push('Course has no modules.');
  if (!lessons.length) blockers.push('Course has no lessons.');
  if (!course.compliance_profile_key) blockers.push('Course has no explicit compliance profile.');
  if (lessons.some((lesson) => !String(lesson.content ?? '').trim() && !lesson.content_json)) {
    blockers.push('One or more lessons have no instructional content.');
  }
  if (lessons.some((lesson) => !Array.isArray(lesson.learning_objectives) || lesson.learning_objectives.length === 0)) {
    blockers.push('One or more lessons are missing learning objectives.');
  }
  const assessments = lessons.filter((lesson) => ['quiz', 'checkpoint', 'exam'].includes(lesson.lesson_type ?? ''));
  if (assessments.some((lesson) => lesson.passing_score == null)) {
    blockers.push('One or more assessments are missing passing scores.');
  }
  const declaredHours = Number(course.duration_hours ?? 0);
  const seatHours = lessons.reduce((sum, lesson) => sum + Number(lesson.minimum_seat_time_minutes ?? lesson.duration_minutes ?? 0), 0) / 60;
  if (program?.is_apprenticeship && declaredHours !== Number(program.total_hours ?? 0)) {
    blockers.push(`Declared hours (${declaredHours}) do not match the linked apprenticeship program (${Number(program.total_hours ?? 0)}).`);
  } else if (!program?.is_apprenticeship && declaredHours > 0 && Math.abs(declaredHours - seatHours) > Math.max(1, declaredHours * 0.05)) {
    blockers.push(`Declared hours (${declaredHours}) do not reconcile with configured lesson seat hours (${seatHours.toFixed(2)}).`);
  }
  if (course.compliance_profile_key === 'dol_apprenticeship') {
    if (!(course.governing_body && course.governing_region)) blockers.push('DOL apprenticeship course is missing governing body/region.');
    if (!lessons.some((lesson) => lesson.lesson_type === 'exam')) blockers.push('DOL apprenticeship course is missing a final exam lesson.');
    if (lessons.some((lesson) => !lesson.hour_category)) blockers.push('DOL apprenticeship course has lessons without hour categories.');
    if (lessons.some((lesson) => !lesson.delivery_method)) blockers.push('DOL apprenticeship course has lessons without delivery methods.');
  }
  return blockers;
}

export async function listCourseVersions(db: SupabaseClient, courseId: string): Promise<VersionSummary[]> {
  const { data, error } = await db
    .from('course_versions')
    .select('id,version_number,label,is_published,published_at,created_at,created_by,snapshot')
    .eq('course_id', courseId)
    .order('version_number', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    version: Number(row.version_number),
    label: row.label ?? null,
    isPublished: Boolean(row.is_published),
    publishedAt: row.published_at ?? null,
    createdAt: row.created_at,
    createdBy: row.created_by ?? null,
    hasSnapshot: Boolean(row.snapshot),
  }));
}

export async function publishCourseVersion(
  db: SupabaseClient,
  courseId: string,
  actorId: string,
  label?: string | null,
): Promise<{ ok: boolean; version?: number; blockers?: string[]; error?: string }> {
  const snapshot = await loadSnapshot(db, courseId);
  if ((snapshot.course.review_status ?? 'draft') !== 'approved') {
    return { ok: false, error: `Course must be approved before publishing. Current review status: '${snapshot.course.review_status ?? 'draft'}'.` };
  }

  const blockers = readinessBlockers(snapshot);
  if (blockers.length) return { ok: false, blockers, error: 'Course readiness blockers must be resolved before publishing.' };

  const { data: latest, error: versionError } = await db
    .from('course_versions')
    .select('version_number')
    .eq('course_id', courseId)
    .order('version_number', { ascending: false })
    .limit(1);
  if (versionError) throw versionError;

  const nextVersion = Math.max(Number(latest?.[0]?.version_number ?? 0), Number(snapshot.course.version ?? 0)) + 1;
  const now = new Date().toISOString();
  const { error: insertError } = await db.from('course_versions').insert({
    course_id: courseId,
    version_number: nextVersion,
    label: label?.trim() || `v${nextVersion}`,
    is_published: true,
    published_at: now,
    created_by: actorId,
    created_at: now,
    org_id: snapshot.course.org_id ?? null,
    snapshot,
  });
  if (insertError) throw insertError;

  const { error: courseUpdateError } = await db.from('courses').update({
    version: nextVersion,
    status: 'published',
    review_status: 'published',
    is_active: true,
    published_at: now,
    published_by: actorId,
    updated_at: now,
  }).eq('id', courseId);
  if (courseUpdateError) throw courseUpdateError;

  const [{ error: moduleUpdateError }, { error: lessonUpdateError }] = await Promise.all([
    db.from('course_modules').update({ is_published: true, is_draft: false, updated_at: now }).eq('course_id', courseId),
    db.from('course_lessons').update({ status: 'published', is_published: true, published_at: now, published_by: actorId, updated_at: now }).eq('course_id', courseId),
  ]);
  if (moduleUpdateError) throw moduleUpdateError;
  if (lessonUpdateError) throw lessonUpdateError;

  return { ok: true, version: nextVersion };
}

function courseRestorePayload(course: Record<string, any>, now: string) {
  return {
    program_id: course.program_id ?? null,
    slug: course.slug,
    title: course.title,
    short_description: course.short_description ?? null,
    description: course.description ?? null,
    course_name: course.course_name ?? course.title,
    thumbnail_url: course.thumbnail_url ?? null,
    total_lessons: course.total_lessons ?? 0,
    duration_hours: course.duration_hours ?? 0,
    compliance_profile_key: course.compliance_profile_key ?? null,
    governing_body: course.governing_body ?? null,
    governing_region: course.governing_region ?? null,
    governing_standard_version: course.governing_standard_version ?? null,
    retention_policy_days: course.retention_policy_days ?? null,
    audit_notes: course.audit_notes ?? null,
    category: course.category ?? null,
    passing_score: course.passing_score ?? null,
    course_code: course.course_code ?? null,
    course_slug: course.course_slug ?? course.slug,
    status: 'draft',
    review_status: 'draft',
    is_active: false,
    published_at: null,
    published_by: null,
    submitted_for_review_at: null,
    submitted_by: null,
    reviewed_at: null,
    reviewed_by: null,
    review_notes: null,
    updated_at: now,
  };
}

function sanitizeModule(row: Record<string, any>, courseId: string, now: string) {
  const { created_at: _createdAt, updated_at: _updatedAt, ...rest } = row;
  return { ...rest, course_id: courseId, is_published: false, is_draft: true, updated_at: now };
}

function sanitizeLesson(row: Record<string, any>, courseId: string, now: string) {
  const { created_at: _createdAt, updated_at: _updatedAt, ...rest } = row;
  return {
    ...rest,
    course_id: courseId,
    status: 'draft',
    is_published: false,
    approved: false,
    locked: false,
    published_at: null,
    published_by: null,
    updated_at: now,
  };
}

export async function rollbackCourseVersion(
  db: SupabaseClient,
  courseId: string,
  version: number,
  actorId: string,
): Promise<{ ok: boolean; rolledBackTo?: number; error?: string }> {
  const { data: row, error } = await db
    .from('course_versions')
    .select('version_number,snapshot')
    .eq('course_id', courseId)
    .eq('version_number', version)
    .maybeSingle();
  if (error) throw error;
  if (!row) return { ok: false, error: `Version ${version} not found.` };
  if (!row.snapshot) return { ok: false, error: `Version ${version} predates snapshot payload support and cannot be automatically rolled back.` };

  const snapshot = row.snapshot as CourseSnapshot;
  if (!snapshot?.course || !Array.isArray(snapshot.modules) || !Array.isArray(snapshot.lessons)) {
    return { ok: false, error: `Version ${version} contains an invalid snapshot.` };
  }

  const now = new Date().toISOString();
  const { error: courseError } = await db.from('courses').update(courseRestorePayload(snapshot.course, now)).eq('id', courseId);
  if (courseError) throw courseError;

  const snapshotModuleIds = snapshot.modules.map((module) => module.id).filter(Boolean);
  const snapshotLessonIds = snapshot.lessons.map((lesson) => lesson.id).filter(Boolean);

  if (snapshot.modules.length) {
    const { error: moduleUpsertError } = await db.from('course_modules').upsert(
      snapshot.modules.map((module) => sanitizeModule(module, courseId, now)),
      { onConflict: 'id' },
    );
    if (moduleUpsertError) throw moduleUpsertError;
  }

  if (snapshot.lessons.length) {
    const { error: lessonUpsertError } = await db.from('course_lessons').upsert(
      snapshot.lessons.map((lesson) => sanitizeLesson(lesson, courseId, now)),
      { onConflict: 'id' },
    );
    if (lessonUpsertError) throw lessonUpsertError;
  }

  let extraModules = db.from('course_modules').update({ is_published: false, is_draft: true, updated_at: now }).eq('course_id', courseId);
  if (snapshotModuleIds.length) extraModules = extraModules.not('id', 'in', `(${snapshotModuleIds.join(',')})`);
  const { error: extraModuleError } = await extraModules;
  if (extraModuleError) throw extraModuleError;

  let extraLessons = db.from('course_lessons').update({ status: 'draft', is_published: false, approved: false, locked: false, updated_at: now }).eq('course_id', courseId);
  if (snapshotLessonIds.length) extraLessons = extraLessons.not('id', 'in', `(${snapshotLessonIds.join(',')})`);
  const { error: extraLessonError } = await extraLessons;
  if (extraLessonError) throw extraLessonError;

  const { error: logError } = await db.from('program_review_log').insert({
    course_id: courseId,
    program_id: null,
    action: 'rolled_back',
    from_status: 'published',
    to_status: 'draft',
    actor_id: actorId,
    notes: `Restored canonical course content from version ${version}; current learner progress records were not deleted.`,
    created_at: now,
  });
  if (logError) throw logError;

  return { ok: true, rolledBackTo: version };
}
